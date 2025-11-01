// screens/OtherExpenses.js
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
  updateEntityData,
} from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';

const screenWidth = Dimensions.get('window').width;

export default function OtherExpenses({ route }) {
  const dispatch = useDispatch();
  const { itemKey } = route.params;
  const [loading, setLoading] = useState(false);

  const millKey = useSelector((state) => state.mill.millKey);

  // Subscribe to OtherExpenses
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'OtherExpenses'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'OtherExpenses'));
    };
  }, [millKey]);

  const otherExpensesData = useSelector((state) =>
    selectMillItemData(state, millKey, 'OtherExpenses', itemKey)
  );

  // edit item holder
  const [editItem, setEditItem] = useState(null);

  const expenseData = otherExpensesData?.Expense
    ? Object.values(otherExpensesData.Expense)
    : [];

  const paymentsData = otherExpensesData?.Payments
    ? Object.values(otherExpensesData.Payments)
    : [];

  const [activeSubTab, setActiveSubTab] = useState('Analytics');
  const [activeFilter, setActiveFilter] = useState({ from: null, to: null });
  const [sortFilter, setSortFilter] = useState('All');
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchItem, setSelectedSearchItem] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [note, setNote] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidStatus, setPaidStatus] = useState('No'); // No | Half | Full
  const [paidAmount, setPaidAmount] = useState('');
  const [editMode, setEditMode] = useState(false); // <-- new state for edit mode
  const [paymentAmount, setPaymentAmount] = useState('');

  // ------------------- Helpers -------------------
  const computeExpensePaid = (expense) => {
    const linkedPaymentsSum = paymentsData
      .filter((p) => p.expenseId === expense.id)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const initPaid = Number(expense.initialPaid || 0);
    return initPaid + linkedPaymentsSum;
  };

  // ------------------- Tab & Filter -------------------
  const entriesForCurrentTab = useMemo(() => {
    if (activeSubTab === 'Payment') return paymentsData;
    return expenseData;
  }, [activeSubTab, expenseData, paymentsData]);

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

    if (activeSubTab === 'Expense') {
      data = data.map((e) => {
        const paidAmt = computeExpensePaid(e);
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
  const groupedExpenses = useMemo(() => {
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

  const paidRemainingPie = useMemo(() => {
    let total = 0;
    let paid = 0;

    safeEntries.forEach((e) => {
      const t = Number(e.total || 0);
      const p = computeExpensePaid(e);
      total += t;
      paid += p;
    });

    const remaining = Math.max(0, total - paid);

    return [
      { name: 'Paid', population: paid, color: '#4CAF50', legendFontColor: COLORS.text, legendFontSize: 12 },
      { name: 'Remaining', population: remaining, color: '#F44336', legendFontColor: COLORS.text, legendFontSize: 12 },
    ];
  }, [safeEntries]);

  const displayTotals = useMemo(() => {
    let total = 0, paid = 0, remaining = 0;
    safeEntries.forEach((e) => {
      const t = Number(e.total || 0);
      const p = computeExpensePaid(e);
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
    expenseData.forEach((item) => {
      const note = (item.note || 'Untitled Expense').trim();
      if (note.toLowerCase().includes(searchQuery.toLowerCase())) {
        if (!uniqueNotesMap[note.toLowerCase()]) {
          uniqueNotesMap[note.toLowerCase()] = item;
        }
      }
    });
    return Object.values(uniqueNotesMap).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }, [searchQuery, expenseData]);

  const finalEntries = useMemo(() => {
    if (selectedSearchItem && selectedSearchItem.note) {
      const noteLower = selectedSearchItem.note.toLowerCase();
      if (activeSubTab === 'Expense') {
        return expenseData
          .filter((e) => (e.note || '').toLowerCase() === noteLower)
          .map((e) => {
            const paidAmt = computeExpensePaid(e);
            const remaining = Number(e.total || 0) - paidAmt;
            return { ...e, paidAmt, remaining };
          });
      } else if (activeSubTab === 'Payment') {
        const expenseIds = expenseData
          .filter((e) => (e.note || '').toLowerCase() === noteLower)
          .map((e) => e.id);
        return paymentsData
          .filter((p) => expenseIds.includes(p.expenseId))
          .sort((a, b) => b.timestamp - a.timestamp);
      } else {
        const filteredExpenses = expenseData.filter(
          (e) => (e.note || '').toLowerCase() === noteLower
        );
        const total = filteredExpenses.reduce((sum, e) => sum + Number(e.total || 0), 0);
        const paid = filteredExpenses.reduce((sum, e) => sum + computeExpensePaid(e), 0);
        const remaining = Math.max(0, total - paid);

        return { expense: filteredExpenses, totals: { total, paid, remaining } };
      }
    }
    return safeEntries;
  }, [selectedSearchItem, activeSubTab, expenseData, paymentsData, safeEntries]);

  // ------------------- Add Expense -------------------
  const addExpense = async () => {
    if (!totalAmount) return Alert.alert('Error', 'Enter total amount');
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) return Alert.alert('Error', 'Enter a valid total amount');

    setLoading(true); // start loader

    try {
      let initialPaid = 0;
      if (paidStatus === 'Half') {
        if (!paidAmount) return Alert.alert('Error', 'Enter paid amount for Half option');
        initialPaid = parseFloat(paidAmount);
        if (isNaN(initialPaid) || initialPaid < 0) return Alert.alert('Error', 'Enter a valid paid amount');
        if (initialPaid > total) return Alert.alert('Error', 'Paid cannot exceed total');
      } else if (paidStatus === 'Full') {
        initialPaid = total;
      }

      const expenseEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        note: note || '',
        total,
        initialPaid,
        timestamp: Date.now(),
      };

      await dispatch(
        addEntityData({
          millKey,
          entityType: 'OtherExpenses',
          entityKey: itemKey,
          entryType: 'Expense',
          data: expenseEntry,
        })
      );

      setNote('');
      setTotalAmount('');
      setPaidStatus('No');
      setPaidAmount('');
      setInputModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false); // stop loader
    }
  };


  // ------------------- Edit Handler (Expense or Payment) -------------------
  const handleEdit = (item) => {
    setEditMode(true);
    setEditItem(item);

    if (activeSubTab === 'Expense') {
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
      const linkedExpense = expenseData.find((e) => e.id === item.expenseId) || null;
      setSelectedExpense(linkedExpense);
      setPaymentModalVisible(true);
    }
  };

  // ------------------- Update Expense -------------------
  const updateExpense = async () => {
  if (!editItem) return;

  const total = parseFloat(totalAmount);
  if (isNaN(total) || total <= 0)
    return Alert.alert('Error', 'Enter valid amount');

  setLoading(true); // 🟡 start loader

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

    const updatedExpense = {
      ...editItem,
      note,
      total,
      initialPaid,
      timestamp: Date.now(),
    };


    const payload = {
      millKey,
      entityType: 'OtherExpenses',
      entityKey: itemKey,
      entryType: 'Expense',
      dataKey: editItem?.key, // ✅ correct Firebase node key
      data: updatedExpense,
    };


    await dispatch(addEntityData(payload)).unwrap(); // ✅ use addEntityData for update as well

  } catch (error) {
    Alert.alert('Error', 'Something went wrong while updating expense');
  } finally {
    // 🧹 Reset UI cleanly
    setEditMode(false);
    setEditItem(null);
    setInputModalVisible(false);
    setNote('');
    setTotalAmount('');
    setPaidAmount('');
    setSelectedSearchItem(null);
    setSearchQuery('');
    setLoading(false); // 🔵 stop loader
  }
};



  // ------------------- Add Payment -------------------
// ------------------- Add Payment -------------------
const addPayment = async () => {
  const payAmt = parseFloat(paymentAmount);
  if (isNaN(payAmt) || payAmt <= 0)
    return Alert.alert('Error', 'Enter a valid payment amount');

  if (selectedExpense) {
    const currentPaid = computeExpensePaid(selectedExpense);
    const remaining = Number(selectedExpense.total || 0) - currentPaid;
    if (payAmt > remaining)
      return Alert.alert(
        'Error',
        `Payment exceeds remaining amount (₹${remaining.toFixed(2)})`
      );
  }

  setLoading(true); // 🟡 start loader
  try {
    const paymentEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      note: selectedExpense
        ? `Payment against ${selectedExpense.note || selectedExpense.id}`
        : '',
      amount: payAmt,
      expenseId: selectedExpense ? selectedExpense.id : undefined,
      timestamp: Date.now(),
    };

    await dispatch(
      addEntityData({
        millKey,
        entityType: 'OtherExpenses',
        entityKey: itemKey,
        entryType: 'Payments',
        data: paymentEntry,
      })
    ).unwrap();

  } catch (err) {
    Alert.alert('Error', 'Failed to add payment');
  } finally {
    // 🧹 Reset UI
    setSelectedExpense(null);
    setPaymentAmount('');
    setPaymentModalVisible(false);
    setSelectedSearchItem(null);
    setSearchQuery('');
    setLoading(false);
  }
};

// ------------------- Update Payment -------------------
const updatePayment = async () => {
  if (!editItem) return;

  const payAmt = parseFloat(paymentAmount);
  if (isNaN(payAmt) || payAmt <= 0)
    return Alert.alert('Error', 'Enter a valid payment amount');

  // Validate if linked to expense
  if (editItem.expenseId) {
    const linkedExpense = expenseData.find(
      (e) => e.id === editItem.expenseId
    );
    if (linkedExpense) {
      const currentPaidExcludingThis =
        paymentsData
          .filter(
            (p) => p.expenseId === linkedExpense.id && p.id !== editItem.id
          )
          .reduce((s, p) => s + Number(p.amount || 0), 0) +
        Number(linkedExpense.initialPaid || 0);
      const remaining =
        Number(linkedExpense.total || 0) - currentPaidExcludingThis;
      if (payAmt > remaining)
        return Alert.alert(
          'Error',
          `Payment exceeds remaining amount (₹${remaining.toFixed(2)})`
        );
    }
  }

  setLoading(true); // 🟡 start loader
  try {
    const updatedPayment = {
      ...editItem,
      amount: payAmt,
      timestamp: Date.now(),
    };

    const payload = {
      millKey,
      entityType: 'OtherExpenses',
      entityKey: itemKey,
      entryType: 'Payments',
      dataKey: editItem?.key, // ✅ Correct Firebase key
      data: updatedPayment,
    };


    await dispatch(addEntityData(payload)).unwrap(); // ✅ update via addEntityData
  } catch (err) {
    Alert.alert('Error', 'Failed to update payment');
  } finally {
    // 🧹 Reset UI
    setEditMode(false);
    setEditItem(null);
    setPaymentModalVisible(false);
    setPaymentAmount('');
    setSelectedExpense(null);
    setSelectedSearchItem(null);
    setSearchQuery('');
    setLoading(false);
  }
};


  // ------------------- Render Items -------------------
  const renderExpenseItem = ({ item }) => {
    return (
      <ListCardItem
        item={item}
        activeTab={activeSubTab}
        onPress={() => {
          // open add payment modal for this expense
          setSelectedExpense(item);
          setPaymentAmount('');
          setEditMode(false);
          setEditItem(null);
          setPaymentModalVisible(true);
        }}
        onLongPress={() => handleEdit(item)}
        type="OtherExpenses"
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
        <Text style={GLOBAL_STYLES.headerText}>{otherExpensesData?.name}</Text>
        <TouchableOpacity
          onPress={() => {
            // open add-expense modal (clear edit state)
            setSelectedExpense(null);
            setPaidStatus('No');
            setPaidAmount('');
            setTotalAmount('');
            setNote('');
            setEditMode(false);
            setEditItem(null);
            setInputModalVisible(true);
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
          { name: 'expenses', data: expenseData, dateKey: 'timestamp' },
          { name: 'payments', data: paymentsData, dateKey: 'timestamp' },
        ]}
        onSelect={(filter, results, range) => setActiveFilter(range)}
      />

      {/* Tabs */}
      <TabSwitch
        tabs={['Analytics', 'Expense', 'Payment']}
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
                  <Text style={{ fontWeight: '600' }}>{item.note || 'Untitled Expense'}</Text>
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
      {activeSubTab === 'Expense' && (
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
        <ScrollView>
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
          {groupedExpenses.length > 0 ? (
            <PieChart
              data={groupedExpenses}
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

      {/* Expense list */}
      {activeSubTab === 'Expense' && (
        <FlatList
          data={Array.isArray(finalEntries) ? finalEntries : filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          contentContainerStyle={{ paddingBottom: 140 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No expenses yet.</Text>}
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

      {/* Add / Edit Expense Modal */}
      <Modal transparent visible={inputModalVisible} animationType="slide">
        <TouchableWithoutFeedback onPress={() => { setInputModalVisible(false); setEditMode(false); setEditItem(null); }}>
          <View style={GLOBAL_STYLES.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[GLOBAL_STYLES.modalBox, { padding: 20 }]}>
                <Text style={GLOBAL_STYLES.modalTitle}>{editMode ? 'Edit Expense' : 'Add Expense'}</Text>

                <TextInput
                  style={[GLOBAL_STYLES.input, { marginVertical: 8 }]}
                  placeholder="Note (optional)"
                  value={note}
                  onChangeText={setNote}
                />

                <TextInput
                  style={[GLOBAL_STYLES.input, { marginVertical: 8 }]}
                  placeholder="Total Amount"
                  value={totalAmount}
                  keyboardType="numeric"
                  onChangeText={setTotalAmount}
                />

                <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Paid Status</Text>
                <TabSwitch tabs={['No', 'Full', 'Half']} activeTab={paidStatus} onChange={setPaidStatus} />

                {paidStatus === 'Half' && (
                  <TextInput
                    style={[GLOBAL_STYLES.input, { marginVertical: 8 }]}
                    placeholder="Paid Amount (partial)"
                    value={paidAmount}
                    keyboardType="numeric"
                    onChangeText={setPaidAmount}
                  />
                )}

                <View style={GLOBAL_STYLES.row}>
                  <TouchableOpacity
                    style={[GLOBAL_STYLES.cancelbutton, { width: '40%' }]}
                    onPress={() => {
                      setInputModalVisible(false);
                      setEditMode(false);
                      setEditItem(null);
                      setNote('');
                      setTotalAmount('');
                      setPaidAmount('');
                      setPaidStatus('No');
                    }}
                  >
                    <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[GLOBAL_STYLES.button, { width: '40%' }]}
                    onPress={editMode ? updateExpense : addExpense}
                    disabled={loading} // disable during load
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
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

      {/* Add / Edit Payment Modal */}
      <Modal transparent visible={paymentModalVisible} animationType="slide">
        <TouchableWithoutFeedback onPress={() => { setPaymentModalVisible(false); setSelectedExpense(null); setEditMode(false); setEditItem(null); }}>
          <View style={GLOBAL_STYLES.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[GLOBAL_STYLES.modalBox, { padding: 20 }]}>
                <Text style={GLOBAL_STYLES.modalTitle}>
                  {editMode ? 'Edit Payment' : `Add Payment ${selectedExpense ? `for "${selectedExpense.note || selectedExpense.id}"` : ''}`}
                </Text>

                <TextInput
                  style={[GLOBAL_STYLES.input, { marginVertical: 8 }]}
                  placeholder="Payment Amount"
                  value={paymentAmount}
                  keyboardType="numeric"
                  onChangeText={setPaymentAmount}
                />

                <View style={GLOBAL_STYLES.row}>
                  <TouchableOpacity
                    style={[GLOBAL_STYLES.cancelbutton, { width: '40%' }]}
                    onPress={() => {
                      setPaymentModalVisible(false);
                      setSelectedExpense(null);
                      setEditMode(false);
                      setEditItem(null);
                      setPaymentAmount('');
                    }}
                  >
                    <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[GLOBAL_STYLES.button, { width: '40%' }]}
                    onPress={editMode ? updatePayment : addPayment}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
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
