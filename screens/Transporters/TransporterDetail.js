// TransporterDetail.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import CustomPicker from '../../components/CustomPicker';
import { useSelector, useDispatch } from 'react-redux';
import DateFilter from '../../components/Datefilter';
import ListCardItem from '../../components/ListCardItem';
import { PieChart } from 'react-native-chart-kit';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';

const screenWidth = Dimensions.get('window').width;

export default function TransporterDetail({ route }) {
  // route params (safe)
  const { key, itemKey, data } = route.params ?? {};

  const dispatch = useDispatch();
  // redux / fallback
  const millKey = useSelector((state) => state?.mill?.millKey) ?? key;
  const itemData = useSelector((state) =>
    selectMillItemData(state, millKey, 'Transporters', itemKey)
  ) ?? {};

  // UI tabs
  const [activeTab, setActiveTab] = useState('Shipped'); // Shipped / Payments
  const [activeSubTab, setActiveSubTab] = useState('Analytics'); // Analytics / History

  // form modal (create/update)
  const [formVisible, setFormVisible] = useState(false);
  const [formType, setFormType] = useState('Box'); // Box / Log / Other / Payment
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null); // firebase key for update

  // Common
  const [amount, setAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Box-specific
  const [fromPlace, setFromPlace] = useState('Chotipora');
  const [destination, setDestination] = useState('');
  const [toFull, setToFull] = useState(false);
  const [toHalf, setToHalf] = useState(false);
  const [fullQuantity, setFullQuantity] = useState('');
  const [halfQuantity, setHalfQuantity] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [selectedBuyerId, setSelectedBuyerId] = useState(''); // id from BoxBuyers
  const [manualBuyerName, setManualBuyerName] = useState('');

  // Log-specific
  const [logFrom, setLogFrom] = useState('Chotipora');
  const [logTo, setLogTo] = useState('');
  const [logShippingCost, setLogShippingCost] = useState('');
  const [logNote, setLogNote] = useState('');

  // Other-specific
  const [otherFrom, setOtherFrom] = useState('');
  const [otherTo, setOtherTo] = useState('');
  const [otherShippingCost, setOtherShippingCost] = useState('');
  const [otherNote, setOtherNote] = useState('');

  // data arrays
  const [savedShipped, setSavedShipped] = useState([]); // array of { id, ... }
  const [savedPayments, setSavedPayments] = useState([]);
  const [boxBuyers, setBoxBuyers] = useState([]);

  // filter range
  const [activeFilterRange, setActiveFilterRange] = useState({ type: 'month', from: null, to: null });

  // detail modal (view)
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ---------- Firebase listeners ----------
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'Transporters'));

    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'Transporters'));
    };
  }, [millKey]);

  useEffect(() => {
    if (!millKey || !itemKey) return;

    const shippedRef = ref(database, `Mills/${millKey}/Transporters/${itemKey}/Shipped`);
    const payRef = ref(database, `Mills/${millKey}/Transporters/${itemKey}/Payments`);
    const buyersRef = ref(database, `Mills/${millKey}/BoxBuyers`);

    const handleShipped = (snap) => {
      try {
        const val = snap.val() ?? {};
        const arr = val && typeof val === 'object' && !Array.isArray(val)
          ? Object.keys(val).map(k => ({ id: k, ...val[k] }))
          : Array.isArray(val) ? val : [];
        setSavedShipped(arr);
      } catch (e) {
        console.warn('shipped parse error', e);
        setSavedShipped([]);
      }
    };

    const handlePayments = (snap) => {
      try {
        const val = snap.val() ?? {};
        const arr = val && typeof val === 'object' && !Array.isArray(val)
          ? Object.keys(val).map(k => ({ id: k, ...val[k] }))
          : Array.isArray(val) ? val : [];
        setSavedPayments(arr);
      } catch (e) {
        console.warn('payments parse error', e);
        setSavedPayments([]);
      }
    };

    const handleBuyers = (snap) => {
      try {
        const val = snap.val() ?? {};
        const arr = val && typeof val === 'object' && !Array.isArray(val)
          ? Object.keys(val).map(k => ({ id: k, ...val[k] }))
          : Array.isArray(val) ? val : [];
        setBoxBuyers(arr);
      } catch (e) {
        console.warn('buyers parse error', e);
        setBoxBuyers([]);
      }
    };

    const unsubShipped = onValue(shippedRef, handleShipped, (err) => { console.warn('shipped listener err', err); setSavedShipped([]); });
    const unsubPay = onValue(payRef, handlePayments, (err) => { console.warn('payments listener err', err); setSavedPayments([]); });
    const unsubBuyers = onValue(buyersRef, handleBuyers, (err) => { console.warn('buyers listener err', err); setBoxBuyers([]); });

    return () => {
      try { off(shippedRef); } catch (e) { }
      try { off(payRef); } catch (e) { }
      try { off(buyersRef); } catch (e) { }
    };
  }, [millKey, itemKey]);

  // ---------- Derived / filters ----------
  const filteredResults = useMemo(() => {
    const results = { shipped: [], payments: [] };
    const from = activeFilterRange?.from;
    const to = activeFilterRange?.to;

    const safeFilter = (arr = []) => {
      if (!Array.isArray(arr)) return [];
      if (!from || !to) return arr;
      const fromD = from instanceof Date ? from : new Date(from);
      const toD = to instanceof Date ? to : new Date(to);
      return arr.filter(it => {
        try {
          const d = it?.timestamp ? new Date(it.timestamp) : null;
          if (!d) return false;
          return d >= fromD && d <= toD;
        } catch (e) {
          return false;
        }
      });
    };

    results.shipped = safeFilter(savedShipped);
    results.payments = safeFilter(savedPayments);
    return results;
  }, [savedShipped, savedPayments, activeFilterRange]);

  const currentData = activeTab === 'Shipped' ? filteredResults.shipped : filteredResults.payments;

  const totals = useMemo(() => {
    const shippedArr = Array.isArray(filteredResults.shipped) ? filteredResults.shipped : [];
    const paymentsArr = Array.isArray(filteredResults.payments) ? filteredResults.payments : [];

    const totalShipped = shippedArr.length;
    const boxShippedCount = shippedArr.filter(d => d?.shippingItem === 'Box').length;
    const logShippedCount = shippedArr.filter(d => d?.shippingItem === 'Log').length;
    const otherShippedCount = shippedArr.filter(d => d?.shippingItem === 'Other').length;

    let totalFullQty = 0;
    let totalHalfQty = 0;
    let boxEarning = 0;
    let logEarning = 0;
    let otherEarning = 0;
    let totalEarned = 0;

    shippedArr.forEach(d => {
      const amt = Number(d?.shippingCost ?? d?.amount ?? 0) || 0;
      if (d?.shippingItem === 'Box') {
        boxEarning += amt;
        totalEarned += amt;
        totalFullQty += Number(d?.fullQuantity ?? 0) || 0;
        totalHalfQty += Number(d?.halfQuantity ?? 0) || 0;
      } else if (d?.shippingItem === 'Log') {
        logEarning += amt;
        totalEarned += amt;
      } else if (d?.shippingItem === 'Other') {
        otherEarning += amt;
        totalEarned += amt;
      }
    });

    let totalPaid = 0;
    const paymentModeMap = {};
    paymentsArr.forEach(p => {
      const amt = Number(p?.amount ?? 0) || 0;
      totalPaid += amt;
      const mode = p?.mode ?? 'Unknown';
      if (!paymentModeMap[mode]) paymentModeMap[mode] = { sum: 0, count: 0 };
      paymentModeMap[mode].sum += amt;
      paymentModeMap[mode].count += 1;
    });

    const balance = totalEarned - totalPaid;

    return {
      shipped: {
        totalShipped,
        boxShippedCount,
        logShippedCount,
        otherShippedCount,
        totalFullQty,
        totalHalfQty,
        boxEarning,
        logEarning,
        otherEarning,
        totalEarned,
      },
      payments: {
        totalPaid,
        paymentModeMap,
        balance,
      },
    };
  }, [filteredResults]);

  // ---------- Create (addEntry) ----------
  const addEntry = () => {
    try {
      const timestamp = Date.now();

      if (formType === 'Payment') {
        if (!amount) return Alert.alert('Validation', 'Enter amount');

        const data = {
          amount: Number(amount || 0),
          note: paymentNote ?? '',
          name: data?.name ?? itemData?.name ?? '',
          timestamp,
        };

        dispatch(
          addEntityData({
            millKey,
            entityType: 'Transporters',
            entityKey: itemKey,
            entryType: 'Payments',
            data,
          })
        );

      } else {
        const base = { shippingItem: formType, timestamp };

        if (formType === 'Box') {
          if (!(toFull || toHalf)) return Alert.alert('Validation', 'Select Full or Half or both');
          if (toFull && !fullQuantity) return Alert.alert('Validation', 'Enter full quantity');
          if (toHalf && !halfQuantity) return Alert.alert('Validation', 'Enter half quantity');

          const buyerNameFromList =
            selectedBuyerId && Array.isArray(boxBuyers)
              ? boxBuyers.find(b => b?.id === selectedBuyerId)?.name ?? ''
              : '';

          const entry = {
            ...base,
            from: fromPlace ?? 'Chotipora',
            destination: destination ?? '',
            fullQuantity: toFull ? Number(fullQuantity || 0) : 0,
            halfQuantity: toHalf ? Number(halfQuantity || 0) : 0,
            toFull: !!toFull,
            toHalf: !!toHalf,
            shippingCost: Number(shippingCost || 0) || 0,
            buyerId: selectedBuyerId ?? '',
            buyerName: selectedBuyerId ? buyerNameFromList : manualBuyerName ?? '',
          };

          // dispatch entry for transporter shipped
          dispatch(
            addEntityData({
              millKey,
              entityType: 'Transporters',
              entityKey: itemKey,
              entryType: 'Shipped',
              data: entry,
            })
          );

          // if buyer selected, also store under buyer shipped (only on create)
          if (selectedBuyerId) {
            const buyerData = {
              transporterId: itemKey,
              transporterName: data?.name ?? itemData?.name ?? '',
              from: entry.from,
              destination: entry.destination,
              fullQuantity: entry.fullQuantity,
              halfQuantity: entry.halfQuantity,
              shippingCost: entry.shippingCost,
              timestamp,
            };

            dispatch(
              addEntityData({
                millKey,
                entityType: 'BoxBuyers',
                entityKey: selectedBuyerId,
                entryType: 'Shipped',
                data: buyerData,
              })
            );
          }
        } else if (formType === 'Log') {
          const entry = {
            ...base,
            from: logFrom ?? '',
            to: logTo ?? '',
            shippingCost: Number(logShippingCost || 0) || 0,
            note: logNote ?? '',
          };

          dispatch(
            addEntityData({
              millKey,
              entityType: 'Transporters',
              entityKey: itemKey,
              entryType: 'Shipped',
              data: entry,
            })
          );
        } else if (formType === 'Other') {
          const entry = {
            ...base,
            from: otherFrom ?? '',
            to: otherTo ?? '',
            shippingCost: Number(otherShippingCost || 0) || 0,
            note: otherNote ?? '',
          };

          dispatch(
            addEntityData({
              millKey,
              entityType: 'Transporters',
              entityKey: itemKey,
              entryType: 'Shipped',
              data: entry,
            })
          );
        }
      }

      // reset form
      resetFormState();
    } catch (e) {
      console.error('Add entry error', e);
      Alert.alert('Error', 'Could not add entry');
    }
  };

  // ---------- Update (updateEntry) ----------
  const updateEntry = () => {
    try {
      if (!editId) return Alert.alert('Error', 'No item selected to update');
      const timestamp = Date.now();

      if (formType === 'Payment') {
        if (!amount) return Alert.alert('Validation', 'Enter amount');

        const dataPayload = {
          amount: Number(amount || 0),
          note: paymentNote ?? '',
          timestamp,
        };

        dispatch(
          addEntityData({
            millKey,
            entityType: 'Transporters',
            entityKey: itemKey,
            entryType: 'Payments',
            data: dataPayload,
            dataKey: editId,
          })
        );
      } else {
        const base = { shippingItem: formType, timestamp };

        if (formType === 'Box') {
          if (!(toFull || toHalf)) return Alert.alert('Validation', 'Select Full or Half or both');
          if (toFull && !fullQuantity) return Alert.alert('Validation', 'Enter full quantity');
          if (toHalf && !halfQuantity) return Alert.alert('Validation', 'Enter half quantity');

          const buyerNameFromList =
            selectedBuyerId && Array.isArray(boxBuyers)
              ? boxBuyers.find(b => b?.id === selectedBuyerId)?.name ?? ''
              : '';

          const entry = {
            ...base,
            from: fromPlace ?? 'Chotipora',
            destination: destination ?? '',
            fullQuantity: toFull ? Number(fullQuantity || 0) : 0,
            halfQuantity: toHalf ? Number(halfQuantity || 0) : 0,
            toFull: !!toFull,
            toHalf: !!toHalf,
            shippingCost: Number(shippingCost || 0) || 0,
            buyerId: selectedBuyerId ?? '',
            buyerName: selectedBuyerId ? buyerNameFromList : manualBuyerName ?? '',
          };

          dispatch(
            addEntityData({
              millKey,
              entityType: 'Transporters',
              entityKey: itemKey,
              entryType: 'Shipped',
              data: entry,
              dataKey: editId,
            })
          );

          // NOTE: we do not automatically edit the buyer's "BoxBuyers/ID/Shipped" entry to avoid linking complexities.
          // If you want that behavior we can implement matching and update there too.
        } else if (formType === 'Log') {
          const entry = {
            ...base,
            from: logFrom ?? '',
            to: logTo ?? '',
            shippingCost: Number(logShippingCost || 0) || 0,
            note: logNote ?? '',
          };

          dispatch(
            addEntityData({
              millKey,
              entityType: 'Transporters',
              entityKey: itemKey,
              entryType: 'Shipped',
              data: entry,
              dataKey: editId,
            })
          );
        } else if (formType === 'Other') {
          const entry = {
            ...base,
            from: otherFrom ?? '',
            to: otherTo ?? '',
            shippingCost: Number(otherShippingCost || 0) || 0,
            note: otherNote ?? '',
          };

          dispatch(
            addEntityData({
              millKey,
              entityType: 'Transporters',
              entityKey: itemKey,
              entryType: 'Shipped',
              data: entry,
              dataKey: editId,
            })
          );
        }
      }

      // reset form
      resetFormState();
    } catch (e) {
      console.error('Update entry error', e);
      Alert.alert('Error', 'Could not update entry');
    }
  };

  // ---------- Reset form state helper ----------
  const resetFormState = () => {
    setFormVisible(false);
    setFormType('Box');
    setIsEditMode(false);
    setEditId(null);
    setAmount('');
    setPaymentNote('');
    setFromPlace('Chotipora');
    setDestination('');
    setToFull(false);
    setToHalf(false);
    setFullQuantity('');
    setHalfQuantity('');
    setShippingCost('');
    setSelectedBuyerId('');
    setManualBuyerName('');
    setLogFrom('Chotipora');
    setLogTo('');
    setLogShippingCost('');
    setLogNote('');
    setOtherFrom('');
    setOtherTo('');
    setOtherShippingCost('');
    setOtherNote('');
  };

  // ---------- Edit flow: open modal prefilled ----------
  const handleLongPressEdit = (item) => {
    if (!item) return;
    // If Payment item (in Payments list)
    const isPayment = item?.amount != null && (activeTab === 'Payments' || item?.type === 'payment');

    if (isPayment) {
      setIsEditMode(true);
      setEditId(item.id);
      setFormType('Payment');
      setAmount(String(item.amount ?? ''));
      setPaymentNote(item.note ?? '');
      setFormVisible(true);
      return;
    }

    // Otherwise treat as Shipped item (Box / Log / Other)
    const shippedType = item?.shippingItem ?? (item?.type ? String(item.type) : 'Box');
    const upperType = shippedType.charAt(0).toUpperCase() + shippedType.slice(1);
    setIsEditMode(true);
    setEditId(item.id);
    setFormType(upperType === 'Log' ? 'Log' : upperType === 'Other' ? 'Other' : 'Box');

    // populate fields based on type
    if (upperType === 'Log') {
      setLogFrom(item.from ?? 'Chotipora');
      setLogTo(item.to ?? item.destination ?? '');
      setLogShippingCost(String(item.shippingCost ?? item.amount ?? ''));
      setLogNote(item.note ?? '');
    } else if (upperType === 'Other') {
      setOtherFrom(item.from ?? '');
      setOtherTo(item.to ?? item.destination ?? '');
      setOtherShippingCost(String(item.shippingCost ?? item.amount ?? ''));
      setOtherNote(item.note ?? '');
    } else {
      // Box
      setFromPlace(item.from ?? 'Chotipora');
      setDestination(item.destination ?? '');
      setToFull(!!item.toFull);
      setToHalf(!!item.toHalf);
      setFullQuantity(String(item.fullQuantity ?? ''));
      setHalfQuantity(String(item.halfQuantity ?? ''));
      setShippingCost(String(item.shippingCost ?? item.amount ?? ''));
      setSelectedBuyerId(item.buyerId ?? '');
      setManualBuyerName(item.buyerName ?? '');
    }

    setFormVisible(true);
  };

  // ---------- Render helpers ----------
  const renderKpis = () => {
    const s = totals?.shipped ?? {};
    const p = totals?.payments ?? {};
    if (activeTab === 'Shipped') {
      return (
        <>
          <KpiAnimatedCard
            title="Shipping Box Overview"
            kpis={[
              { label: 'Full', value: s.totalFullQty || 0, icon: 'warehouse', gradient: [COLORS.kpibase, COLORS.kpibaseg], isPayment: 0 },
              { label: 'Half', value: s.totalHalfQty || 0, icon: 'cube-outline', gradient: [COLORS.kpiextra, COLORS.kpiextrag], isPayment: 0 },
            ]}
          />
          <DonutKpi
            data={[
              { label: 'Full', value: s.totalFullQty || 0, color: COLORS.kpibase },
              { label: 'Half', value: s.totalHalfQty || 0, color: COLORS.kpiextra },
            ]}
            showTotal={false}
            isMoney={false}
            label=""
            labelPosition="right"
          />
          <KpiAnimatedCard
            title="Shipping Overview"
            kpis={[
              { label: 'Boxs', value: s.boxShippedCount || 0, icon: 'cube', gradient: [COLORS.kpibase, COLORS.kpibaseg], isPayment: 0 },
              { label: 'Logs', value: s.logShippedCount || 0, icon: 'nature', gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg], isPayment: 0 },
              { label: 'Other', value: s.otherShippedCount || 0, icon: 'dots-horizontal', gradient: [COLORS.kpiextra, COLORS.kpiextrag], isPayment: 0 },
              { label: 'Total', value: s.totalShipped || 0, icon: 'calculator', gradient: [COLORS.kpitotal, COLORS.kpitotalg], isPayment: 0 },
            ]}
          />
          <DonutKpi
            data={[
              { label: 'Box', value: s.boxShippedCount || 0, color: COLORS.kpibase },
              { label: 'Log', value: s.logShippedCount || 0, color: COLORS.kpitotalpaid },
              { label: 'Other', value: s.otherShippedCount || 0, color: COLORS.kpiextra },
            ]}
            showTotal={false}
            isMoney={false}
            label=""
            labelPosition="left"
          />
        </>
      );
    } else {
      return (
        <>
          <KpiAnimatedCard
            title="Earnings Overview"
            kpis={[
              { label: 'Boxs', value: s.boxEarning || 0, icon: 'cash', gradient: [COLORS.kpibase, COLORS.kpibaseg] },
              { label: 'Logs', value: s.logEarning || 0, icon: 'plus-circle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] },
              { label: 'Other', value: s.otherEarning || 0, icon: 'plus-circle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] },
              { label: 'Total', value: s.totalEarned || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
              { label: p.balance > 0 ? 'To Pay' : 'Advance', value: Math.abs(p.balance) || 0, icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
            ]}
            progressData={{
              label: 'Total Paid',
              value: p.totalPaid || 0,
              total: s.totalEarned || 0,
              icon: 'check-decagram',
              gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
            }}
          />
          <DonutKpi
            data={[
              { label: 'Paid', value: p.totalPaid || 0, color: COLORS.kpitotalpaid },
              { label: 'Total', value: s.totalEarned || 0, color: COLORS.kpitotalg },
            ]}
            showTotal={true}
            isMoney={true}
            label="Shipping"
            labelPosition="left"
          />
        </>
      );
    }
  };

 const renderItem = ({ item }) => (
  <ListCardItem
    item={item}
    activeTab={activeTab}
    onPress={(selected) => {
      setSelectedItem(selected);
      setDetailModalVisible(true);
    }}
    onLongPress={(selected) => handleLongPressEdit(selected)}
    type = 'Transporter'
  />
);

  // ---------- UI ----------
  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>{data?.name ?? itemData?.name ?? 'Transporter'}</Text>
        <TouchableOpacity onPress={() => { setIsEditMode(false); resetFormState(); setFormVisible(true); setFormType('Box'); }}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

      </View>

      {/* DateFilter */}
      <DateFilter
        filters={['day', 'week', 'month', 'year', 'all']}
        dataSets={[
          { name: 'shipped', data: Array.isArray(savedShipped) ? savedShipped : [], dateKey: 'timestamp' },
          { name: 'payments', data: Array.isArray(savedPayments) ? savedPayments : [], dateKey: 'timestamp' },
        ]}
        onSelect={(selectedFilter, filtered, range) => {
          setActiveFilterRange(range ?? { type: selectedFilter, from: null, to: null });
        }}
      />

      {/* Primary Tabs */}
      <TabSwitch tabs={['Shipped', 'Payments']} activeTab={activeTab} onChange={(t) => setActiveTab(t)} />

      {/* Secondary Tabs */}
      <TabSwitch tabs={['Analytics', 'History']} activeTab={activeSubTab} onChange={(t) => setActiveSubTab(t)} />

      {/* KPIs & Pie */}
      {activeSubTab !== 'History' && (
        <ScrollView>
          {renderKpis()}
        </ScrollView>
      )}

      {/* History */}
      {activeSubTab === 'History' && (
        <FlatList
          data={Array.isArray(currentData) ? currentData : []}
          keyExtractor={(item) => String(item?.id ?? item?.timestamp ?? JSON.stringify(item))}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No records</Text>}
        />
      )}

      {/* Floating Add Button */}

      {/* Add / Edit Form Modal */}
      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View
            style={[
              GLOBAL_STYLES.modalBox,
              {
                padding: 20,
                maxHeight: '80%', // 🔹 limit modal height to 80% of screen
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={{

              }}
              showsVerticalScrollIndicator={true}
            >
              <Text style={GLOBAL_STYLES.modalTitle}>
                {isEditMode ? 'Update Entry' : 'Add Entry'}
              </Text>

              {/* Conditional Tabs based on main tab */}
              {activeTab === 'Shipped' && (
                <TabSwitch
                  tabs={['Box', 'Log', 'Other']}
                  activeTab={formType}
                  onChange={(t) => setFormType(t)}
                />
              )}

              {/* BOX FORM */}
              {activeTab === 'Shipped' && formType === 'Box' && (
                <>
                  <CustomPicker
                    options={(Array.isArray(boxBuyers) ? boxBuyers : []).map(b => ({
                      label: b?.name ?? b?.id,
                      value: b?.id,
                    }))}
                    selectedValue={selectedBuyerId}
                    onValueChange={(v) => {
                      setSelectedBuyerId(v);
                      const found = (boxBuyers || []).find(b => b?.id === v);
                      setManualBuyerName(found?.name ?? '');
                    }}
                    placeholder="Select Box Buyer (optional)"
                  />
                  <TextInput
                    placeholder="Buyer name (manual)"
                    style={[GLOBAL_STYLES.input, { marginTop: 8 }]}
                    value={manualBuyerName}
                    onChangeText={setManualBuyerName}
                  />
                  <TextInput
                    placeholder="From"
                    style={GLOBAL_STYLES.input}
                    value={fromPlace}
                    onChangeText={setFromPlace}
                  />
                  <TextInput
                    placeholder="Destination"
                    style={GLOBAL_STYLES.input}
                    value={destination}
                    onChangeText={setDestination}
                  />

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginVertical: 8,
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        GLOBAL_STYLES.button,
                        {
                          flex: 1,
                          marginRight: 5,
                          backgroundColor: toFull ? COLORS.primary : COLORS.border,
                        },
                      ]}
                      onPress={() => setToFull(prev => !prev)}
                    >
                      <Text style={GLOBAL_STYLES.buttonText}>Full</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        GLOBAL_STYLES.button,
                        {
                          flex: 1,
                          marginLeft: 5,
                          backgroundColor: toHalf ? COLORS.primary : COLORS.border,
                        },
                      ]}
                      onPress={() => setToHalf(prev => !prev)}
                    >
                      <Text style={GLOBAL_STYLES.buttonText}>Half</Text>
                    </TouchableOpacity>
                  </View>

                  {(toFull || toHalf) && (
                    <>
                      {toFull && (
                        <TextInput
                          placeholder="Full Quantity"
                          style={GLOBAL_STYLES.input}
                          value={fullQuantity}
                          onChangeText={setFullQuantity}
                          keyboardType="numeric"
                        />
                      )}
                      {toHalf && (
                        <TextInput
                          placeholder="Half Quantity"
                          style={GLOBAL_STYLES.input}
                          value={halfQuantity}
                          onChangeText={setHalfQuantity}
                          keyboardType="numeric"
                        />
                      )}
                    </>
                  )}

                  <TextInput
                    placeholder="Shipping Cost"
                    style={GLOBAL_STYLES.input}
                    value={shippingCost}
                    onChangeText={setShippingCost}
                    keyboardType="numeric"
                  />
                </>
              )}

              {/* LOG FORM */}
              {activeTab === 'Shipped' && formType === 'Log' && (
                <>
                  <TextInput
                    placeholder="From"
                    style={GLOBAL_STYLES.input}
                    value={logFrom}
                    onChangeText={setLogFrom}
                  />
                  <TextInput
                    placeholder="To"
                    style={GLOBAL_STYLES.input}
                    value={logTo}
                    onChangeText={setLogTo}
                  />
                  <TextInput
                    placeholder="Shipping Cost"
                    style={GLOBAL_STYLES.input}
                    value={logShippingCost}
                    onChangeText={setLogShippingCost}
                    keyboardType="numeric"
                  />
                  <TextInput
                    placeholder="Note"
                    style={GLOBAL_STYLES.input}
                    value={logNote}
                    onChangeText={setLogNote}
                  />
                </>
              )}

              {/* OTHER FORM */}
              {activeTab === 'Shipped' && formType === 'Other' && (
                <>
                  <TextInput
                    placeholder="From"
                    style={GLOBAL_STYLES.input}
                    value={otherFrom}
                    onChangeText={setOtherFrom}
                  />
                  <TextInput
                    placeholder="To"
                    style={GLOBAL_STYLES.input}
                    value={otherTo}
                    onChangeText={setOtherTo}
                  />
                  <TextInput
                    placeholder="Shipping Cost"
                    style={GLOBAL_STYLES.input}
                    value={otherShippingCost}
                    onChangeText={setOtherShippingCost}
                    keyboardType="numeric"
                  />
                  <TextInput
                    placeholder="Note"
                    style={GLOBAL_STYLES.input}
                    value={otherNote}
                    onChangeText={setOtherNote}
                  />
                </>
              )}

              {/* PAYMENT FORM (only when main tab = Payments) */}
              {activeTab === 'Payments' && (
                <>
                  <TextInput
                    placeholder="Amount"
                    style={GLOBAL_STYLES.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                  <TextInput
                    placeholder="Note"
                    style={GLOBAL_STYLES.input}
                    value={paymentNote}
                    onChangeText={setPaymentNote}
                  />
                </>
              )}

              {/* BUTTONS */}
              <View style={GLOBAL_STYLES.row}>
                <TouchableOpacity
                  style={[GLOBAL_STYLES.cancelbutton, { width: '47%' }]}
                  onPress={() => resetFormState()}
                >
                  <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[GLOBAL_STYLES.button, { width: '47%' }]}
                  onPress={() => {
                    if (isEditMode) updateEntry();
                    else addEntry();
                  }}
                >
                  <Text style={GLOBAL_STYLES.buttonText}>
                    {isEditMode ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}
