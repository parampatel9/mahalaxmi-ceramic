import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

import { DashboardContent } from 'src/layouts/dashboard';
import { getClientHistory, type ClientHistory } from 'src/redux/apis/clientHistoryApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export function ClientHistoryView() {
  const [billNumberFilter, setBillNumberFilter] = useState('');
  const [appliedBillNumber, setAppliedBillNumber] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<ClientHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClientHistory({
        billNumber: appliedBillNumber,
        limit: 500,
      });
      setHistory(res.data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [appliedBillNumber]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleApplyBillFilter = () => {
    const num = billNumberFilter.trim() ? parseInt(billNumberFilter, 10) : undefined;
    setAppliedBillNumber(Number.isNaN(num) ? undefined : num);
  };

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
        <Typography variant="h4">Bill Report (Client History)</Typography>
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
        </Toolbar>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Bill #</TableCell>
                  <TableCell>Item Number</TableCell>
                  <TableCell align="right">Box Qty</TableCell>
                  <TableCell align="right">Actual Price</TableCell>
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
                      <TableCell align="right">₹{row.actualPrice}</TableCell>
                      <TableCell align="right">₹{row.totalPrice}</TableCell>
                    </TableRow>
                  ))
                )}

                {!loading && !history.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Typography variant="body2" color="text.secondary">
                        {appliedBillNumber !== undefined
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
