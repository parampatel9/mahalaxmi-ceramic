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
import { type ItemType } from 'src/redux/apis/itemTypesApis';
import { removeItemType, fetchItemTypes as fetchItemTypesThunk } from 'src/redux/slices/itemTypeSlice';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { emptyRows } from '../utils';
import { ItemTypeDeleteDialog } from '../item-type-delete-dialog';

// ----------------------------------------------------------------------

function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('itemType');
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

export function ItemTypesView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const table = useTable();
  const [items, setItems] = useState<ItemType[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [debouncedFilterName, setDebouncedFilterName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemType | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterName(filterName);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterName]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dispatch(
        fetchItemTypesThunk({
        page: table.page + 1,
        limit: table.rowsPerPage,
        searchFields: debouncedFilterName,
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
  }, [dispatch, table.page, table.rowsPerPage, debouncedFilterName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const dataFiltered = items;

  const notFound = !loading && !dataFiltered.length && !!filterName;

  const handleOpenNew = useCallback(() => {
    navigate('/item-types/new');
  }, [navigate]);

  const handleOpenEdit = useCallback(
    (row: ItemType) => {
      navigate(`/item-types/${row._id}/edit`);
    },
    [navigate]
  );

  const handleOpenDelete = useCallback((row: ItemType) => {
    setItemToDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      const response = await dispatch(removeItemType(itemToDelete._id)).unwrap();
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
  }, [dispatch, fetchItems, handleCloseDelete, itemToDelete]);

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
        <Typography variant="h4">Item Types</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenNew}
        >
          New Item Type
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
            placeholder="Search item types..."
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
                    { id: 'itemType', label: 'Item Type' },
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
                    <TableCell colSpan={2} align="center" sx={{ py: 10 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  dataFiltered.map((row) => (
                    <TableRow hover key={row._id}>
                      <TableCell>{row.itemType}</TableCell>
                      <TableCell align="right">
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
                    <TableCell colSpan={2} align="center" sx={{ py: 10 }}>
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
                    <TableCell colSpan={2} align="center" sx={{ py: 10 }}>
                      No item types found.
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
          count={totalItems}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 15, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          labelRowsPerPage="Rows per page :"
        />
      </Card>
      <ItemTypeDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
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
