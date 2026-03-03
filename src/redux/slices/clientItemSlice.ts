import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  addClientItem,
  getClientItem,
  getClientItems,
  type ClientItem,
  deleteClientItem,
  updateClientItem,
  getAllClientItems,
  type ClientItemPayload,
  type ClientItemResponse,
  type ClientItemMutationResponse,
} from '../apis/clientItemsApis';

type ClientItemState = {
  clientItemsData: ClientItemResponse | null;
  clientItemsLoading: boolean;
  clientItemsError: string | null;
  allClientItemsData: ClientItemResponse | null;
  allClientItemsLoading: boolean;
  allClientItemsError: string | null;
  clientItemData: ClientItem | null;
  clientItemLoading: boolean;
  clientItemError: string | null;
  mutationData: ClientItemMutationResponse | null;
  mutationLoading: boolean;
  mutationError: string | null;
};

const initialState: ClientItemState = {
  clientItemsData: null,
  clientItemsLoading: false,
  clientItemsError: null,
  allClientItemsData: null,
  allClientItemsLoading: false,
  allClientItemsError: null,
  clientItemData: null,
  clientItemLoading: false,
  clientItemError: null,
  mutationData: null,
  mutationLoading: false,
  mutationError: null,
};

export const fetchClientItems = createAsyncThunk(
  'clientItem/fetchClientItems',
  async (
    payload: {
      clientId: string;
      params?: { page?: number; limit?: number; searchFields?: string };
    },
    thunkAPI
  ) => {
    try {
      return await getClientItems(payload.clientId, payload.params);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch client items';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchAllClientItems = createAsyncThunk(
  'clientItem/fetchAllClientItems',
  async (params: { page?: number; limit?: number; search?: string } | undefined, thunkAPI) => {
    try {
      return await getAllClientItems(params);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to fetch all client items';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchClientItem = createAsyncThunk(
  'clientItem/fetchClientItem',
  async (payload: { clientId: string; itemId: string }, thunkAPI) => {
    try {
      return await getClientItem(payload.clientId, payload.itemId);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch client item';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createClientItem = createAsyncThunk(
  'clientItem/createClientItem',
  async (payload: { clientId: string; data: ClientItemPayload }, thunkAPI) => {
    try {
      return await addClientItem(payload.clientId, payload.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create client item';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const editClientItem = createAsyncThunk(
  'clientItem/editClientItem',
  async (payload: { clientId: string; itemId: string; data: ClientItemPayload }, thunkAPI) => {
    try {
      return await updateClientItem(payload.clientId, payload.itemId, payload.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update client item';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const removeClientItem = createAsyncThunk(
  'clientItem/removeClientItem',
  async (payload: { clientId: string; itemId: string }, thunkAPI) => {
    try {
      return await deleteClientItem(payload.clientId, payload.itemId);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete client item';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const clientItemSlice = createSlice({
  name: 'clientItem',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientItems.pending, (state) => {
        state.clientItemsLoading = true;
        state.clientItemsError = null;
      })
      .addCase(fetchClientItems.fulfilled, (state, action) => {
        state.clientItemsLoading = false;
        state.clientItemsData = action.payload;
      })
      .addCase(fetchClientItems.rejected, (state, action) => {
        state.clientItemsLoading = false;
        state.clientItemsError = (action.payload as string) || 'Failed to fetch client items';
      })
      .addCase(fetchAllClientItems.pending, (state) => {
        state.allClientItemsLoading = true;
        state.allClientItemsError = null;
      })
      .addCase(fetchAllClientItems.fulfilled, (state, action) => {
        state.allClientItemsLoading = false;
        state.allClientItemsData = action.payload;
      })
      .addCase(fetchAllClientItems.rejected, (state, action) => {
        state.allClientItemsLoading = false;
        state.allClientItemsError = (action.payload as string) || 'Failed to fetch all client items';
      })
      .addCase(fetchClientItem.pending, (state) => {
        state.clientItemLoading = true;
        state.clientItemError = null;
      })
      .addCase(fetchClientItem.fulfilled, (state, action) => {
        state.clientItemLoading = false;
        state.clientItemData = action.payload;
      })
      .addCase(fetchClientItem.rejected, (state, action) => {
        state.clientItemLoading = false;
        state.clientItemError = (action.payload as string) || 'Failed to fetch client item';
      })
      .addCase(createClientItem.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(createClientItem.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(createClientItem.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to create client item';
      })
      .addCase(editClientItem.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(editClientItem.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(editClientItem.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to update client item';
      })
      .addCase(removeClientItem.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(removeClientItem.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(removeClientItem.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to delete client item';
      });
  },
});

export default clientItemSlice.reducer;
