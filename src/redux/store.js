import { configureStore } from '@reduxjs/toolkit';
import millReducer from './slices/millSlice';
import workerReducer from './slices/workerSlice';
import staffReducer from './slices/staffSlice';

const store = configureStore({
  reducer: {
    mill: millReducer,
    workers: workerReducer,
    staff: staffReducer,
  },
});

export default store;
