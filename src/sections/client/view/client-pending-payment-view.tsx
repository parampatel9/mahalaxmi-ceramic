import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Toolbar from '@mui/material/Toolbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { DashboardContent } from 'src/layouts/dashboard';
import { getClientLedgerList, type ClientLedgerSummary } from 'src/redux/apis/clientsApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { emptyRows } from '../utils';

// ----------------------------------------------------------------------

function useTable() {
    const [page, setPage] = useState(0);
    const [orderBy, setOrderBy] = useState('clientName');
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

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

export function ClientPendingPaymentView() {
    const table = useTable();
    const [clients, setClients] = useState<ClientLedgerSummary[]>([]);
    const [totalClients, setTotalClients] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterName, setFilterName] = useState('');
    const [debouncedFilterName, setDebouncedFilterName] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterName(filterName);
        }, 500);
        return () => clearTimeout(timer);
    }, [filterName]);

    const fetchLedgerList = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getClientLedgerList({
                page: table.page + 1,
                limit: table.rowsPerPage,
                searchFields: debouncedFilterName,
            });
            setClients(response.data);
            setTotalClients(response.pagination.total);
        } catch (error) {
            console.error('Failed to fetch ledger list:', error);
            setClients([]);
            setTotalClients(0);
        } finally {
            setLoading(false);
        }
    }, [table.page, table.rowsPerPage, debouncedFilterName]);

    useEffect(() => {
        fetchLedgerList();
    }, [fetchLedgerList]);

    const dataFiltered = clients;
    const notFound = !loading && !dataFiltered.length && !!filterName;

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
                <Typography variant="h4">Client Pending Payments</Typography>
            </Box>

            <Card>
                <Toolbar
                    sx={{
                        height: 96,
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: (theme) => theme.spacing(0, 1, 0, 3),
                    }}
                >
                    <TextField
                        value={filterName}
                        onChange={(e) => {
                            setFilterName(e.target.value);
                            table.onResetPage();
                        }}
                        placeholder="Search clients..."
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
                        <Table sx={{ minWidth: 720 }}>
                            <TableHead>
                                <TableRow>
                                    {[
                                        { id: 'clientName', label: 'Client Name' },
                                        { id: 'totalSale', label: 'Total Sale' },
                                        { id: 'totalReturn', label: 'Total Return' },
                                        { id: 'totalPurchase', label: 'Total Purchase' },
                                        { id: 'totalPaid', label: 'Total Paid' },
                                        { id: 'pendingAmount', label: 'Pending Amount' },
                                    ].map((column) => (
                                        <TableCell
                                            key={column.id}
                                            sortDirection={table.orderBy === column.id ? table.order : false}
                                        >
                                            <TableSortLabel
                                                active={table.orderBy === column.id}
                                                direction={table.orderBy === column.id ? table.order : 'asc'}
                                                onClick={() => table.onSort(column.id)}
                                            >
                                                {column.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
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
                                    dataFiltered.map((row) => (
                                        <TableRow hover key={row._id}>
                                            <TableCell>{row.clientName}</TableCell>
                                            <TableCell>{row.totalSale.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                            <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>
                                                {row.totalReturn.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                            </TableCell>
                                            <TableCell>{row.totalPurchase.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                            <TableCell>{row.totalPaid.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        row.pendingAmount < 0
                                                            ? 'success.main'
                                                            : row.pendingAmount > 0
                                                                ? 'error.main'
                                                                : 'text.primary',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {row.pendingAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}

                                {notFound && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                            <Typography variant="h6" paragraph>
                                                Not found
                                            </Typography>
                                            <Typography variant="body2">
                                                No results found for &nbsp;
                                                <strong>&quot;{filterName}&quot;</strong>.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && !dataFiltered.length && !filterName && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                            No data found.
                                        </TableCell>
                                    </TableRow>
                                )}

                                <TableEmptyRows
                                    height={68}
                                    emptyCount={emptyRows(0, table.rowsPerPage, dataFiltered.length)}
                                />
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Scrollbar>

                <TablePagination
                    component="div"
                    page={table.page}
                    count={totalClients}
                    rowsPerPage={table.rowsPerPage}
                    onPageChange={table.onChangePage}
                    rowsPerPageOptions={[50, 100, 150, 200]}
                    onRowsPerPageChange={table.onChangeRowsPerPage}
                    labelRowsPerPage="Rows per page :"
                />
            </Card>
        </DashboardContent>
    );
}

function TableEmptyRows({ emptyCount, height }: { emptyCount: number; height: number }) {
    if (!emptyCount) {
        return null;
    }

    return (
        <TableRow
            sx={{
                ...(height && {
                    height: height * emptyCount,
                }),
            }}
        >
            <TableCell colSpan={9} />
        </TableRow>
    );
}
