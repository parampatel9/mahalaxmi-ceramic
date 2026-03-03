import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  addItemType,
  getItemType,
  getItemTypes,
  type ItemType,
  deleteItemType,
  updateItemType,
  type ItemTypePayload,
  type ItemTypeResponse,
  type ItemTypeMutationResponse,
} from '../apis/itemTypesApis';

type ItemTypeState = {
  itemTypesData: ItemTypeResponse | null;
  itemTypesLoading: boolean;
  itemTypesError: string | null;
  itemTypeData: ItemType | null;
  itemTypeLoading: boolean;
  itemTypeError: string | null;
  mutationData: ItemTypeMutationResponse | null;
  mutationLoading: boolean;
  mutationError: string | null;
};

const initialState: ItemTypeState = {
  itemTypesData: null,
  itemTypesLoading: false,
  itemTypesError: null,
  itemTypeData: null,
  itemTypeLoading: false,
  itemTypeError: null,
  mutationData: null,
  mutationLoading: false,
  mutationError: null,
};

export const fetchItemTypes = createAsyncThunk(
  'itemType/fetchItemTypes',
  async (
    params: { page?: number; limit?: number; searchFields?: string } | undefined,
    thunkAPI
  ) => {
    try {
      return await getItemTypes(params);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch item types';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchItemType = createAsyncThunk(
  'itemType/fetchItemType',
  async (id: string, thunkAPI) => {
    try {
      return await getItemType(id);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch item type';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createItemType = createAsyncThunk(
  'itemType/createItemType',
  async (data: ItemTypePayload, thunkAPI) => {
    try {
      return await addItemType(data);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create item type';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const editItemType = createAsyncThunk(
  'itemType/editItemType',
  async ({ id, data }: { id: string; data: ItemTypePayload }, thunkAPI) => {
    try {
      return await updateItemType(id, data);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update item type';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const removeItemType = createAsyncThunk(
  'itemType/removeItemType',
  async (id: string, thunkAPI) => {
    try {
      return await deleteItemType(id);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete item type';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const itemTypeSlice = createSlice({
  name: 'itemType',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItemTypes.pending, (state) => {
        state.itemTypesLoading = true;
        state.itemTypesError = null;
      })
      .addCase(fetchItemTypes.fulfilled, (state, action) => {
        state.itemTypesLoading = false;
        state.itemTypesData = action.payload;
      })
      .addCase(fetchItemTypes.rejected, (state, action) => {
        state.itemTypesLoading = false;
        state.itemTypesError = (action.payload as string) || 'Failed to fetch item types';
      })
      .addCase(fetchItemType.pending, (state) => {
        state.itemTypeLoading = true;
        state.itemTypeError = null;
      })
      .addCase(fetchItemType.fulfilled, (state, action) => {
        state.itemTypeLoading = false;
        state.itemTypeData = action.payload;
      })
      .addCase(fetchItemType.rejected, (state, action) => {
        state.itemTypeLoading = false;
        state.itemTypeError = (action.payload as string) || 'Failed to fetch item type';
      })
      .addCase(createItemType.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(createItemType.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(createItemType.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to create item type';
      })
      .addCase(editItemType.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(editItemType.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(editItemType.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to update item type';
      })
      .addCase(removeItemType.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(removeItemType.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.mutationData = action.payload;
      })
      .addCase(removeItemType.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = (action.payload as string) || 'Failed to delete item type';
      });
  },
});

export default itemTypeSlice.reducer;
