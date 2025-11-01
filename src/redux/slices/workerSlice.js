// src/redux/slices/workerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { database } from '../../../Firebase/FirebaseConfig';
import { ref, get, push, set, serverTimestamp, onValue, off } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base-64';

/* ---------------------------------------------
   Helper: Decode JWT token to get userId
--------------------------------------------- */
const decodeJwtToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = decode(payload);
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
};

/* ---------------------------------------------
   Async thunk: Fetch Workers (one-time fetch)
--------------------------------------------- */
export const fetchWorkers = createAsyncThunk(
  'workers/fetchWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const userToken = await AsyncStorage.getItem('TimberTechTokken');
      if (!userToken) throw new Error('No token found');

      const decodedToken = decodeJwtToken(userToken);
      const userId = decodedToken?.sub;
      if (!userId) throw new Error('Invalid token');

      const snapshot = await get(ref(database, 'Mills'));
      if (!snapshot.exists()) throw new Error('No Mills found');

      let workersData = {};
      let millKey = null;

      snapshot.forEach((child) => {
        const data = child.val();
        if (data.id === userId) {
          workersData = data.Workers || {};
          millKey = child.key;
        }
      });

      if (!millKey) throw new Error('Mill not found');

      return { workersData, millKey };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/* ---------------------------------------------
   Async thunk: Subscribe to Workers (real-time)
--------------------------------------------- */
export const subscribeWorkers = createAsyncThunk(
  'workers/subscribeWorkers',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const userToken = await AsyncStorage.getItem('TimberTechTokken');
      if (!userToken) throw new Error('No token found');

      const decodedToken = decodeJwtToken(userToken);
      const userId = decodedToken?.sub;
      if (!userId) throw new Error('Invalid token');

      const millsRef = ref(database, 'Mills');

      onValue(millsRef, (snapshot) => {
        let workersData = {};
        let millKey = null;

        snapshot.forEach((child) => {
          const data = child.val();
          if (data.id === userId) {
            workersData = data.Workers || {};
            millKey = child.key;
          }
        });

        if (millKey) {
          dispatch(fetchWorkers.fulfilled({ workersData, millKey }));
        }
      });

      return () => off(millsRef);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/* ---------------------------------------------
   Async thunk: Add Worker
--------------------------------------------- */
export const ManageEntry = createAsyncThunk(
  'workers/ManageEntry',
  async ({ millKey, workerData }, { rejectWithValue }) => {
    try {
      if (!millKey) throw new Error('Mill key is required');

      const workersRef = ref(database, `Mills/${millKey}/Workers`);
      const newWorkerRef = push(workersRef);

      await set(newWorkerRef, {
        ...workerData,
        timestamp: serverTimestamp(),
      });

      return { workerKey: newWorkerRef.key, workerData: { ...workerData, timestamp: Date.now() } };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/* ---------------------------------------------
   Slice Definition
--------------------------------------------- */
const workerSlice = createSlice({
  name: 'workers',
  initialState: {
    workersData: {},
    millKey: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearWorkers: (state) => {
      state.workersData = {};
      state.millKey = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------- Fetch Workers ---------- */
      .addCase(fetchWorkers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.loading = false;
        state.workersData = action.payload.workersData;
        state.millKey = action.payload.millKey;
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- Add Worker ---------- */
      .addCase(ManageEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ManageEntry.fulfilled, (state, action) => {
        state.loading = false;
        const { workerKey, workerData } = action.payload;
        state.workersData[workerKey] = workerData;
      })
      .addCase(ManageEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/* ---------------------------------------------
   Exports
--------------------------------------------- */
export const { clearWorkers } = workerSlice.actions;
export default workerSlice.reducer;
