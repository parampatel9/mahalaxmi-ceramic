import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  getClientLedger,
  getClientHistory,
  type DayWiseEntry,
  type ClientHistory,
  deleteClientHistory,
  getClientHistoryOne,
  type MonthWiseEntry,
  postClientTransaction,
  type LedgerTransaction,
  getClientHistoryDayWise,
  getClientHistoryByClient,
  type PostTransactionBody,
  getClientHistoryMonthWise,
  type ClientLedgerResponse,
  type ClientHistoryResponse,
} from '../apis/clientHistoryApis';

type ClientHistoryState = {
  historyData: ClientHistoryResponse | null;
  historyLoading: boolean;
  historyError: string | null;
  clientHistoryData: ClientHistoryResponse | null;
  clientHistoryLoading: boolean;
  clientHistoryError: string | null;
  historyOneData: ClientHistory | null;
  historyOneLoading: boolean;
  historyOneError: string | null;
  dayWiseData: DayWiseEntry[];
  dayWiseLoading: boolean;
  dayWiseError: string | null;
  monthWiseData: MonthWiseEntry[];
  monthWiseLoading: boolean;
  monthWiseError: string | null;
  ledgerData: ClientLedgerResponse | null;
  ledgerLoading: boolean;
  ledgerError: string | null;
  transactionData: unknown;
  transactionLoading: boolean;
  transactionError: string | null;
  deleteLoading: boolean;
  deleteError: string | null;
};

const initialState: ClientHistoryState = {
  historyData: null,
  historyLoading: false,
  historyError: null,
  clientHistoryData: null,
  clientHistoryLoading: false,
  clientHistoryError: null,
  historyOneData: null,
  historyOneLoading: false,
  historyOneError: null,
  dayWiseData: [],
  dayWiseLoading: false,
  dayWiseError: null,
  monthWiseData: [],
  monthWiseLoading: false,
  monthWiseError: null,
  ledgerData: null,
  ledgerLoading: false,
  ledgerError: null,
  transactionData: null,
  transactionLoading: false,
  transactionError: null,
  deleteLoading: false,
  deleteError: null,
};

export const fetchClientHistory = createAsyncThunk(
  'clientHistory/fetchClientHistory',
  async (
    params:
      | {
          page?: number;
          limit?: number;
          billNumber?: number;
          search?: string;
          sort?: string;
          entryType?: 'sale' | 'return';
        }
      | undefined,
    thunkAPI
  ) => {
    try {
      return await getClientHistory(params);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch client history';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchClientHistoryByClient = createAsyncThunk(
  'clientHistory/fetchClientHistoryByClient',
  async (
    payload: {
      clientId: string;
      params?: { page?: number; limit?: number; search?: string; entryType?: 'sale' | 'return' };
    },
    thunkAPI
  ) => {
    try {
      return await getClientHistoryByClient(payload.clientId, payload.params);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to fetch client history by client';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchClientHistoryOne = createAsyncThunk(
  'clientHistory/fetchClientHistoryOne',
  async (id: string, thunkAPI) => {
    try {
      return await getClientHistoryOne(id);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch history entry';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const removeClientHistory = createAsyncThunk(
  'clientHistory/removeClientHistory',
  async (id: string, thunkAPI) => {
    try {
      await deleteClientHistory(id);
      return id;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete history entry';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchClientHistoryDayWise = createAsyncThunk(
  'clientHistory/fetchClientHistoryDayWise',
  async (payload: { clientId: string; params?: { page?: number; limit?: number } }, thunkAPI) => {
    try {
      const response = await getClientHistoryDayWise(payload.clientId, payload.params);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch day-wise history';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchClientHistoryMonthWise = createAsyncThunk(
  'clientHistory/fetchClientHistoryMonthWise',
  async (payload: { clientId: string; params?: { page?: number; limit?: number } }, thunkAPI) => {
    try {
      const response = await getClientHistoryMonthWise(payload.clientId, payload.params);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch month-wise history';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchClientLedger = createAsyncThunk(
  'clientHistory/fetchClientLedger',
  async (clientId: string, thunkAPI) => {
    try {
      return await getClientLedger(clientId);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch client ledger';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createClientTransaction = createAsyncThunk(
  'clientHistory/createClientTransaction',
  async (payload: { clientId: string; body: PostTransactionBody }, thunkAPI) => {
    try {
      return await postClientTransaction(payload.clientId, payload.body);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create transaction';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const clientHistorySlice = createSlice({
  name: 'clientHistory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchClientHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.historyData = action.payload;
      })
      .addCase(fetchClientHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = (action.payload as string) || 'Failed to fetch client history';
      })
      .addCase(fetchClientHistoryByClient.pending, (state) => {
        state.clientHistoryLoading = true;
        state.clientHistoryError = null;
      })
      .addCase(fetchClientHistoryByClient.fulfilled, (state, action) => {
        state.clientHistoryLoading = false;
        state.clientHistoryData = action.payload;
      })
      .addCase(fetchClientHistoryByClient.rejected, (state, action) => {
        state.clientHistoryLoading = false;
        state.clientHistoryError = (action.payload as string) || 'Failed to fetch client history by client';
      })
      .addCase(fetchClientHistoryOne.pending, (state) => {
        state.historyOneLoading = true;
        state.historyOneError = null;
      })
      .addCase(fetchClientHistoryOne.fulfilled, (state, action) => {
        state.historyOneLoading = false;
        state.historyOneData = action.payload;
      })
      .addCase(fetchClientHistoryOne.rejected, (state, action) => {
        state.historyOneLoading = false;
        state.historyOneError = (action.payload as string) || 'Failed to fetch history entry';
      })
      .addCase(removeClientHistory.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(removeClientHistory.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.historyData = state.historyData
          ? {
              ...state.historyData,
              data: state.historyData.data.filter((entry) => entry._id !== action.payload),
            }
          : state.historyData;
        state.clientHistoryData = state.clientHistoryData
          ? {
              ...state.clientHistoryData,
              data: state.clientHistoryData.data.filter((entry) => entry._id !== action.payload),
            }
          : state.clientHistoryData;
      })
      .addCase(removeClientHistory.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = (action.payload as string) || 'Failed to delete history entry';
      })
      .addCase(fetchClientHistoryDayWise.pending, (state) => {
        state.dayWiseLoading = true;
        state.dayWiseError = null;
      })
      .addCase(fetchClientHistoryDayWise.fulfilled, (state, action) => {
        state.dayWiseLoading = false;
        state.dayWiseData = action.payload;
      })
      .addCase(fetchClientHistoryDayWise.rejected, (state, action) => {
        state.dayWiseLoading = false;
        state.dayWiseError = (action.payload as string) || 'Failed to fetch day-wise history';
      })
      .addCase(fetchClientHistoryMonthWise.pending, (state) => {
        state.monthWiseLoading = true;
        state.monthWiseError = null;
      })
      .addCase(fetchClientHistoryMonthWise.fulfilled, (state, action) => {
        state.monthWiseLoading = false;
        state.monthWiseData = action.payload;
      })
      .addCase(fetchClientHistoryMonthWise.rejected, (state, action) => {
        state.monthWiseLoading = false;
        state.monthWiseError = (action.payload as string) || 'Failed to fetch month-wise history';
      })
      .addCase(fetchClientLedger.pending, (state) => {
        state.ledgerLoading = true;
        state.ledgerError = null;
      })
      .addCase(fetchClientLedger.fulfilled, (state, action) => {
        state.ledgerLoading = false;
        state.ledgerData = action.payload;
      })
      .addCase(fetchClientLedger.rejected, (state, action) => {
        state.ledgerLoading = false;
        state.ledgerError = (action.payload as string) || 'Failed to fetch client ledger';
      })
      .addCase(createClientTransaction.pending, (state) => {
        state.transactionLoading = true;
        state.transactionError = null;
      })
      .addCase(createClientTransaction.fulfilled, (state, action) => {
        state.transactionLoading = false;
        state.transactionData = action.payload;

        const transaction = (action.payload as any)?.data as LedgerTransaction | undefined;
        if (transaction && state.ledgerData) {
          state.ledgerData = {
            ...state.ledgerData,
            transactions: [transaction, ...state.ledgerData.transactions],
          };
        }
      })
      .addCase(createClientTransaction.rejected, (state, action) => {
        state.transactionLoading = false;
        state.transactionError = (action.payload as string) || 'Failed to create transaction';
      });
  },
});

export default clientHistorySlice.reducer;
