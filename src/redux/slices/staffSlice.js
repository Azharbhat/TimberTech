// src/redux/slices/staffSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';

// Fetch staff by category
export const fetchStaffByCategory = createAsyncThunk(
  'staff/fetchByCategory',
  async (category) => {
    const snapshot = await get(ref(db, `staff/${category}`));
    return snapshot.val() || [];
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState: {
    data: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaffByCategory.pending, (state) => { state.loading = true; })
      .addCase(fetchStaffByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.data[action.meta.arg] = action.payload;
      })
      .addCase(fetchStaffByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default staffSlice.reducer;
