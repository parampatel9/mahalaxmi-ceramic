import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { getNextBillNumber, type NextBillNumberResponse } from '../apis/customersApis';

type CustomerState = {
  nextBillNumberData: NextBillNumberResponse | null;
  nextBillNumberLoading: boolean;
  nextBillNumberError: string | null;
};

const initialState: CustomerState = {
  nextBillNumberData: null,
  nextBillNumberLoading: false,
  nextBillNumberError: null,
};

export const fetchNextBillNumber = createAsyncThunk(
  'customer/fetchNextBillNumber',
  async (_, thunkAPI) => {
    try {
      return await getNextBillNumber();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to fetch next bill number';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNextBillNumber.pending, (state) => {
        state.nextBillNumberLoading = true;
        state.nextBillNumberError = null;
      })
      .addCase(fetchNextBillNumber.fulfilled, (state, action) => {
        state.nextBillNumberLoading = false;
        state.nextBillNumberData = action.payload;
      })
      .addCase(fetchNextBillNumber.rejected, (state, action) => {
        state.nextBillNumberLoading = false;
        state.nextBillNumberError = (action.payload as string) || 'Failed to fetch next bill number';
      });
  },
});

export default customerSlice.reducer;
