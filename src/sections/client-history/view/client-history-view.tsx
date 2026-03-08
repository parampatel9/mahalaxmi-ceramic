import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useAppDispatch } from 'src/redux/hooks';
import { DashboardContent } from 'src/layouts/dashboard';
import { fetchClient as fetchClientById } from 'src/redux/slices/clientSlice';
import {
  type DayWiseEntry,
  type ClientHistory,
  type MonthWiseEntry,
  type LedgerTransaction,
  type ClientLedgerResponse,
} from 'src/redux/apis/clientHistoryApis';
import {
  fetchClientLedger,
  fetchClientHistory,
  createClientTransaction,
  fetchClientHistoryDayWise,
  fetchClientHistoryByClient,
  fetchClientHistoryMonthWise,
} from 'src/redux/slices/clientHistorySlice';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type ClientHistoryViewProps = {
  clientId?: string;
};

type SubTabValue = 'history' | 'daywise' | 'monthwise' | 'ledger';
type EntryTypeFilter = 'all' | 'sale' | 'return';

const PAYMENT_MODE_OPTIONS = [
  'Cash',
  'Online',
  'UPI',
  'Bank Transfer',
  'Card',
  'Cheque',
  'NEFT',
  'RTGS',
  'IMPS',
  'Wallet',
] as const;

const ENTRY_TYPE_FILTER_OPTIONS: EntryTypeFilter[] = ['all', 'sale', 'return'];

export function ClientHistoryView({ clientId }: ClientHistoryViewProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<SubTabValue>('history');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [totalHistory, setTotalHistory] = useState(0);
  const [billNumberFilter, setBillNumberFilter] = useState('');
  const [appliedBillNumber, setAppliedBillNumber] = useState<number | undefined>(undefined);
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryTypeFilter>('all');
  const [history, setHistory] = useState<ClientHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');

  const [dayWiseData, setDayWiseData] = useState<DayWiseEntry[]>([]);
  const [dayWiseLoading, setDayWiseLoading] = useState(false);
  const [monthWiseData, setMonthWiseData] = useState<MonthWiseEntry[]>([]);
  const [monthWiseLoading, setMonthWiseLoading] = useState(false);
  const [ledger, setLedger] = useState<ClientLedgerResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>(PAYMENT_MODE_OPTIONS[0]);
  const [paymentDate, setPaymentDate] = useState<Dayjs | null>(dayjs());
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = clientId
        ? await dispatch(
            fetchClientHistoryByClient({
              clientId,
              params: {
                page: page + 1,
                limit: rowsPerPage,
                search: debouncedSearch || undefined,
                entryType: entryTypeFilter === 'all' ? undefined : entryTypeFilter,
              },
            })
          ).unwrap()
        : await dispatch(
            fetchClientHistory({
              billNumber: appliedBillNumber,
              limit: 500,
              entryType: entryTypeFilter === 'all' ? undefined : entryTypeFilter,
            })
          ).unwrap();
      setHistory(res.data);
      setTotalHistory(res.pagination?.total ?? 0);
    } catch {
      setHistory([]);
      setTotalHistory(0);
    } finally {
      setLoading(false);
    }
  }, [appliedBillNumber, clientId, debouncedSearch, dispatch, entryTypeFilter, page, rowsPerPage]);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    try {
      const response = await dispatch(fetchClientById(clientId)).unwrap();
      setClientName(response.clientName);
    } catch {
      setClientName('');
    }
  }, [clientId, dispatch]);

  const fetchDayWise = useCallback(async () => {
    if (!clientId) return;
    setDayWiseLoading(true);
    try {
      const data = await dispatch(fetchClientHistoryDayWise({ clientId })).unwrap();
      setDayWiseData(data);
    } catch {
      setDayWiseData([]);
    } finally {
      setDayWiseLoading(false);
    }
  }, [clientId, dispatch]);

  const fetchMonthWise = useCallback(async () => {
    if (!clientId) return;
    setMonthWiseLoading(true);
    try {
      const data = await dispatch(fetchClientHistoryMonthWise({ clientId })).unwrap();
      setMonthWiseData(data);
    } catch {
      setMonthWiseData([]);
    } finally {
      setMonthWiseLoading(false);
    }
  }, [clientId, dispatch]);

  const fetchLedger = useCallback(async () => {
    if (!clientId) return;
    setLedgerLoading(true);
    try {
      const res = await dispatch(fetchClientLedger(clientId)).unwrap();
      setLedger(res);
    } catch {
      setLedger(null);
    } finally {
      setLedgerLoading(false);
    }
  }, [clientId, dispatch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  useEffect(() => {
    if (clientId && subTab === 'daywise') fetchDayWise();
  }, [clientId, subTab, fetchDayWise]);

  useEffect(() => {
    if (clientId && subTab === 'monthwise') fetchMonthWise();
  }, [clientId, subTab, fetchMonthWise]);

  useEffect(() => {
    if (clientId && subTab === 'ledger') fetchLedger();
  }, [clientId, subTab, fetchLedger]);

  const handleApplyBillFilter = () => {
    const num = billNumberFilter.trim() ? parseInt(billNumberFilter, 10) : undefined;
    setAppliedBillNumber(Number.isNaN(num) ? undefined : num);
  };

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const handleRecordPayment = useCallback(async () => {
    if (!clientId) return;
    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    if (!paymentMode.trim() || !paymentDate?.isValid()) return;
    setPaymentSubmitting(true);
    try {
      await dispatch(
        createClientTransaction({
          clientId,
          body: {
            amount,
            type: 'payment',
            paymentMode,
            date: paymentDate.format('YYYY-MM-DD'),
            note: paymentNote.trim() || undefined,
          },
        })
      ).unwrap();
      setPaymentAmount('');
      setPaymentMode(PAYMENT_MODE_OPTIONS[0]);
      setPaymentDate(dayjs());
      setPaymentNote('');
      await fetchLedger();
    } finally {
      setPaymentSubmitting(false);
    }
  }, [clientId, dispatch, fetchLedger, paymentAmount, paymentDate, paymentMode, paymentNote]);

  const totalClientCost = history.reduce((sum, row) => sum + (row.totalPrice ?? 0), 0);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  const formatMonthYear = (month: number, year: number) => {
    try {
      return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } catch {
      return `${month}/${year}`;
    }
  };

  const getDayBillCount = (row: DayWiseEntry): number => {
    if (typeof row.billCount === 'number') return row.billCount;
    if (typeof row.count === 'number') return row.count;
    return 0;
  };

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
        {clientId ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Link
              component={RouterLink}
              to="/clients"
              color="text.secondary"
              variant="body2"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              <Iconify
                icon="eva:arrow-ios-forward-fill"
                width={16}
                sx={{ transform: 'rotate(180deg)' }}
              />
              Back to clients
            </Link>
            <Typography variant="h4">Client History: {clientName || '...'}</Typography>
          </Box>
        ) : (
          <Typography variant="h4">Bill Report (Client History)</Typography>
        )}
      </Box>

      {clientId && (
        <Box sx={{ mb: 3 }}>
          <Tabs
              value={subTab}
              onChange={(_e, v) => {
                if (v !== 'items') setSubTab(v as SubTabValue);
              }}
              aria-label="Client tabs"
            >
            <Tab
              label="Client Items"
              value="items"
              component={RouterLink}
              to={`/clients/${clientId}/items`}
            />
            <Tab label="Client History" value="history" />
            <Tab label="Day-wise totals" value="daywise" />
            <Tab label="Month-wise totals" value="monthwise" />
            <Tab label="Ledger" value="ledger" />
          </Tabs>
        </Box>
      )}

      <Card>
        {(!clientId || subTab === 'history') && (
          <>
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
              {clientId ? (
                <>
                  <TextField
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Search history..."
                    size="small"
                    sx={{ width: 280 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Autocomplete
                    options={ENTRY_TYPE_FILTER_OPTIONS}
                    value={entryTypeFilter}
                    onChange={(_e, value) => {
                      setEntryTypeFilter(value ?? 'all');
                      setPage(0);
                    }}
                    sx={{ width: 180 }}
                    renderInput={(params) => <TextField {...params} label="Type" size="small" />}
                  />
                </>
              ) : (
                <>
                  <TextField
                    value={billNumberFilter}
                    onChange={(e) => setBillNumberFilter(e.target.value.replace(/\D/g, ''))}
                    placeholder="Bill number (leave empty for all)"
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    sx={{ width: 260 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button variant="outlined" onClick={handleApplyBillFilter}>
                    Apply
                  </Button>
                  <Autocomplete
                    options={ENTRY_TYPE_FILTER_OPTIONS}
                    value={entryTypeFilter}
                    onChange={(_e, value) => setEntryTypeFilter(value ?? 'all')}
                    sx={{ width: 180 }}
                    renderInput={(params) => <TextField {...params} label="Type" size="small" />}
                  />
                  {appliedBillNumber !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      Showing bill {appliedBillNumber}
                    </Typography>
                  )}
                </>
              )}
            </Toolbar>

            <Scrollbar>
              <TableContainer sx={{ overflow: 'unset' }}>
                <Table sx={{ minWidth: 640 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bill Number</TableCell>
                      <TableCell>Item Number</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Box Qty</TableCell>
                      <TableCell align="right">Size</TableCell>
                      <TableCell align="right">Total Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((row) => (
                        <TableRow hover key={row._id}>
                          <TableCell>{row.billNumber}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{row.itemNumber}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Old: {row.oldItemName || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{row.entryType ?? 'sale'}</TableCell>
                          <TableCell align="right">{row.boxQuantity}</TableCell>
                          <TableCell align="right">{row.size || '-'}</TableCell>
                          <TableCell
                            align="right"
                            sx={{ color: row.totalPrice < 0 ? 'success.main' : 'text.primary', fontWeight: 600 }}
                          >
                            {formatCurrency(row.totalPrice ?? 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {!loading && !history.length && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                          <Typography variant="body2" color="text.secondary">
                            {clientId
                              ? 'No history found.'
                              : appliedBillNumber !== undefined
                              ? `No client history for bill ${appliedBillNumber}.`
                              : 'Enter a bill number and click Apply, or leave empty to see all.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            {clientId && (
              <TablePagination
                component="div"
                page={page}
                count={totalHistory}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                rowsPerPageOptions={[50, 100, 150, 200]}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Rows per page :"
              />
            )}

            {!loading && history.length > 0 && (
              <Box
                sx={{
                  py: 2,
                  px: 3,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6">
                  Net total: <strong>{formatCurrency(totalClientCost)}</strong>
                </Typography>
              </Box>
            )}
          </>
        )}

        {clientId && subTab === 'daywise' && (
          <>
            <Toolbar sx={{ minHeight: 64, px: 2 }} />
            <Scrollbar>
              <TableContainer sx={{ overflow: 'unset' }}>
                <Table sx={{ minWidth: 400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dayWiseLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (
                      dayWiseData.map((row, idx) => (
                        <TableRow hover key={row.date ?? idx}>
                          <TableCell>
                            {getDayBillCount(row) > 0 && clientId ? (
                              <Button
                                variant="text"
                                size="small"
                                sx={{ px: 0, minWidth: 0 }}
                                onClick={() =>
                                  navigate(
                                    `/day-bills?date=${encodeURIComponent(dayjs(row.date).format('YYYY-MM-DD'))}&clientId=${encodeURIComponent(clientId)}`
                                  )
                                }
                              >
                                {formatDate(row.date)}
                              </Button>
                            ) : (
                              formatDate(row.date)
                            )}
                          </TableCell>
                          <TableCell align="right">
                            ₹{(row.totalAmount ?? row.totalPrice ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            {getDayBillCount(row) > 0 ? getDayBillCount(row) : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {!dayWiseLoading && !dayWiseData.length && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                          <Typography variant="body2" color="text.secondary">
                            No day-wise data.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </>
        )}

        {clientId && subTab === 'monthwise' && (
          <>
            <Toolbar sx={{ minHeight: 64, px: 2 }} />
            <Scrollbar>
              <TableContainer sx={{ overflow: 'unset' }}>
                <Table sx={{ minWidth: 400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthWiseLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (
                      monthWiseData.map((row, idx) => (
                        <TableRow hover key={`${row.year}-${row.month}-${idx}`}>
                          <TableCell>{formatMonthYear(row.month, row.year)}</TableCell>
                          <TableCell align="right">
                            ₹{(row.totalAmount ?? row.totalPrice ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">{row.count ?? '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                    {!monthWiseLoading && !monthWiseData.length && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                          <Typography variant="body2" color="text.secondary">
                            No month-wise data.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </>
        )}

        {clientId && subTab === 'ledger' && (
          <>
            <Toolbar
              sx={{
                minHeight: 64,
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
                p: (theme) => theme.spacing(0, 2, 0, 3),
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Record payment
              </Typography>
              <TextField
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="Amount"
                size="small"
                type="number"
                inputProps={{ min: 0 }}
                sx={{ width: 140 }}
              />
              <Autocomplete
                options={[...PAYMENT_MODE_OPTIONS]}
                value={paymentMode}
                onChange={(_e, newValue) => setPaymentMode(newValue ?? '')}
                sx={{ width: 200 }}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Payment Mode" required />
                )}
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Payment Date"
                  value={paymentDate}
                  onChange={(newValue) => setPaymentDate(newValue)}
                  format="DD/MM/YYYY"
                  disableFuture
                  slotProps={{
                    textField: {
                      size: 'small',
                      required: true,
                      sx: { width: 180 },
                    },
                  }}
                />
              </LocalizationProvider>
              {/* <TextField
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Note (e.g. Cash paid)"
                size="small"
                sx={{ width: 200 }}
              /> */}
              <Button
                variant="contained"
                onClick={handleRecordPayment}
                disabled={
                  paymentSubmitting ||
                  !paymentAmount ||
                  Number(paymentAmount) <= 0 ||
                  !paymentMode ||
                  !paymentDate?.isValid()
                }
              >
                {paymentSubmitting ? 'Saving...' : 'Record payment'}
              </Button>
            </Toolbar>

            {ledgerLoading ? (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography color="text.secondary">Loading ledger...</Typography>
              </Box>
            ) : ledger ? (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 2,
                    p: 2,
                  }}
                >
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Sale
                    </Typography>
                    <Typography variant="h6">{formatCurrency(ledger.totalSale)}</Typography>
                  </Card>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Return
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(ledger.totalReturn)}
                    </Typography>
                  </Card>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Net Purchase
                    </Typography>
                    <Typography variant="h6">{formatCurrency(ledger.totalPurchase)}</Typography>
                  </Card>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Paid
                    </Typography>
                    <Typography variant="h6">{formatCurrency(ledger.totalPaid)}</Typography>
                  </Card>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                    <Typography
                      variant="h6"
                      color={
                        ledger.pendingAmount < 0
                          ? 'success.main'
                          : ledger.pendingAmount > 0
                            ? 'error.main'
                            : 'text.primary'
                      }
                    >
                      {formatCurrency(ledger.pendingAmount)}
                    </Typography>
                  </Card>
                </Box>

                <Scrollbar>
                  <TableContainer sx={{ overflow: 'unset' }}>
                    <Table sx={{ minWidth: 560 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          {/* <TableCell>Type</TableCell> */}
                          <TableCell>Payment Type</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ledger.transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                No transactions yet.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          ledger.transactions.map((tx: LedgerTransaction) => (
                            <TableRow hover key={tx._id}>
                              <TableCell>{tx.date ? formatDate(tx.date) : tx.createdAt ? formatDate(tx.createdAt) : '—'}</TableCell>
                              {/* <TableCell>{tx.type || '—'}</TableCell> */}
                              <TableCell>{tx.paymentMode}</TableCell>
                              <TableCell align="right">{formatCurrency(tx.amount ?? 0)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Scrollbar>
              </>
            ) : (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography color="text.secondary">Could not load ledger.</Typography>
              </Box>
            )}
          </>
        )}
      </Card>
    </DashboardContent>
  );
}
