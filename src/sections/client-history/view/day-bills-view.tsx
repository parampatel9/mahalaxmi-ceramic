import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  type DayBill,
  getClientDayBills,
  type DayBillsResponse,
} from 'src/redux/apis/clientHistoryApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

export function DayBillsView() {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') ?? '';
  const clientId = searchParams.get('clientId') ?? '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dayBills, setDayBills] = useState<DayBillsResponse | null>(null);

  useEffect(() => {
    const fetchDayBills = async () => {
      if (!date) {
        setDayBills(null);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await getClientDayBills(date, clientId);
        setDayBills(response);
      } catch {
        setError('Failed to load day bills.');
        setDayBills(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDayBills();
  }, [clientId, date]);

  const rows: DayBill[] = dayBills?.bills ?? [];
  const grandTotal = dayBills?.grandTotal ?? 0;
  const totalBills = dayBills?.totalBills ?? rows.length;

  return (
    <DashboardContent>
      <Box sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to={clientId ? `/clients/${clientId}/history` : '/client-history'}
          color="text.secondary"
          variant="body2"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ transform: 'rotate(180deg)' }} />
          Back
        </Link>
      </Box>

      <Typography variant="h4" sx={{ mb: 2 }}>
        Day Bills {date ? `- ${dayjs(date).format('DD MMM YYYY')}` : ''}
      </Typography>

      <Card>
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Selected Date: {dayBills?.date || date || '—'} | Total Bills: {totalBills}
          </Typography>
          {!loading && rows.length > 0 && (
            <Typography variant="h6">Grand Total: ₹{grandTotal.toFixed(2)}</Typography>
          )}
        </Box>

        {!date && <Alert severity="warning">Date is missing in URL.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Bill Number</TableCell>
                    <TableCell>Item Number</TableCell>
                    <TableCell align="right">Bill Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                        <Typography variant="body2" color="text.secondary">
                          No bills found for this day.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow hover key={`${row.billNumber}`}>
                        <TableCell>{row.billNumber}</TableCell>
                        <TableCell>
                          {row.items?.length
                            ? row.items.map((item) => item.itemNumber).join(', ')
                            : '—'}
                        </TableCell>
                        <TableCell align="right">₹{(Number(row.billTotal) || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>
        )}
      </Card>
    </DashboardContent>
  );
}
