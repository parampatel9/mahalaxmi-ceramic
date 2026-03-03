import type { AxiosError } from 'axios';

import { toast } from 'react-toastify';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
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
import { fetchClient as fetchClientById } from 'src/redux/slices/clientSlice';
import {
  type ClientItem,
  type PopulatedItemType,
} from 'src/redux/apis/clientItemsApis';
import { removeClientItem, fetchClientItems as fetchClientItemsThunk } from 'src/redux/slices/clientItemSlice';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { ClientItemDeleteDialog } from '../client-item-delete-dialog';

// ----------------------------------------------------------------------

function getItemTypeName(itemTypeId?: string | PopulatedItemType): string {
  if (!itemTypeId) return '—';
  if (typeof itemTypeId === 'object' && itemTypeId !== null) return itemTypeId.itemType;
  return '—';
}

function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('itemNumber');
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

type ClientItemsViewProps = {
  clientId: string;
};

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

export function ClientItemsView({ clientId }: ClientItemsViewProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const table = useTable();
  const [items, setItems] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [debouncedFilterName, setDebouncedFilterName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ClientItem | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterName(filterName);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterName]);

  const fetchItems = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const response = await dispatch(
        fetchClientItemsThunk({
          clientId,
          params: {
            page: table.page + 1,
            limit: table.rowsPerPage,
            searchFields: debouncedFilterName,
          },
        })
      ).unwrap();
      setItems(response.data);
      setTotalItems(response.pagination?.total ?? 0);
    } catch {
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [clientId, debouncedFilterName, dispatch, table.page, table.rowsPerPage]);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    try {
      const response = await dispatch(fetchClientById(clientId)).unwrap();
      setClientName(response.clientName);
    } catch (err) {
      console.error(err);
    }
  }, [clientId, dispatch]);

  useEffect(() => {
    fetchItems();
    fetchClient();
  }, [fetchItems, fetchClient]);

  const dataFiltered = items; // Backend already filtered/paged

  const notFound = !loading && !dataFiltered.length && !!filterName;

  const handleOpenNew = useCallback(() => {
    navigate(`/clients/${clientId}/items/new`);
  }, [clientId, navigate]);

  const handleOpenEdit = useCallback(
    (row: ClientItem) => {
      navigate(`/clients/${clientId}/items/${row._id}/edit`);
    },
    [clientId, navigate]
  );

  const handleOpenDelete = useCallback((row: ClientItem) => {
    setItemToDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!clientId || !itemToDelete) return;
    try {
      const response = await dispatch(removeClientItem({ clientId, itemId: itemToDelete._id })).unwrap();
      const successMessage = getApiMessage(response);
      if (successMessage) {
        toast.success(successMessage);
        dispatch(showAlert({ message: successMessage, severity: 'success' }));
      }
      await fetchItems();
      handleCloseDelete();
    } catch (err) {
      console.error(err);
      const errorMessage = getApiErrorMessage(err);
      if (errorMessage) {
        toast.error(errorMessage);
        dispatch(showAlert({ message: errorMessage, severity: 'error' }));
      }
    }
  }, [clientId, dispatch, itemToDelete, fetchItems, handleCloseDelete]);

  if (!clientId) {
    return (
      <DashboardContent>
        <Typography color="text.secondary">Invalid client</Typography>
      </DashboardContent>
    );
  }

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
          <Typography variant="h4">Client Items: {clientName || '...'}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenNew}
        >
          New Item
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs value="items" aria-label="Client tabs">
          <Tab label="Client Items" value="items" />
          <Tab
            label="Client History"
            value="history"
            component={RouterLink}
            to={`/clients/${clientId}/history`}
          />
        </Tabs>
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
            placeholder="Search items..."
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
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {[
                    { id: 'itemNumber', label: 'Item Number' },
                    { id: 'oldItemName', label: 'Old Item Name' },
                    { id: 'itemType', label: 'Item Type' },
                    // { id: 'actualPrice', label: 'Actual Price' },
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
                    <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  dataFiltered.map((row) => (
                    <TableRow hover key={row._id}>
                      <TableCell>{row.itemNumber}</TableCell>
                      <TableCell>{row.oldItemName || '—'}</TableCell>
                      <TableCell>
                        {getItemTypeName(row.itemTypeId) !== '—' ? (
                          <Chip
                            label={getItemTypeName(row.itemTypeId)}
                            size="small"
                            variant="filled"
                            color="primary"
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      {/* <TableCell>{row.actualPrice}</TableCell> */}
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <span>
                            <IconButton
                              onClick={() => handleOpenEdit(row)}
                            >
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
                    <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
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
                    <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                      No items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={totalItems}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 15, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          labelRowsPerPage="Rows per page :"
        />
      </Card>

      <ClientItemDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
      />
    </DashboardContent>
  );
}
