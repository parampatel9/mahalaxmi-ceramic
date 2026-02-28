import { Link as RouterLink } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

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
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { getClient } from 'src/redux/apis/clientsApis';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  getClientHistory,
  type ClientHistory,
  getClientHistoryByClient,
  getClientHistoryDayWise,
  getClientHistoryMonthWise,
  getClientLedger,
  postClientTransaction,
  type DayWiseEntry,
  type MonthWiseEntry,
  type ClientLedgerResponse,
  type LedgerTransaction,
} from 'src/redux/apis/clientHistoryApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type ClientHistoryViewProps = {
  clientId?: string;
};

type SubTabValue = 'history' | 'daywise' | 'monthwise' | 'ledger';

export function ClientHistoryView({ clientId }: ClientHistoryViewProps) {
  const [subTab, setSubTab] = useState<SubTabValue>('history');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [totalHistory, setTotalHistory] = useState(0);
  const [billNumberFilter, setBillNumberFilter] = useState('');
  const [appliedBillNumber, setAppliedBillNumber] = useState<number | undefined>(undefined);
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
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = clientId
        ? await getClientHistoryByClient(clientId, {
            page: page + 1,
            limit: rowsPerPage,
            search: debouncedSearch || undefined,
          })
        : await getClientHistory({
            billNumber: appliedBillNumber,
            limit: 500,
          });
      setHistory(res.data);
      setTotalHistory(res.pagination?.total ?? 0);
    } catch {
      setHistory([]);
      setTotalHistory(0);
    } finally {
      setLoading(false);
    }
  }, [appliedBillNumber, clientId, debouncedSearch, page, rowsPerPage]);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    try {
      const response = await getClient(clientId);
      setClientName(response.clientName);
    } catch {
      setClientName('');
    }
  }, [clientId]);

  const fetchDayWise = useCallback(async () => {
    if (!clientId) return;
    setDayWiseLoading(true);
    try {
      const res = await getClientHistoryDayWise(clientId);
      setDayWiseData(res.data);
    } catch {
      setDayWiseData([]);
    } finally {
      setDayWiseLoading(false);
    }
  }, [clientId]);

  const fetchMonthWise = useCallback(async () => {
    if (!clientId) return;
    setMonthWiseLoading(true);
    try {
      const res = await getClientHistoryMonthWise(clientId);
      setMonthWiseData(res.data);
    } catch {
      setMonthWiseData([]);
    } finally {
      setMonthWiseLoading(false);
    }
  }, [clientId]);

  const fetchLedger = useCallback(async () => {
    if (!clientId) return;
    setLedgerLoading(true);
    try {
      const res = await getClientLedger(clientId);
      setLedger(res);
    } catch {
      setLedger(null);
    } finally {
      setLedgerLoading(false);
    }
  }, [clientId]);

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
    setPaymentSubmitting(true);
    try {
      await postClientTransaction(clientId, {
        amount,
        type: 'payment',
        note: paymentNote.trim() || undefined,
      });
      setPaymentAmount('');
      setPaymentNote('');
      await fetchLedger();
    } finally {
      setPaymentSubmitting(false);
    }
  }, [clientId, paymentAmount, paymentNote, fetchLedger]);

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
                  {appliedBillNumber !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      Showing bill #{appliedBillNumber}
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
                      <TableCell>Bill #</TableCell>
                      <TableCell>Item Number</TableCell>
                      <TableCell align="right">Box Qty</TableCell>
                      <TableCell align="right">Total Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((row) => (
                        <TableRow hover key={row._id}>
                          <TableCell>{row.billNumber}</TableCell>
                          <TableCell>{row.itemNumber}</TableCell>
                          <TableCell align="right">{row.boxQuantity}</TableCell>
                          <TableCell align="right">₹{row.totalPrice}</TableCell>
                        </TableRow>
                      ))
                    )}

                    {!loading && !history.length && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                          <Typography variant="body2" color="text.secondary">
                            {clientId
                              ? 'No history found.'
                              : appliedBillNumber !== undefined
                              ? `No client history for bill #${appliedBillNumber}.`
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
                rowsPerPageOptions={[5, 10, 15, 25]}
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
                  Total client cost: <strong>₹{totalClientCost.toFixed(2)}</strong>
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
                          <TableCell>{formatDate(row.date)}</TableCell>
                          <TableCell align="right">
                            ₹{(row.totalAmount ?? row.totalPrice ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">{row.count ?? '—'}</TableCell>
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
              <TextField
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Note (e.g. Cash paid)"
                size="small"
                sx={{ width: 200 }}
              />
              <Button
                variant="contained"
                onClick={handleRecordPayment}
                disabled={paymentSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
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
                      Total Purchase
                    </Typography>
                    <Typography variant="h6">₹{ledger.totalPurchase.toFixed(2)}</Typography>
                  </Card>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Paid
                    </Typography>
                    <Typography variant="h6">₹{ledger.totalPaid.toFixed(2)}</Typography>
                  </Card>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                    <Typography variant="h6" color={ledger.pendingAmount > 0 ? 'error.main' : 'text.primary'}>
                      ₹{ledger.pendingAmount.toFixed(2)}
                    </Typography>
                  </Card>
                </Box>

                <Scrollbar>
                  <TableContainer sx={{ overflow: 'unset' }}>
                    <Table sx={{ minWidth: 560 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Note</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ledger.transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                No transactions yet.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          ledger.transactions.map((tx: LedgerTransaction) => (
                            <TableRow hover key={tx._id}>
                              <TableCell>{tx.createdAt ? formatDate(tx.createdAt) : '—'}</TableCell>
                              <TableCell>{tx.type || '—'}</TableCell>
                              <TableCell>{tx.note || '—'}</TableCell>
                              <TableCell align="right">₹{tx.amount.toFixed(2)}</TableCell>
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
