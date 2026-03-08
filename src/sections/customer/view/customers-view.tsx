import type { AxiosError } from 'axios';

import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
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
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { printPdfFromUrl } from 'src/utils/printPdf';

import { useAppDispatch } from 'src/redux/hooks';
import { showAlert } from 'src/redux/slices/alertSlice';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  getCustomers,
  type Customer,
  deleteCustomer,
  addCustomerPayment,
} from 'src/redux/apis/customersApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { emptyRows } from '../utils';
import { CustomerDeleteDialog } from '../customer-delete-dialog';

// ----------------------------------------------------------------------

const CUSTOMERS_TABLE_STATE_KEY = 'customers_table_state';

type StoredCustomersTableState = {
  page: number;
  limit: number;
  search: string;
};

function readStoredTableState(): StoredCustomersTableState {
  const fallback: StoredCustomersTableState = { page: 0, limit: 50, search: '' };
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(CUSTOMERS_TABLE_STATE_KEY);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredCustomersTableState>;
    const page = typeof parsed.page === 'number' && parsed.page >= 0 ? parsed.page : fallback.page;
    const limit =
      typeof parsed.limit === 'number' && [50, 100, 150, 200].includes(parsed.limit)
        ? parsed.limit
        : fallback.limit;
    const search = typeof parsed.search === 'string' ? parsed.search : fallback.search;
    return { page, limit, search };
  } catch {
    return fallback;
  }
}

function writeStoredTableState(state: StoredCustomersTableState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOMERS_TABLE_STATE_KEY, JSON.stringify(state));
}

function useTable() {
  const [page, setPage] = useState(() => readStoredTableState().page);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [rowsPerPage, setRowsPerPage] = useState(() => readStoredTableState().limit);
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

function getRowGrandTotal(row: Customer) {
  const grandTotal = Number(row.grandTotal ?? row.items?.[0]?.grandTotal ?? 0);
  return Number.isFinite(grandTotal) ? grandTotal : 0;
}

function getRowPaidAmount(row: Customer) {
  const paidAmount = Number(row.paidAmount ?? 0);
  return Number.isFinite(paidAmount) ? paidAmount : 0;
}

function getRowUnpaidAmount(row: Customer | null) {
  const unpaidAmount = Number(row?.unpaidAmount ?? 0);
  if (!Number.isFinite(unpaidAmount)) return 0;
  return Math.max(unpaidAmount, 0);
}

function getRowPaymentStatus(row: Customer): 'paid' | 'unpaid' {
  if (row.paymentStatus === 'paid' || row.paymentStatus === 'unpaid') return row.paymentStatus;
  return getRowUnpaidAmount(row) > 0 ? 'unpaid' : 'paid';
}

// ----------------------------------------------------------------------

export function CustomersView() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const table = useTable();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState(() => readStoredTableState().search);
  const [debouncedFilterName, setDebouncedFilterName] = useState(() => readStoredTableState().search);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterName(filterName);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterName]);

  useEffect(() => {
    writeStoredTableState({
      page: table.page,
      limit: table.rowsPerPage,
      search: filterName,
    });
  }, [filterName, table.page, table.rowsPerPage]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const searchFields = debouncedFilterName.trim();
      const response = await getCustomers({
        page: table.page + 1,
        limit: table.rowsPerPage,
        searchFields,
      });
      setCustomers(response.data);
      setTotalCustomers(response.pagination?.total ?? 0);
    } catch {
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  }, [table.page, table.rowsPerPage, debouncedFilterName]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const dataFiltered = customers;
  const notFound = !loading && !dataFiltered.length && !!filterName;

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

  const handleOpenPayment = useCallback((row: Customer) => {
    setPaymentCustomer(row);
    setPaymentAmount('');
    setPaymentError('');
    setPaymentDialogOpen(true);
  }, []);

  const handleClosePayment = useCallback(() => {
    if (submittingPayment) return;
    setPaymentDialogOpen(false);
    setPaymentCustomer(null);
    setPaymentAmount('');
    setPaymentError('');
  }, [submittingPayment]);

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
      const errorMessage = getApiErrorMessage(err);
      if (errorMessage) {
        toast.error(errorMessage);
        dispatch(showAlert({ message: errorMessage, severity: 'error' }));
      }
    }
  }, [customerToDelete, dispatch, fetchCustomers, handleCloseDelete]);

  const handlePrintBill = useCallback(async (customerId: string) => {
    const printUrl = `http://localhost:3003/api/bills/print/${customerId}`;
    try {
      await printPdfFromUrl(printUrl);
    } catch {
      window.open(printUrl, '_blank');
    }
  }, []);

  const handleSubmitPayment = useCallback(async () => {
    if (!paymentCustomer?._id) return;

    const unpaidAmount = getRowUnpaidAmount(paymentCustomer);
    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Payment Amount must be greater than 0.');
      return;
    }

    if (amount > unpaidAmount) {
      setPaymentError(`Payment Amount cannot be greater than unpaid amount (Rs ${unpaidAmount.toFixed(2)}).`);
      return;
    }

    setSubmittingPayment(true);
    setPaymentError('');
    try {
      const response = await addCustomerPayment(paymentCustomer._id, amount);
      const successMessage = getApiMessage(response) || 'Payment added successfully.';
      toast.success(successMessage);
      dispatch(showAlert({ message: successMessage, severity: 'success' }));
      handleClosePayment();
      await fetchCustomers();
    } catch (err) {
      const errorMessage = getApiErrorMessage(err) || 'Failed to add payment.';
      setPaymentError(errorMessage);
      toast.error(errorMessage);
      dispatch(showAlert({ message: errorMessage, severity: 'error' }));
    } finally {
      setSubmittingPayment(false);
    }
  }, [dispatch, fetchCustomers, handleClosePayment, paymentAmount, paymentCustomer]);

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
        </Toolbar>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  {[
                    { id: 'billNumber', label: 'Bill Number' },
                    { id: 'customerName', label: 'Customer Name' },
                    { id: 'grandTotal', label: 'Grand Total' },
                    { id: 'paidAmount', label: 'Paid Amount' },
                    { id: 'unpaidAmount', label: 'Unpaid Amount' },
                    { id: 'paymentStatus', label: 'Payment Status' },
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
                  dataFiltered.map((row) => {
                    const grandTotal = getRowGrandTotal(row);
                    const paidAmount = getRowPaidAmount(row);
                    const unpaidAmount = getRowUnpaidAmount(row);
                    const paymentStatus = getRowPaymentStatus(row);

                    return (
                      <TableRow hover key={row._id}>
                        <TableCell>{row.billNumber}</TableCell>
                        <TableCell>{row.customerName || '-'}</TableCell>
                        <TableCell>Rs {grandTotal.toFixed(2)}</TableCell>
                        <TableCell>Rs {paidAmount.toFixed(2)}</TableCell>
                        <TableCell>Rs {unpaidAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                            color={paymentStatus === 'paid' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {unpaidAmount > 0 && (
                            <Tooltip title="Add Payment">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenPayment(row)}
                              >
                                <Iconify icon="mingcute:add-line" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {/* <Tooltip title="View Payment History">
                            <IconButton
                              color="primary"
                              onClick={() => navigate(`/client-history?billNumber=${row.billNumber}`)}
                            >
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip> */}
                          <Tooltip title="Print Bill">
                            <IconButton
                              color="info"
                              onClick={() => {
                                void handlePrintBill(row._id);
                              }}
                            >
                              <Iconify icon="solar:share-bold" />
                            </IconButton>
                          </Tooltip>
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
                    );
                  })
                )}

                {notFound && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Typography variant="h6" paragraph>
                        Not found
                      </Typography>
                      <Typography variant="body2">No sales match your filters.</Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !dataFiltered.length && !filterName && (
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
          rowsPerPageOptions={[50, 100, 150, 200]}
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

      <Dialog open={paymentDialogOpen} onClose={handleClosePayment} fullWidth maxWidth="xs">
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Bill No: {paymentCustomer?.billNumber ?? '-'} | Unpaid: Rs {getRowUnpaidAmount(paymentCustomer).toFixed(2)}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="Payment Amount"
            inputProps={{ min: 0, step: 0.01 }}
            value={paymentAmount}
            onChange={(e) => {
              setPaymentAmount(e.target.value);
              if (paymentError) setPaymentError('');
            }}
            error={Boolean(paymentError)}
            helperText={paymentError || ''}
            disabled={submittingPayment}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePayment} disabled={submittingPayment}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmitPayment()} variant="contained" disabled={submittingPayment}>
            {submittingPayment ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
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
