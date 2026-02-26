import type { AxiosError } from 'axios';

import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { useAppDispatch } from 'src/redux/hooks';
import { showAlert } from 'src/redux/slices/alertSlice';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  getCustomers,
  type Customer,
  deleteCustomer,
} from 'src/redux/apis/customersApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { emptyRows } from '../utils';
import { CustomerDeleteDialog } from '../customer-delete-dialog';

// ----------------------------------------------------------------------

function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onResetPage = useCallback(() => setPage(0), []);

  const onChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    rowsPerPage,
    onResetPage,
    onChangePage,
    onChangeRowsPerPage,
  };
}

function getApiMessage(response: { message?: string; data?: unknown } | null | undefined) {
  if (!response) return '';
  if (typeof response.data === 'string' && response.data.trim()) return response.data;
  if (typeof response.message === 'string' && response.message.trim()) return response.message;
  return '';
}

function getApiErrorMessage(err: unknown) {
  const axiosError = err as AxiosError<{ message?: string; data?: string }>;
  const backendMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.data;
  if (typeof backendMessage === 'string' && backendMessage.trim()) return backendMessage;
  if (typeof axiosError?.message === 'string' && axiosError.message.trim()) return axiosError.message;
  return '';
}

// ----------------------------------------------------------------------

export function CustomersView() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const table = useTable();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [debouncedFilterName, setDebouncedFilterName] = useState('');
  const [filterBillNumber, setFilterBillNumber] = useState('');
  const [debouncedFilterBillNumber, setDebouncedFilterBillNumber] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterName(filterName);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterBillNumber(filterBillNumber);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterBillNumber]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const searchFields = [debouncedFilterName, debouncedFilterBillNumber]
        .filter(Boolean)
        .join(' ')
        .trim();
      const sortParam = table.order === 'desc' ? `-${table.orderBy}` : table.orderBy;
      let parsedBillNumber: number | undefined;
      if (debouncedFilterBillNumber.length > 0) {
        const parsed = parseInt(debouncedFilterBillNumber, 10);
        if (!Number.isNaN(parsed)) parsedBillNumber = parsed;
      }
      const response = await getCustomers({
        page: table.page + 1,
        limit: table.rowsPerPage,
        searchFields,
        billNumber: parsedBillNumber,
      });
      setCustomers(response.data);
      setTotalCustomers(response.pagination?.total ?? 0);
    } catch {
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  }, [
    table.page,
    table.rowsPerPage,
    table.order,
    table.orderBy,
    debouncedFilterName,
    debouncedFilterBillNumber,
  ]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const dataFiltered = customers;
  const notFound = !loading && !dataFiltered.length && (!!filterName || !!filterBillNumber);

  const handleOpenNew = useCallback(() => {
    navigate('/customers/new');
  }, [navigate]);

  const handleOpenEdit = useCallback(
    (row: Customer) => {
      navigate(`/customers/${row._id}/edit`);
    },
    [navigate]
  );

  const handleOpenDelete = useCallback((row: Customer) => {
    setCustomerToDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!customerToDelete) return;
    try {
      const response = await deleteCustomer(customerToDelete._id);
      const successMessage = getApiMessage(response);
      if (successMessage) {
        toast.success(successMessage);
        dispatch(showAlert({ message: successMessage, severity: 'success' }));
      }
      await fetchCustomers();
      handleCloseDelete();
    } catch (err) {
      console.error(err);
      const errorMessage = getApiErrorMessage(err);
      if (errorMessage) {
        toast.error(errorMessage);
        dispatch(showAlert({ message: errorMessage, severity: 'error' }));
      }
    }
  }, [customerToDelete, dispatch, fetchCustomers, handleCloseDelete]);

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h4">Sales (Customers)</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenNew}
          // disabled={!clientItems.length}
        >
          New Sale
        </Button>
      </Box>

      <Card>
        <Toolbar
          sx={{
            height: 96,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            p: (theme) => theme.spacing(0, 1, 0, 3),
          }}
        >
          <TextField
            value={filterName}
            onChange={(e) => {
              setFilterName(e.target.value);
              table.onResetPage();
            }}
            placeholder="Search customers..."
            size="small"
            sx={{ minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            value={filterBillNumber}
            onChange={(e) => {
              setFilterBillNumber(e.target.value.replace(/\D/g, ''));
              table.onResetPage();
            }}
            placeholder="Bill number"
            size="small"
            type="number"
            inputProps={{ min: 0 }}
            sx={{ width: 140 }}
          />
        </Toolbar>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {[
                    { id: 'customerName', label: 'Customer' },
                    { id: 'billNumber', label: 'Bill #' },
                    { id: 'itemNumber', label: 'Item' },
                    // { id: 'boxQuantity', label: 'Qty' },
                    // { id: 'size', label: 'Size' },
                    { id: 'grandTotal', label: 'Grand Total' },
                  ].map((col) => (
                    <TableCell key={col.id} sortDirection={table.orderBy === col.id ? table.order : false}>
                      <TableSortLabel
                        active={table.orderBy === col.id}
                        direction={table.orderBy === col.id ? table.order : 'asc'}
                        onClick={() => table.onSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  dataFiltered.map((row) => (
                    <TableRow hover key={row._id}>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.billNumber}</TableCell>
                      <TableCell>{row.itemNumber ?? row.items?.[0]?.itemNumber ?? '—'}</TableCell>
                      {/* <TableCell>{row.boxQuantity ?? row.items?.[0]?.boxQuantity ?? '—'}</TableCell>
                      <TableCell>{row.size || row.items?.[0]?.size || '—'}</TableCell> */}
                      <TableCell>₹{row.grandTotal ?? row.items?.[0]?.grandTotal ?? 0}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <span>
                            <IconButton onClick={() => handleOpenEdit(row)}>
                              <Iconify icon="solar:pen-bold" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleOpenDelete(row)}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {notFound && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Typography variant="h6" paragraph>
                        Not found
                      </Typography>
                      <Typography variant="body2">
                        No sales match your filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !dataFiltered.length && !filterName && !filterBillNumber && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      No sales yet. Add client items first, then create a sale.
                    </TableCell>
                  </TableRow>
                )}

                <TableEmptyRows
                  height={68}
                  emptyCount={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={totalCustomers}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 15, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          labelRowsPerPage="Rows per page :"
        />
      </Card>

      <CustomerDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        customer={customerToDelete}
      />
    </DashboardContent>
  );
}

function TableEmptyRows({ emptyCount, height }: { emptyCount: number; height: number }) {
  if (!emptyCount) return null;
  return (
    <TableRow sx={{ ...(height && { height: height * emptyCount }) }}>
      <TableCell colSpan={9} />
    </TableRow>
  );
}
