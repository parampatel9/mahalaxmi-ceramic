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
import { type Client } from 'src/redux/apis/clientsApis';
import { removeClient, fetchClients as fetchClientsThunk } from 'src/redux/slices/clientSlice';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { emptyRows } from '../utils';
import { ClientDeleteDialog } from '../client-delete-dialog';

// ----------------------------------------------------------------------

function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('clientName');
  const [rowsPerPage, setRowsPerPage] = useState(15);
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

function getApiMessage(response: { message?: string; data?: unknown }) {
  if (typeof response?.data === 'string' && response.data.trim()) return response.data;
  if (typeof response?.message === 'string' && response.message.trim()) return response.message;
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

export function ClientView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const table = useTable();
  const [clients, setClients] = useState<Client[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [debouncedFilterName, setDebouncedFilterName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterName(filterName);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterName]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dispatch(
        fetchClientsThunk({
        page: table.page + 1,
        limit: table.rowsPerPage,
        searchFields: debouncedFilterName,
        })
      ).unwrap();
      setClients(Array.isArray(response.data) ? response.data : []);
      setTotalClients(response.pagination?.total || 0);
    } catch {
      setClients([]);
      setTotalClients(0);
    } finally {
      setLoading(false);
    }
  }, [dispatch, table.page, table.rowsPerPage, debouncedFilterName]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const dataFiltered = clients;

  const notFound = !loading && !dataFiltered.length && !!filterName;

  const handleOpenNew = useCallback(() => {
    navigate('/clients/new');
  }, [navigate]);

  const handleOpenNewItemType = useCallback(() => {
    navigate('/item-types/new');
  }, [navigate]);

  const handleViewItemTypes = useCallback(() => {
    navigate('/item-types');
  }, [navigate]);

  const handleOpenEdit = useCallback(
    (row: Client) => {
      navigate(`/clients/${row._id}/edit`);
    },
    [navigate]
  );

  const handleOpenDelete = useCallback((row: Client) => {
    setClientToDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!clientToDelete) return;
    try {
      const response = await dispatch(removeClient(clientToDelete._id)).unwrap();
      const successMessage = getApiMessage(response);

      if (successMessage) {
        toast.success(successMessage);
        dispatch(showAlert({ message: successMessage, severity: 'success' }));
      }
      await fetchClients();
      handleCloseDelete();
    } catch (err) {
      console.error(err);
      const errorMessage = getApiErrorMessage(err);
      if (errorMessage) {
        toast.error(errorMessage);
        dispatch(showAlert({ message: errorMessage, severity: 'error' }));
      }
    }
  }, [clientToDelete, dispatch, fetchClients, handleCloseDelete]);

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
        <Typography variant="h4">Clients</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:eye-bold" />}
            onClick={handleViewItemTypes}
          >
            View Item Types
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenNewItemType}
          >
            New Item Type
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            Import
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenNew}
          >
            New Client
          </Button>
        </Box>
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
                  ].map((column) => (
                    <TableCell key={column.id} sortDirection={table.orderBy === column.id ? table.order : false}>
                      <TableSortLabel
                        active={table.orderBy === column.id}
                        direction={table.orderBy === column.id ? table.order : 'asc'}
                        onClick={() => table.onSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  dataFiltered
                    .map((row) => (
                      <TableRow
                        hover
                        key={row._id}
                        onClick={() => navigate(`/clients/${row._id}/items`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell component="th" scope="row">
                          {row.clientName}
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleOpenEdit(row)}>
                              <Iconify icon="solar:pen-bold" />
                            </IconButton>
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
                    <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
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
                    <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                      No clients found.
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
          rowsPerPageOptions={[5, 10, 15, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          labelRowsPerPage="Rows per page :"
        />
      </Card>

      <ClientDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        client={clientToDelete}
      />
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
