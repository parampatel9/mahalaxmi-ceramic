import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';
import customerReducer from './slices/customerSlice';


const store = configureStore({
    reducer: {
        auth: authReducer,
        alert: alertReducer,
        customer: customerReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
