import type { PayloadAction } from '@reduxjs/toolkit';

import { createSlice } from '@reduxjs/toolkit';

interface AlertState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

const initialState: AlertState = {
    open: false,
    message: '',
    severity: 'info',
};

const alertSlice = createSlice({
    name: 'alert',
    initialState,
    reducers: {
        showAlert: (
            state,
            action: PayloadAction<{ message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>
        ) => {
            state.open = true;
            state.message = action.payload.message;
            state.severity = action.payload.severity || 'info';
        },
        hideAlert: (state) => {
            state.open = false;
        },
    },
});

export const { showAlert, hideAlert } = alertSlice.actions;
export default alertSlice.reducer;
