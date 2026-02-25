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
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { type ClientItem, getAllClientItems } from 'src/redux/apis/clientItemsApis';
import {
  addCustomer,
  getCustomer,
  getCustomers,
  type Customer,
  updateCustomer,
  deleteCustomer,
  type CustomerPayload,
} from 'src/redux/apis/customersApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { emptyRows } from '../utils';
import { CustomerFormDialog } from '../customer-form-dialog';
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

// ----------------------------------------------------------------------

export function CustomersView() {
  const table = useTable();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [debouncedFilterName, setDebouncedFilterName] = useState('');
  const [filterBillNumber, setFilterBillNumber] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editLoading, setEditLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [clientItems, setClientItems] = useState<ClientItem[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterName(filterName);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterName]);

  const fetchClientItems = useCallback(async () => {
    try {
      const res = await getAllClientItems({ limit: 500 });
      setClientItems(res.data);
    } catch {
      setClientItems([]);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const sortParam = table.order === 'desc' ? `-${table.orderBy}` : table.orderBy;
      const response = await getCustomers({
        page: table.page + 1,
        limit: table.rowsPerPage,
        search: debouncedFilterName || undefined,
        sort: sortParam,
        billNumber: filterBillNumber ? parseInt(filterBillNumber, 10) : undefined,
      });
      setCustomers(response.data);
      setTotalCustomers(response.pagination?.total ?? 0);
    } catch {
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  }, [table.page, table.rowsPerPage, table.order, table.orderBy, debouncedFilterName, filterBillNumber]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchClientItems();
  }, [fetchClientItems]);

  const dataFiltered = customers;
  const notFound = !loading && !dataFiltered.length && (!!filterName || !!filterBillNumber);

  const handleOpenNew = useCallback(() => {
    setEditCustomer(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback(async (row: Customer) => {
    setEditLoading(row._id);
    try {
      const fresh = await getCustomer(row._id);
      setEditCustomer(fresh);
    } catch {
      setEditCustomer(row);
    } finally {
      setEditLoading(null);
      setFormOpen(true);
    }
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setEditCustomer(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: {
      customerName: string;
      billNumber: number;
      itemNumber: string;
      boxQuantity: number;
      size: string;
      sellPrice: number;
    }) => {
      const payload: CustomerPayload = {
        customerName: data.customerName,
        billNumber: data.billNumber,
        itemNumber: data.itemNumber,
        boxQuantity: data.boxQuantity,
        sellPrice: data.sellPrice,
      };
      if (data.size) payload.size = data.size;
      try {
        if (editCustomer) {
          await updateCustomer(editCustomer._id, payload);
        } else {
          await addCustomer(payload);
        }
        await fetchCustomers();
        handleCloseForm();
      } catch (err) {
        console.error(err);
      }
    },
    [editCustomer, fetchCustomers, handleCloseForm]
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
      await deleteCustomer(customerToDelete._id);
      await fetchCustomers();
      handleCloseDelete();
    } catch (err) {
      console.error(err);
    }
  }, [customerToDelete, fetchCustomers, handleCloseDelete]);

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
                    { id: 'boxQuantity', label: 'Qty' },
                    { id: 'size', label: 'Size' },
                    { id: 'sellPrice', label: 'Sell Price' },
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
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  dataFiltered.map((row) => (
                    <TableRow hover key={row._id}>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.billNumber}</TableCell>
                      <TableCell>{row.itemNumber}</TableCell>
                      <TableCell>{row.boxQuantity}</TableCell>
                      <TableCell>{row.size || '—'}</TableCell>
                      <TableCell>₹{row.sellPrice}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <span>
                            <IconButton
                              onClick={() => handleOpenEdit(row)}
                              disabled={editLoading === row._id}
                            >
                              {editLoading === row._id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <Iconify icon="solar:pen-bold" />
                              )}
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
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
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
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
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

      <CustomerFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        customer={editCustomer}
        title={editCustomer ? 'Edit Sale' : 'New Sale'}
        submitLabel={editCustomer ? 'Update' : 'Create'}
        clientItems={clientItems}
      />

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
