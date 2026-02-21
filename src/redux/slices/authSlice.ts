import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginData } from 'src/utils/types';

import { toast } from 'react-toastify';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { clearLocalStorage } from 'src/utils/appUtils';

import { loginUser, logoutUser } from '../apis/authApis';

const initialState: AuthState = {
    data: null,
    loading: false,
    error: null,
    signupLoading: false,
    forgotPassLoading: false,
};

export const login = createAsyncThunk('/auth/login', async (payload: LoginData, thunkAPI) => {
    try {
        const response = await loginUser(payload);
        toast.success(response?.data?.message || 'Login successful!');
        return response.data;
    } catch (err: any) {
        const errorMessage = err?.data?.message || 'Login failed';
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage);
    }
});

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch, rejectWithValue }) => {
    try {
        const response = await logoutUser();
        toast.success(response?.data?.message || 'Logged Out successful!');
        sessionStorage.removeItem('jwtToken');
        clearLocalStorage();
        dispatch(setLoginData(null));
        return true;
    } catch (err: any) {
        const errorMessage = err?.data?.message || 'Internal server Error';
        toast.error(errorMessage);
        // Even if the API fails, we should clear the local state to allow the user to "log out" locally
        sessionStorage.removeItem('jwtToken');
        clearLocalStorage();
        dispatch(setLoginData(null));
        return rejectWithValue(errorMessage);
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setLoginData: (state, action: PayloadAction<any>) => {
            state.data = action.payload;
        },
        resetAuth: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.signupLoading = true;
            })
            .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
                state.signupLoading = false;
                state.data = action.payload;
            })
            .addCase(login.rejected, (state, action: PayloadAction<any>) => {
                state.signupLoading = false;
                state.error = action.payload;
            })
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.data = null;
                state.loading = false;
            })
            .addCase(logout.rejected, (state) => {
                state.data = null;
                state.loading = false;
            });
    },
});

export const { setLoginData } = authSlice.actions;
export default authSlice.reducer;
