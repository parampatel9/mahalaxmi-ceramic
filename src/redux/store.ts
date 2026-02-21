import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';


const store = configureStore({
    reducer: {
        auth: authReducer,
        alert: alertReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
