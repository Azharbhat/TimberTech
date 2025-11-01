// src/redux/slices/millSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { database } from '../../../Firebase/FirebaseConfig';
import { ref, get, push, set,update, serverTimestamp, onValue, off } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base-64';

/* ---------------- Decode JWT Token ---------------- */
const decodeJwtToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = decode(payload);
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
};

/* ---------------- Initial Entity State ---------------- */
const initialEntityState = {
  Workers: {},
  BoxMakers: {},
  BoxBuyers: {},
  Transporters: {},
  WoodCutter: {},
  FlatLogCalculations: {},
  LogCalculations: {},
};

/* ---------------- Fetch Mill Data Once ---------------- */
export const fetchMillData = createAsyncThunk(
  'mill/fetchMillData',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('TimberTechTokken');
      if (!token) return rejectWithValue('NO_TOKEN');

      const decoded = decodeJwtToken(token);
      const userId = decoded?.sub;
      if (!userId) return rejectWithValue('INVALID_TOKEN');

      const millsSnap = await get(ref(database, 'Mills'));
      if (!millsSnap.exists()) throw new Error('No Mills found');

      let millData = null;
      let millKey = null;

      millsSnap.forEach((child) => {
        const data = child.val();
        if (data.id === userId) {
          millData = data;
          millKey = child.key;
        }
      });

      if (!millData) throw new Error('Mill not found');
      return { millData, millKey };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* ---------------- Real-Time Mill Subscription ---------------- */
let millListenerRef = null;
export const startMillSubscription = () => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem('TimberTechTokken');
    if (!token) throw new Error('NO_TOKEN');

    const decoded = decodeJwtToken(token);
    const userId = decoded?.sub;
    if (!userId) throw new Error('INVALID_TOKEN');

    const millsRef = ref(database, 'Mills');

    // Remove existing listener
    if (millListenerRef) off(millsRef, 'value', millListenerRef);

    millListenerRef = onValue(
      millsRef,
      (snapshot) => {
        let millData = null;
        let millKey = null;

        snapshot.forEach((child) => {
          const data = child.val();
          if (data.id === userId) {
            millData = data;
            millKey = child.key;
          }
        });

        if (millData && millKey) {
          dispatch(setMillDataRealtime({ millData, millKey }));
        }
      },
      (err) => console.error('Mill listener error:', err)
    );
  } catch (err) {
    console.error('Subscription Error:', err);
  }
};

export const stopMillSubscription = () => () => {
  try {
    if (millListenerRef) {
      const millsRef = ref(database, 'Mills');
      off(millsRef, 'value', millListenerRef);
      millListenerRef = null;
    }
  } catch (err) {
    console.error('Unsubscribe Error:', err);
  }
};

/* ---------------- Real-Time Entity Subscriptions ---------------- */
const entityListeners = {};

export const subscribeEntity = (millKey, entityType) => (dispatch) => {
  if (!millKey || !entityType) return;

  const entityRef = ref(database, `Mills/${millKey}/${entityType}`);

  // Remove any previous listener for this entityType
  if (entityListeners[entityType]) off(entityRef, 'value', entityListeners[entityType]);

  entityListeners[entityType] = onValue(
    entityRef,
    (snapshot) => {
      const entities = {};

      snapshot.forEach((entitySnap) => {
        const entityKey = entitySnap.key;
        const entityData = entitySnap.val();

        const processedEntity = {};

        // Loop through sub-collections like Data or Tips
        Object.entries(entityData || {}).forEach(([subType, subVal]) => {
          if (typeof subVal === 'object') {
            const subEntries = {};
            Object.entries(subVal).forEach(([childKey, childValue]) => {
              subEntries[childKey] = { key: childKey, ...childValue }; // ✅ attach Firebase key
            });
            processedEntity[subType] = subEntries;
          } else {
            processedEntity[subType] = subVal;
          }
        });

        entities[entityKey] = processedEntity;
      });

      dispatch(setEntityRealtime({ entityType, data: entities }));
    },
    (err) => console.error(`${entityType} listener error:`, err)
  );
};


export const stopSubscribeEntity = (millKey, entityType) => () => {
  if (!millKey || !entityType || !entityListeners[entityType]) return;
  const entityRef = ref(database, `Mills/${millKey}/${entityType}`);
  off(entityRef, 'value', entityListeners[entityType]);
  entityListeners[entityType] = null;
};

/* ---------------- Add Payment / Work ---------------- */

export const addEntityData = createAsyncThunk(
  'mill/addEntityData',
  async ({ millKey, entityType, entityKey, entryType, data, dataKey }, { rejectWithValue }) => {
    try {
      if (!millKey || !entityType || !entityKey) throw new Error('Missing parameters');

      const basePath = `Mills/${millKey}/${entityType}/${entityKey}/${entryType}`;
      const baseRef = ref(database, basePath);

      let finalKey;

      if (dataKey) {
        const itemRef = ref(database, `${basePath}/${dataKey}`);
        const { createdDate, ...rest } = data || {};
        const updatePayload = {
          ...rest,
          timestamp: serverTimestamp(),
        };
        if (createdDate !== undefined && createdDate !== null) {
          updatePayload.createdDate = createdDate;
        }

        await update(itemRef, updatePayload);
        finalKey = dataKey;

      } else {
        // ➕ Create new entry
        const newRef = push(baseRef);
        const payload = {
          ...data,
          createdDate: data?.createdDate ?? Date.now(), // ensure createdDate exists
          timestamp: serverTimestamp(),
        };
        await set(newRef, payload);
        finalKey = newRef.key;
      }

      // Return normalized data (note: we convert serverTimestamp to Date.now for UI)
      return {
        entityType,
        entityKey,
        data: { ...data, key: finalKey, timestamp: Date.now() },
      };
    } catch (err) {
      console.error('Add/Update Entity Data Error:', err);
      return rejectWithValue(err.message || 'Unknown error');
    }
  }
);
export const updateEntityData = createAsyncThunk(
  'mill/updateEntityData',
  async ({ millKey, entityType, entityKey, entryType, entryId, data }, { rejectWithValue }) => {
    try {
      if (!millKey || !entityType || !entityKey || !entryType || !data?.key)
        throw new Error('Missing parameters');

      const itemRef = ref(
        database,
        `Mills/${millKey}/${entityType}/${entityKey}/${entryType}/${data.key}`
      );
      const { key, id, ...rest } = data || {};
      await update(itemRef, {
        ...rest,
        timestamp: serverTimestamp(),
      });
      return {
        entityType,
        entityKey,
        entryType,
        entryId,
        data: { ...data, timestamp: Date.now() },
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Unknown error');
    }
  }
);



/* ---------------- Slice ---------------- */
const millSlice = createSlice({
  name: 'mill',
  initialState: {
    millData: { ...initialEntityState },
    millKey: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearMillData: (state) => {
      state.millData = { ...initialEntityState };
      state.millKey = null;
      state.error = null;
    },
    setMillDataRealtime: (state, action) => {
      const { millData, millKey } = action.payload;
      state.millData = { ...initialEntityState, ...millData };
      state.millKey = millKey;
    },
    setEntityRealtime: (state, action) => {
      const { entityType, data } = action.payload;
      if (!state.millData[entityType]) state.millData[entityType] = {};
      state.millData[entityType] = data;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMillData.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchMillData.fulfilled, (s, a) => {
        s.loading = false;
        s.millData = { ...initialEntityState, ...a.payload.millData };
        s.millKey = a.payload.millKey;
      })
      .addCase(fetchMillData.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload; // Will now include 'NO_TOKEN' or 'INVALID_TOKEN'
      })
      .addCase(addEntityData.fulfilled, (s, a) => {
        const { entityType, entityKey, data } = a.payload;
        if (!s.millData[entityType]) s.millData[entityType] = {};
        if (!s.millData[entityType][entityKey]) s.millData[entityType][entityKey] = {};
        if (!s.millData[entityType][entityKey].Data)
          s.millData[entityType][entityKey].Data = [];
        s.millData[entityType][entityKey].Data.push(data);
      });
  },
});

/* ---------------- Selectors ---------------- */
export const selectMillDataByType = (state, dataType) =>
  state.mill.millData?.[dataType] || {};

export const selectMillItemData = (state, millKey, dataType, itemKey) => {
  try {
    const activeMillKey = millKey || state.mill.millKey;
    if (!activeMillKey) return null;

    const dataGroup = state.mill.millData?.[dataType];
    if (!dataGroup) return null;

    return itemKey ? dataGroup[itemKey] || null : dataGroup;
  } catch (err) {
    console.error('Selector error:', err);
    return null;
  }
};

export const { clearMillData, setMillDataRealtime, setEntityRealtime } = millSlice.actions;
export default millSlice.reducer;
