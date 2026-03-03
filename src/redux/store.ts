import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';
import clientReducer from './slices/clientSlice';
import customerReducer from './slices/customerSlice';
import itemTypeReducer from './slices/itemTypeSlice';
import clientItemReducer from './slices/clientItemSlice';
import clientHistoryReducer from './slices/clientHistorySlice';


const store = configureStore({
    reducer: {
        auth: authReducer,
        alert: alertReducer,
        customer: customerReducer,
        client: clientReducer,
        itemType: itemTypeReducer,
        clientItem: clientItemReducer,
        clientHistory: clientHistoryReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
