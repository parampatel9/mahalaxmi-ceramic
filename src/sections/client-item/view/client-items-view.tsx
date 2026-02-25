import { Link as RouterLink } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
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
import CircularProgress from '@mui/material/CircularProgress';

import { getClient } from 'src/redux/apis/clientsApis';
import { DashboardContent } from 'src/layouts/dashboard';
import { getItemTypes, type ItemType } from 'src/redux/apis/itemTypesApis';
import {
  addClientItem,
  getClientItem,
  getClientItems,
  type ClientItem,
  updateClientItem,
  deleteClientItem,
  type PopulatedItemType,
} from 'src/redux/apis/clientItemsApis';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { ClientItemFormDialog } from '../client-item-form-dialog';
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

export function ClientItemsView({ clientId }: ClientItemsViewProps) {
  const table = useTable();
  const [items, setItems] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [debouncedFilterName, setDebouncedFilterName] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClientItem | null>(null);
  const [editLoading, setEditLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ClientItem | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterName(filterName);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterName]);

  const fetchItemTypes = useCallback(async () => {
    try {
      const response = await getItemTypes({ limit: 1000 });
      setItemTypes(response.data);
    } catch {
      setItemTypes([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const response = await getClientItems(clientId, {
        page: table.page + 1,
        limit: table.rowsPerPage,
        searchFields: debouncedFilterName,
      });
      setItems(response.data);
      setTotalItems(response.pagination?.total ?? 0);
    } catch {
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [clientId, table.page, table.rowsPerPage, debouncedFilterName]);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    try {
      const response = await getClient(clientId);
      setClientName(response.clientName);
    } catch (err) {
      console.error(err);
    }
  }, [clientId]);

  useEffect(() => {
    fetchItems();
    fetchClient();
    fetchItemTypes();
  }, [fetchItems, fetchClient, fetchItemTypes]);

  const dataFiltered = items; // Backend already filtered/paged

  const notFound = !loading && !dataFiltered.length && !!filterName;

  const handleOpenNew = useCallback(() => {
    setEditItem(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    async (row: ClientItem) => {
      setEditLoading(row._id);
      try {
        const fresh = await getClientItem(clientId, row._id);
        setEditItem(fresh);
      } catch {
        setEditItem(row);
      } finally {
        setEditLoading(null);
        setFormOpen(true);
      }
    },
    [clientId]
  );

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setEditItem(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (itemNumber: string, actualPrice: number, itemTypeId: string) => {
      if (!clientId) return;
      try {
        if (editItem) {
          await updateClientItem(clientId, editItem._id, { itemNumber, actualPrice, itemTypeId });
        } else {
          await addClientItem(clientId, { itemNumber, actualPrice, itemTypeId });
        }
        await fetchItems();
        handleCloseForm();
      } catch (err) {
        console.error(err);
      }
    },
    [clientId, editItem, fetchItems, handleCloseForm]
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
      await deleteClientItem(clientId, itemToDelete._id);
      await fetchItems();
      handleCloseDelete();
    } catch (err) {
      console.error(err);
    }
  }, [clientId, itemToDelete, fetchItems, handleCloseDelete]);

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
                    { id: 'itemType', label: 'Item Type' },
                    { id: 'actualPrice', label: 'Actual Price' },
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
                      <TableCell>{row.actualPrice}</TableCell>
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

      <ClientItemFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        item={editItem}
        title={editItem ? 'Edit Item' : 'New Item'}
        submitLabel={editItem ? 'Update' : 'Create'}
        itemTypes={itemTypes}
      />

      <ClientItemDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
      />
    </DashboardContent>
  );
}
