import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  addClient,
  getClient,
  getClients,
  type Client,
  deleteClient,
  updateClient,
  type ClientPayload,
  type ClientResponse,
  type ClientMutationResponse,
} from '../apis/clientsApis';

type ClientState = {
  clientsData: ClientResponse | null;
  clientsLoading: boolean;
  clientsError: string | null;
  clientData: Client | null;
  clientLoading: boolean;
  clientError: string | null;
  mutationData: ClientMutationResponse | null;
  mutationLoading: boolean;
  mutationError: string | null;
};

const initialState: ClientState = {
  clientsData: null,
  clientsLoading: false,
  clientsError: null,
  clientData: null,
  clientLoading: false,
  clientError: null,
  mutationData: null,
  mutationLoading: false,
  mutationError: null,
};

export const fetchClients = createAsyncThunk(
  'client/fetchClients',
  async (
    params: { page?: number; limit?: number; searchFields?: string } | undefined,
    thunkAPI
  ) => {
    try {
      return await getClients(params);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch clients';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchClient = createAsyncThunk('client/fetchClient', async (id: string, thunkAPI) => {
  try {
    return await getClient(id);
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to fetch client';
    return thunkAPI.rejectWithValue(message);
  }
});

export const createClient = createAsyncThunk(
  'client/createClient',
  async (data: ClientPayload, thunkAPI) => {
    try {
      return await addClient(data);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create client';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const editClient = createAsyncThunk(
  'client/editClient',
  async ({ id, data }: { id: string; data: ClientPayload }, thunkAPI) => {
    try {
      return await updateClient(id, data);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update client';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const removeClient = createAsyncThunk('client/removeClient', async (id: string, thunkAPI) => {
  try {
    return await deleteClient(id);
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to delete client';
    return thunkAPI.rejectWithValue(message);
  }
});

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.clientsLoading = true;
        state.clientsError = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.clientsLoading = false;
        state.clientsData = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.clientsLoading = false;
        state.clientsError = (action.payload as string) || 'Failed to fetch clients';
      })
      .addCase(fetchClient.pending, (state) => {
        state.clientLoading = true;
        state.clientError = null;
      })
      .addCase(fetchClient.fulfilled, (state, action) => {
        state.clientLoading = false;
        state.clientData = action.payload;
      })
      .addCase(fetchClient.rejected, (state, action) => {
        state.clientLoading = false;
        state.clientError = (action.payload as string) || 'Failed to fetch client';
      })
      .addCase(createClient.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to create client';
      })
      .addCase(editClient.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(editClient.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(editClient.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to update client';
      })
      .addCase(removeClient.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(removeClient.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(removeClient.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to delete client';
      });
  },
});

export default clientSlice.reducer;
