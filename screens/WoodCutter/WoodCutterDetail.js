// screens/WoodCutter/WoodCutterDetail.js
import React, { useState, useMemo, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { MaterialCommunityIcons, FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
  updateEntityData, // <-- ensure this exists in your redux slice
} from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';
import ListCardItem from '../../components/ListCardItem'; // <-- using new component

const screenWidth = Dimensions.get('window').width;

export default function WoodCutterDetail({ route }) {
  const { itemKey } = route.params;
  const dispatch = useDispatch();
  const millKey = useSelector(state => state.mill.millKey);

  const itemData = useSelector(state =>
    selectMillItemData(state, millKey, 'WoodCutter', itemKey)
  );

  // ----------------- UI State -----------------
  const [activeTab, setActiveTab] = useState('Analytics'); // Work / Payments / Analytics
  const [activeFilter, setActiveFilter] = useState({ type: 'month', from: null, to: null });

  // Add / Update modal
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [formType, setFormType] = useState('Work'); // Work / Payment
  const [editingItem, setEditingItem] = useState(null);

  // Work fields
  const [place, setPlace] = useState('');
  const [feetCut, setFeetCut] = useState('');
  const [pricePerFeet, setPricePerFeet] = useState('');

  // Payment fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Detail modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ----------------- Subscribe Redux -----------------
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'WoodCutter'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'WoodCutter'));
    };
  }, [millKey]);

  const savedWork = itemData?.Data ? Object.entries(itemData.Data).map(([id, val]) => ({ id, ...val })) : [];
  const savedPayments = itemData?.Payments ? Object.entries(itemData.Payments).map(([id, val]) => ({ id, ...val })) : [];

  // ----------------- Filtered Data -----------------
  const filteredResults = useMemo(() => {
    const { from, to } = activeFilter;
    const filterByDate = list =>
      from && to
        ? list.filter(item => {
          const ts = item.timestamp || Date.now();
          const d = new Date(ts);
          return d >= from && d <= to;
        })
        : list;
    return {
      work: filterByDate(savedWork),
      payments: filterByDate(savedPayments),
    };
  }, [savedWork, savedPayments, activeFilter]);

  const currentData = activeTab === 'Work' ? filteredResults.work : filteredResults.payments;

  // ----------------- Totals -----------------
  const totals = useMemo(() => {
    let totalFeet = 0,
      totalEarned = 0,
      totalPaidFromWork = 0,
      earningsByPlace = {};

    filteredResults.work.forEach(item => {
      const feet = Number(item.feetCut || 0);
      const price = Number(item.pricePerFeet || 0);
      const earned = feet * price;
      totalFeet += feet;
      totalEarned += earned;
      totalPaidFromWork += Number(item.payment || 0);
      const placeKey = item.place || 'Unknown';
      earningsByPlace[placeKey] = (earningsByPlace[placeKey] || 0) + earned;
    });

    const totalPayments = filteredResults.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPaid = totalPaidFromWork + totalPayments;
    const balance = totalEarned - totalPaid;

    return {
      work: { totalFeet, totalEarned, earningsByPlace, totalPaidFromWork },
      payments: { totalPayments, totalPaid, balance },
    };
  }, [filteredResults]);

  // ----------------- Add / Update -----------------
  const handleSave = () => {
    if (formType === 'Work') {
      if (!place || !feetCut || !pricePerFeet) return alert('Fill all fields');
      const data = {
        place,
        feetCut: Number(feetCut),
        pricePerFeet: Number(pricePerFeet),
        totalPrice: Number(feetCut) * Number(pricePerFeet),
        payment: 0,
        timestamp: Date.now(),
      };

      if (editingItem) {
        dispatch(updateEntityData({ millKey, entityType: 'WoodCutter', entityKey: itemKey, entryType: 'Data', itemId: editingItem.id, data }));
      } else {
        dispatch(addEntityData({ millKey, entityType: 'WoodCutter', entityKey: itemKey, entryType: 'Data', data }));
      }
      setPlace(''); setFeetCut(''); setPricePerFeet('');
    } else {
      if (!paymentAmount) return alert('Enter amount');
      const data = {
        amount: Number(paymentAmount),
        note: paymentNote || '',
        timestamp: Date.now(),
      };
      if (editingItem) {
        dispatch(updateEntityData({ millKey, entityType: 'WoodCutter', entityKey: itemKey, entryType: 'Payments', itemId: editingItem.id, data }));
      } else {
        dispatch(addEntityData({ millKey, entityType: 'WoodCutter', entityKey: itemKey, entryType: 'Payments', data }));
      }
      setPaymentAmount(''); setPaymentNote('');
    }

    setEditingItem(null);
    setInputModalVisible(false);
  };

  const handleLongPressEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'Work') {
      setFormType('Work');
      setPlace(item.place);
      setFeetCut(item.feetCut.toString());
      setPricePerFeet(item.pricePerFeet.toString());
    } else {
      setFormType('Payment');
      setPaymentAmount(item.amount.toString());
      setPaymentNote(item.note);
    }
    setInputModalVisible(true);
  };

  const formatDate = ts => ts ? new Date(ts).toLocaleDateString() : '';

  // ----------------- Render Items -----------------
  const renderItem = ({ item }) => (
    <ListCardItem
      item={item}
      activeTab={activeTab === 'Work' ? 'Work' : 'Payments'}
      onPress={(selected) => { setSelectedItem(selected); setModalVisible(true); }}
      onLongPress={(selected) => handleLongPressEdit(selected)}
      type="WoodCutter"
    />
  );

  // ----------------- Render KPIs -----------------
  const renderKpis = () => (
    <>
      <KpiAnimatedCard
        title="Earnings Overview"
        kpis={[
          { label: 'Total', value: totals.work.totalEarned || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
          { label: totals.payments.balance > 0 ? 'To Pay' : 'Advance', value: Math.abs(totals.payments.balance || 0), icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
        ]}
        progressData={{
          label: 'Total Paid',
          value: totals.payments.totalPaid || 0,
          total: totals.work.totalEarned || 0,
          icon: 'check-decagram',
          gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
        }}
      />

      <DonutKpi
        data={[
          { label: 'Paid', value: totals.payments.totalPaid || 0, color: COLORS.kpitotalpaid },
          { label: totals.payments.balance > 0 ? 'To Pay' : 'Advance', value: Math.abs(totals.payments.balance) || 0, color: totals.payments.balance > 0 ? COLORS.kpitopay : COLORS.kpiadvance },
        ]}
        showTotal={true}
        isMoney={true}
        label=""
        labelPosition="left"
      />

      <KpiAnimatedCard
        title="Work Overview"
        kpis={[
          { label: 'Total Feets', value: totals.work.totalFeet || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg], isPayment: 0 },
        ]}
      />
    </>
  );

  // ----------------- Main Return -----------------
  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        <View style={GLOBAL_STYLES.headerContainer}>
          <Text style={GLOBAL_STYLES.headerText}>{itemData?.name || 'WoodCutter Detail'}</Text>
          {activeTab !== 'Analytics' && (
            <TouchableOpacity
              onPress={() => {
                setFormType(activeTab === 'Payments' ? 'Payment' : 'Work');
                setEditingItem(null);
                setInputModalVisible(true);
              }}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <DateFilter
          dataSets={[
            { name: 'work', data: savedWork, dateKey: 'timestamp' },
            { name: 'payments', data: savedPayments, dateKey: 'timestamp' },
          ]}
          onSelect={(filter, results, range) => setActiveFilter(range)}
        />

        <TabSwitch tabs={['Analytics', 'Work', 'Payments']} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'Analytics' && <ScrollView style={{ paddingBottom: 120 }}>{renderKpis()}</ScrollView>}

        {(activeTab === 'Work' || activeTab === 'Payments') && (
          <FlatList
            data={currentData.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No data found</Text>}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}

        {/* Floating Add Button */}


        {/* Add / Update Modal */}
        <Modal visible={inputModalVisible} transparent animationType="slide">
          <View style={GLOBAL_STYLES.modalOverlay}>
            <View style={[GLOBAL_STYLES.modalBox, { padding: 18 }]}>
              <Text style={GLOBAL_STYLES.modalTitle}>
                {editingItem ? 'Update' : 'Add'} {formType === 'Work' ? 'Work' : 'Payment'}
              </Text>

              {formType === 'Work' && (
                <>
                <View style={GLOBAL_STYLES.inputRow}>
                    <View style={GLOBAL_STYLES.legendContainer}>
                      <Text style={GLOBAL_STYLES.legendText}>Place</Text>
                    </View>
                    <TextInput style={GLOBAL_STYLES.input} placeholder="Place" value={place} onChangeText={setPlace} />
                    <MaterialIcons
                      name="book"
                      size={20}
                      color={COLORS.primary}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                  <View style={GLOBAL_STYLES.inputRow}>
                    <View style={GLOBAL_STYLES.legendContainer}>
                      <Text style={GLOBAL_STYLES.legendText}>Feet Cutted</Text>
                    </View>
                     <TextInput style={GLOBAL_STYLES.input} placeholder="Feet Cut" value={feetCut} keyboardType="numeric" onChangeText={setFeetCut} />
                  
                    <MaterialCommunityIcons
                      name="axe"
                      size={20}
                      color={COLORS.primary}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                  <View style={GLOBAL_STYLES.inputRow}>
                    <View style={GLOBAL_STYLES.legendContainer}>
                      <Text style={GLOBAL_STYLES.legendText}>Per Feet Price</Text>
                    </View>
                  <TextInput style={GLOBAL_STYLES.input} placeholder="Price per Feet" value={pricePerFeet} keyboardType="numeric" onChangeText={setPricePerFeet} />
                    <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                  </View>
                  
                 
                </>
              )}

              {formType === 'Payment' && (
                <>
                  <View style={GLOBAL_STYLES.inputRow}>
                    <View style={GLOBAL_STYLES.legendContainer}>
                      <Text style={GLOBAL_STYLES.legendText}>Note</Text>
                    </View>
                    <TextInput style={GLOBAL_STYLES.input} placeholder="Note" value={paymentNote} onChangeText={setPaymentNote} />
                    <MaterialIcons
                      name="book"
                      size={20}
                      color={COLORS.primary}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                  <View style={GLOBAL_STYLES.inputRow}>
                    <View style={GLOBAL_STYLES.legendContainer}>
                      <Text style={GLOBAL_STYLES.legendText}>Amount</Text>
                    </View>
                    <TextInput style={GLOBAL_STYLES.input} placeholder="Amount" value={paymentAmount} keyboardType="numeric" onChangeText={setPaymentAmount} />
                    <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                  </View>


                </>
              )}
              {/* BUTTONS */}
              <View style={GLOBAL_STYLES.row}>
                <TouchableOpacity
                  style={[GLOBAL_STYLES.cancelbutton, { width: '47%' }]}
                  onPress={() => setInputModalVisible(false)}
                >
                  <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[GLOBAL_STYLES.button, { width: '47%' }]}
                  onPress={handleSave}
                >
                  <Text style={GLOBAL_STYLES.buttonText}>
                    {editingItem ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
