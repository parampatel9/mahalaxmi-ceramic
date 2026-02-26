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
} from 'src/redux/apis/clientHistoryApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type ClientHistoryViewProps = {
  clientId?: string;
};

export function ClientHistoryView({ clientId }: ClientHistoryViewProps) {
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

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

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

  const totalClientCost = history.reduce((sum, row) => sum + (row.totalPrice ?? 0), 0);

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
          <Tabs value="history" aria-label="Client tabs">
            <Tab
              label="Client Items"
              value="items"
              component={RouterLink}
              to={`/clients/${clientId}/items`}
            />
            <Tab label="Client History" value="history" />
          </Tabs>
        </Box>
      )}

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
                  {/* <TableCell align="right">Actual Price</TableCell> */}
                  <TableCell align="right">Total Price</TableCell>
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
                  history.map((row) => (
                    <TableRow hover key={row._id}>
                      <TableCell>{row.billNumber}</TableCell>
                      <TableCell>{row.itemNumber}</TableCell>
                      <TableCell align="right">{row.boxQuantity}</TableCell>
                      {/* <TableCell align="right">₹{row.actualPrice}</TableCell> */}
                      <TableCell align="right">₹{row.totalPrice}</TableCell>
                    </TableRow>
                  ))
                )}

                {!loading && !history.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
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
      </Card>
    </DashboardContent>
  );
}
