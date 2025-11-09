// screens/OtherIncome.js
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
  Alert,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 ,MaterialIcons} from '@expo/vector-icons';

import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { PieChart } from 'react-native-chart-kit';
import ListCardItem from '../../components/ListCardItem';

import CustomPicker from '../../components/CustomPicker';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
  updateEntityData, // ✅ imported
} from '../../src/redux/slices/millSlice';

import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';


const screenWidth = Dimensions.get('window').width;

export default function Othericome({ route }) {
  const dispatch = useDispatch();
  const { itemKey } = route.params;
  const millKey = useSelector((state) => state.mill.millKey);
  const [editMode, setEditMode] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  // Subscribe to OtherIncome
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'OtherIncome'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'OtherIncome'));
    };
  }, [millKey]);

  const otherIcomeData = useSelector((state) =>
    selectMillItemData(state, millKey, 'OtherIncome', itemKey)
  );

  const incomeData = otherIcomeData?.Income
    ? Object.entries(otherIcomeData.Income).map(([key, value]) => ({
      key,        // preserve Firebase key for updates
      ...value,   // keep the rest of the data
    }))
    : [];


  const paymentsData = otherIcomeData?.Payments
    ? Object.values(otherIcomeData.Payments)
    : [];

  const [activeSubTab, setActiveSubTab] = useState('Analytics');
  const [activeFilter, setActiveFilter] = useState({ from: null, to: null });
  const [sortFilter, setSortFilter] = useState('All');
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchItem, setSelectedSearchItem] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [note, setNote] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidStatus, setPaidStatus] = useState('No'); // No | Half | Full
  const [paidAmount, setPaidAmount] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');

  // ------------------- Helpers -------------------
  const computeIncomePaid = (income) => {
    const linkedPaymentsSum = paymentsData
      .filter((p) => p.incomeId === income.id)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const initPaid = Number(income.initialPaid || 0);
    return initPaid + linkedPaymentsSum;
  };

  // ------------------- Tab & Filter -------------------
  const entriesForCurrentTab = useMemo(() => {
    if (activeSubTab === 'Payment') return paymentsData;
    return incomeData;
  }, [activeSubTab, incomeData, paymentsData]);

  const filteredEntries = useMemo(() => {
    let data = entriesForCurrentTab.slice();

    if (activeFilter.from && activeFilter.to) {
      data = data.filter((item) => {
        const d = new Date(item.timestamp);
        return d >= activeFilter.from && d <= activeFilter.to;
      });
    }

    if (searchQuery.trim()) {
      data = data.filter((item) =>
        (item.note || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeSubTab === 'Income') {
      data = data.map((e) => {
        const paidAmt = computeIncomePaid(e);
        const remaining = Number(e.total || 0) - paidAmt;
        return { ...e, paidAmt, remaining };
      });

      switch (sortFilter) {
        case 'Remaining':
          data = data.filter((d) => d.remaining > 0);
          break;
        case 'Lower First':
          data.sort((a, b) => a.total - b.total);
          break;
        case 'Higher First':
          data.sort((a, b) => b.total - a.total);
          break;
        case 'Remaining Lower First':
          data.sort((a, b) => a.remaining - b.remaining);
          break;
        case 'Remaining Higher First':
          data.sort((a, b) => b.remaining - a.remaining);
          break;
        default:
          data.sort((a, b) => b.timestamp - a.timestamp);
      }
    } else {
      data.sort((a, b) => b.timestamp - a.timestamp);
    }

    return data;
  }, [entriesForCurrentTab, activeFilter, searchQuery, sortFilter]);

  const safeEntries = Array.isArray(filteredEntries) ? filteredEntries : [];

  // ------------------- Pie Charts -------------------
  const groupedIncome = useMemo(() => {
    const groups = {};
    safeEntries.forEach((exp) => {
      const note = exp.note?.trim() || 'Others';
      const amount = Number(exp.total) || 0;
      if (!groups[note]) groups[note] = 0;
      groups[note] += amount;
    });

    const colors = [
      '#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336',
      '#00BCD4', '#8BC34A', '#FFC107', '#795548', '#607D8B',
    ];

    return Object.entries(groups).map(([note, total], idx) => ({
      name: note,
      population: total,
      color: colors[idx % colors.length],
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    }));
  }, [safeEntries]);

  const displayTotals = useMemo(() => {
    let total = 0, paid = 0, remaining = 0;
    safeEntries.forEach((e) => {
      const t = Number(e.total || 0);
      const p = computeIncomePaid(e);
      total += t;
      paid += p;
      remaining += Math.max(0, t - p);
    });
    return { total, paid, remaining };
  }, [safeEntries]);

  // ------------------- Search Suggestions -------------------
  const suggestionList = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const uniqueNotesMap = {};
    incomeData.forEach((item) => {
      const note = (item.note || 'Untitled Income').trim();
      if (note.toLowerCase().includes(searchQuery.toLowerCase())) {
        if (!uniqueNotesMap[note.toLowerCase()]) {
          uniqueNotesMap[note.toLowerCase()] = item;
        }
      }
    });
    return Object.values(uniqueNotesMap).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }, [searchQuery, incomeData]);

  const finalEntries = useMemo(() => {
    if (selectedSearchItem && selectedSearchItem.note) {
      const noteLower = selectedSearchItem.note.toLowerCase();
      if (activeSubTab === 'Income') {
        return incomeData
          .filter((e) => (e.note || '').toLowerCase() === noteLower)
          .map((e) => {
            const paidAmt = computeIncomePaid(e);
            const remaining = Number(e.total || 0) - paidAmt;
            return { ...e, paidAmt, remaining };
          });
      } else if (activeSubTab === 'Payment') {
        const incomeIds = incomeData
          .filter((e) => (e.note || '').toLowerCase() === noteLower)
          .map((e) => e.id);
        return paymentsData
          .filter((p) => incomeIds.includes(p.incomeId))
          .sort((a, b) => b.timestamp - a.timestamp);
      } else {
        const filteredIncome = incomeData.filter(
          (e) => (e.note || '').toLowerCase() === noteLower
        );
        const total = filteredIncome.reduce((sum, e) => sum + Number(e.total || 0), 0);
        const paid = filteredIncome.reduce((sum, e) => sum + computeIncomePaid(e), 0);
        const remaining = Math.max(0, total - paid);

        return { income: filteredIncome, totals: { total, paid, remaining } };
      }
    }
    return safeEntries;
  }, [selectedSearchItem, activeSubTab, incomeData, paymentsData, safeEntries]);

  // ------------------- Add Income -------------------
  const addIncome = async () => {
    if (!totalAmount) return Alert.alert('Error', 'Enter total amount');
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) return Alert.alert('Error', 'Enter a valid total amount');

    let initialPaid = 0;
    if (paidStatus === 'Half') {
      if (!paidAmount) return Alert.alert('Error', 'Enter paid amount for Half option');
      initialPaid = parseFloat(paidAmount);
      if (isNaN(initialPaid) || initialPaid < 0) return Alert.alert('Error', 'Enter a valid paid amount');
      if (initialPaid > total) return Alert.alert('Error', 'Paid cannot exceed total');
    } else if (paidStatus === 'Full') {
      initialPaid = total;
    }

    const incomeEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      note: note || '',
      total,
      initialPaid,
      timestamp: Date.now(),
    };

    await dispatch(
      addEntityData({
        millKey,
        entityType: 'OtherIncome',
        entityKey: itemKey,
        entryType: 'Income',
        data: incomeEntry,
      })
    );

    setNote('');
    setTotalAmount('');
    setPaidStatus('No');
    setPaidAmount('');
    setInputModalVisible(false);
    setSelectedSearchItem(null);
    setSearchQuery('');
  };
  // ------------------- Add Payment -------------------
  const addPayment = async () => {
    if (!paymentAmount) return Alert.alert('Error', 'Enter payment amount');
    const payAmt = parseFloat(paymentAmount);
    if (isNaN(payAmt) || payAmt <= 0) return Alert.alert('Error', 'Enter a valid payment amount');

    if (selectedIncome) {
      const currentPaid = computeIncomePaid(selectedIncome);
      const remaining = Number(selectedIncome.total || 0) - currentPaid;
      if (payAmt > remaining) return Alert.alert('Error', `Payment exceeds remaining amount (₹${remaining.toFixed(2)})`);
    }

    const paymentEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      note: selectedIncome ? `Payment against ${selectedIncome.note || selectedIncome.id}` : '',
      amount: payAmt,
      incomeId: selectedIncome ? selectedIncome.id : undefined,
      timestamp: Date.now(),
    };

    await dispatch(
      addEntityData({
        millKey,
        entityType: 'OtherIncome',
        entityKey: itemKey,
        entryType: 'Payments',
        data: paymentEntry,
      })
    );

    setSelectedIncome(null);
    setPaymentAmount('');
    setPaymentModalVisible(false);
    setSelectedSearchItem(null);
    setSearchQuery('');
  };
  // ------------------- Update Income -------------------
  const updateIncome = async () => {
    if (!editItem) {
      return;
    }

    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0)
      return Alert.alert('Error', 'Enter a valid total amount');

    setLoading(true);

    try {
      let initialPaid = 0;
      if (paidStatus === 'Half') {
        const paid = parseFloat(paidAmount);
        if (isNaN(paid) || paid < 0 || paid > total)
          return Alert.alert('Error', 'Invalid paid amount');
        initialPaid = paid;
      } else if (paidStatus === 'Full') {
        initialPaid = total;
      }

      const updatedIncome = {
        ...editItem,
        note,
        total,
        initialPaid,
        timestamp: Date.now(),
      };

      // ✅ Must use the correct Firebase key for existing entry
      const payload = {
        millKey,
        entityType: 'OtherIncome',
        entityKey: itemKey,
        entryType: 'Income',
        dataKey: editItem.key, // 🔑 Firebase push key
        data: updatedIncome,
      };

      await dispatch(updateEntityData(payload)).unwrap();

      Alert.alert('Success', 'Income updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update income');
    } finally {
      setEditMode(false);
      setEditItem(null);
      setInputModalVisible(false);
      setNote('');
      setTotalAmount('');
      setPaidAmount('');
      setSelectedSearchItem(null);
      setSearchQuery('');
      setLoading(false);
    }
  };



  const handleEdit = (item) => {
    setEditMode(true);
    setEditItem(item);

    if (activeSubTab === 'Income') {
      setNote(item.note || '');
      setTotalAmount(String(item.total || ''));
      setPaidAmount(String(item.initialPaid || ''));
      if (item.initialPaid === 0) setPaidStatus('No');
      else if (item.initialPaid === item.total) setPaidStatus('Full');
      else setPaidStatus('Half');
      setInputModalVisible(true);
    } else if (activeSubTab === 'Payment') {
      setPaymentAmount(String(item.amount || ''));
      // find the linked expense (so edit modal shows the expense context if any)
      const linkedIncome = incomeData.find((e) => e.id === item.incomeId) || null;
      setSelectedIncome(linkedIncome);
      setPaymentModalVisible(true);
    }
  };


  // ------------------- Update Payment -------------------
  const updatePayment = async () => {
    if (!editItem) {
      return;
    }

    const payAmt = parseFloat(paymentAmount);
    if (isNaN(payAmt) || payAmt <= 0)
      return Alert.alert('Error', 'Enter a valid payment amount');

    setLoading(true);

    try {
      if (editItem.incomeId) {
        const linkedIncome = incomeData.find(i => i.id === editItem.incomeId);
        if (linkedIncome) {
          const currentPaidExcludingThis =
            paymentsData
              .filter(p => p.incomeId === linkedIncome.id && p.id !== editItem.id)
              .reduce((sum, p) => sum + Number(p.amount || 0), 0) +
            Number(linkedIncome.initialPaid || 0);
          const remaining =
            Number(linkedIncome.total || 0) - currentPaidExcludingThis;
          if (payAmt > remaining)
            return Alert.alert(
              'Error',
              `Payment exceeds remaining amount (₹${remaining.toFixed(2)})`
            );
        }
      }

      const updatedPayment = {
        ...editItem,
        amount: payAmt,
        timestamp: Date.now(),
      };

      // ✅ Must use Firebase key, not id
      const payload = {
        millKey,
        entityType: 'OtherIncome',
        entityKey: itemKey,
        entryType: 'Payments',
        dataKey: editItem.key, // 🔑 Firebase push key
        data: updatedPayment,
      };

      await dispatch(updateEntityData(payload)).unwrap();
      Alert.alert('Success', 'Payment updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment');
    } finally {
      setEditMode(false);
      setEditItem(null);
      setPaymentModalVisible(false);
      setPaymentAmount('');
      setSelectedIncome(null);
      setSelectedSearchItem(null);
      setSearchQuery('');
      setLoading(false);
    }
  };




  // ------------------- Render Items -------------------
  const renderIncomeItem = ({ item }) => {
    return (
      <ListCardItem
        item={item}
        activeTab={activeSubTab}
        onPress={() => {
          setSelectedIncome(item);
          setPaymentAmount('');
          setPaymentModalVisible(true);
        }}
        onLongPress={() => handleEdit(item)}
        type="OtherIncome"
      />
    );
  };

  const renderPaymentItem = ({ item }) => (
    <ListCardItem
      item={item}
      activeTab={'Payments'}
      onLongPress={() => handleEdit(item)}
      type="OtherExpenses"
    />
  );
  // ------------------- UI Rendering -------------------
  return (
    <KeyboardAvoidingView
      style={GLOBAL_STYLES.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>{otherIcomeData.name}</Text>
        {/* Floating Add Button */}
        <TouchableOpacity
          onPress={() => {
            setSelectedIncome(null);
            setPaidStatus('No');
            setPaidAmount('');
            setTotalAmount('');
            setNote('');
            setInputModalVisible(true);
            // clear search selection when adding new
            setSelectedSearchItem(null);
            setSearchQuery('');
          }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Date filter */}
      <DateFilter
        dataSets={[
          { name: 'income', data: incomeData, dateKey: 'timestamp' },
          { name: 'payments', data: paymentsData, dateKey: 'timestamp' },
        ]}
        onSelect={(filter, results, range) => setActiveFilter(range)}
      />

      {/* Tabs */}
      <TabSwitch
        tabs={['Analytics', 'Income', 'Payment']}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
      />

      {/* Search area */}
      <View style={{ marginHorizontal: 12, marginTop: 8, zIndex: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[GLOBAL_STYLES.input, { flex: 1 }]}
            placeholder="Search by note..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSelectedSearchItem(null);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              setShowSuggestions(true);
            }}
          />
          {/* clear button */}
          {(searchQuery.trim() || selectedSearchItem) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedSearchItem(null);
                setShowSuggestions(false);
              }}
              style={{ marginLeft: 8, padding: 8 }}
            >
              <Ionicons name="close-circle" size={20} color="#777" />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestion dropdown */}
        {showSuggestions && !selectedSearchItem && suggestionList.length > 0 && (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              elevation: 4,
              marginTop: 6,
              maxHeight: 220,
            }}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              {suggestionList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setSelectedSearchItem(item);
                    setSearchQuery(item.note || '');
                    setShowSuggestions(false);

                  }}
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderColor: '#eee',
                  }}
                >
                  <Text style={{ fontWeight: '600' }}>{item.note || 'Untitled Income'}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    ₹{Number(item.total || 0).toFixed(2)} • {new Date(item.timestamp).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Filter Dropdown */}
      {activeSubTab === 'Income' && (
        <View style={{ marginHorizontal: 10, marginBottom: 10 }}>
          <CustomPicker
            options={[
              { label: 'All', value: 'All' },
              { label: 'Remaining', value: 'Remaining' },
              { label: 'Lower First', value: 'Lower First' },
              { label: 'Higher First', value: 'Higher First' },
              { label: 'Remaining Lower First', value: 'Remaining Lower First' },
              { label: 'Remaining Higher First', value: 'Remaining Higher First' },
            ]}
            selectedValue={sortFilter}
            onValueChange={setSortFilter}
            placeholder="Select Filter"
          />
        </View>
      )}

      {/* Analytics (minimal KPI cards) */}
      {activeSubTab === 'Analytics' && (
        <ScrollView >

          {/* KPI Row */}
          <KpiAnimatedCard
            title="Earnings Overview"
            kpis={[
              { label: 'Total', value: Number(displayTotals.total).toFixed(2) || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
              { label: Number(displayTotals.remaining).toFixed(2) > 0 ? 'To Pay' : 'Advance', value: Math.abs(Number(displayTotals.remaining).toFixed(2) || 0), icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
            ]}
            progressData={{
              label: 'Total Paid',
              value: displayTotals.paid || 0,
              total: Number(displayTotals.total).toFixed(2) || 0,
              icon: 'check-decagram',
              gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
            }}
          />
          <DonutKpi
            data={[
              { label: 'Paid', value: displayTotals.paid || 0, color: COLORS.kpitotalpaid },
              { label: displayTotals.remaining > 0 ? 'To Pay' : 'Advance', value: displayTotals.remaining || 0, color: displayTotals.remaining > 0 ? COLORS.kpitopay : COLORS.kpiadvance },
            ]}
            showTotal={true}
            isMoney={true}
            label=""
            labelPosition="left"
          />
          {/* Pie Chart 2: Paid vs Remaining */}
          {groupedIncome.length > 0 ? (
            <PieChart
              data={groupedIncome}
              width={screenWidth - 24}
              height={220}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              chartConfig={{
                color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              }}
            />
          ) : (
            <Text style={{ textAlign: 'center', marginVertical: 20 }}>No data to display</Text>
          )}

        </ScrollView>
      )}


      {/* Income list */}
      {activeSubTab === 'Income' && (
        <FlatList
          data={Array.isArray(finalEntries) ? finalEntries : filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderIncomeItem}
          contentContainerStyle={{ paddingBottom: 140 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No income yet.</Text>}
        />
      )}

      {/* Payments list */}
      {activeSubTab === 'Payment' && (
        <FlatList
          data={Array.isArray(finalEntries) ? finalEntries : filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentItem}
          contentContainerStyle={{ paddingBottom: 140 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No payments yet.</Text>}
        />
      )}



      {/* Add Income Modal */}
      <Modal transparent visible={inputModalVisible} animationType="slide">
        <TouchableWithoutFeedback onPress={() => setInputModalVisible(false)}>
          <View style={GLOBAL_STYLES.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[GLOBAL_STYLES.modalBox, { padding: 20 }]}>
                <Text style={GLOBAL_STYLES.modalTitle}>Add Income</Text>




                <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Note</Text>
                  </View>
                  <TextInput
                    style={[GLOBAL_STYLES.input]}
                    placeholder="Note (optional)"
                    value={note}
                    onChangeText={setNote}
                  />
                  <MaterialIcons
                    name="square"
                    size={20}
                    color={COLORS.primary}
                    style={{ marginLeft: 8 }}
                  />
                </View>
                <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Amount</Text>
                  </View>
                  <TextInput
                    style={[GLOBAL_STYLES.input]}
                    placeholder="Total Amount"
                    value={totalAmount}
                    keyboardType="numeric"
                    onChangeText={setTotalAmount}
                  />
                  <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                </View>

                <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Paid Status</Text>
                <TabSwitch tabs={['No','Full', 'Half']} activeTab={paidStatus} onChange={setPaidStatus} />

                {paidStatus === 'Half' && (
                  
                  
                   <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Partial Amount</Text>
                  </View>
                 <TextInput
                    style={[GLOBAL_STYLES.input]}
                    placeholder="Amount"
                    value={paidAmount}
                    keyboardType="numeric"
                    onChangeText={setPaidAmount}
                  />
                  <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                </View>
                )}

                <View style={GLOBAL_STYLES.row}>
                  <TouchableOpacity style={[GLOBAL_STYLES.cancelbutton, { width: '40%' }]} onPress={() => setInputModalVisible(false)}>
                    <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[GLOBAL_STYLES.button, { width: '40%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                    disabled={loading}
                    onPress={editMode ? updateIncome : addIncome}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={GLOBAL_STYLES.buttonText}>{editMode ? 'Update' : 'Save'}</Text>
                    )}
                  </TouchableOpacity>

                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Add Payment Modal */}
      <Modal transparent visible={paymentModalVisible} animationType="slide">
        <TouchableWithoutFeedback onPress={() => { setPaymentModalVisible(false); setSelectedIncome(null); }}>
          <View style={GLOBAL_STYLES.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[GLOBAL_STYLES.modalBox, { padding: 20 }]}>
                <Text style={GLOBAL_STYLES.modalTitle}>
                  Add Payment {selectedIncome ? `for "${selectedIncome.note || selectedIncome.id}"` : ''}
                </Text>

                <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Amount</Text>
                  </View>
                  <TextInput
                    style={[GLOBAL_STYLES.input]}
                    placeholder="Payment Amount"
                    value={paymentAmount}
                    keyboardType="numeric"
                    onChangeText={setPaymentAmount}
                  />
                  <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                </View>

                <View style={GLOBAL_STYLES.row}>
                  <TouchableOpacity
                    style={[GLOBAL_STYLES.cancelbutton, { width: '40%' }]}
                    onPress={() => {
                      setPaymentModalVisible(false);
                      setSelectedIncome(null);
                    }}
                  >
                    <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[GLOBAL_STYLES.button, { width: '40%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                    disabled={loading}
                    onPress={editMode ? updatePayment : addPayment}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={GLOBAL_STYLES.buttonText}>{editMode ? 'Update' : 'Save'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}
