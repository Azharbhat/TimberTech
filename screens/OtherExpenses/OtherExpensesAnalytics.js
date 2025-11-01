// screens/OtherExpenses.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { PieChart } from 'react-native-chart-kit';
import { selectMillItemData, subscribeEntity, stopSubscribeEntity } from '../../src/redux/slices/millSlice';
import CustomPicker from '../../components/CustomPicker';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';
import ListCardItem from '../../components/ListCardItem';

const screenWidth = Dimensions.get('window').width;

export default function OtherExpensesAnalytics() {
  const dispatch = useDispatch();
  const millKey = useSelector((state) => state.mill.millKey);

  const [activeTab, setActiveTab] = useState('Analytics');
  const [activeFilter, setActiveFilter] = useState({ from: null, to: null });
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Subscribe to OtherExpenses in real-time
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'OtherExpenses'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'OtherExpenses'));
    };
  }, [millKey]);

  const allExpensesData = useSelector((state) =>
    selectMillItemData(state, millKey, 'OtherExpenses')
  );

  // Flatten expenses and payments
  const expenseData = Object.values(allExpensesData || {}).flatMap(item =>
    item.Expense ? Object.entries(item.Expense).map(([id, e]) => ({ id, category: item.name, ...e })) : []
  );

  const paymentsData = Object.values(allExpensesData || {}).flatMap(item =>
    item.Payments ? Object.entries(item.Payments).map(([id, p]) => ({ id, category: item.name, ...p })) : []
  );

  const computeExpensePaid = (expense) => {
    const linkedPaymentsSum = paymentsData
      .filter((p) => p.expenseId === expense.id)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return Number(expense.initialPaid || 0) + linkedPaymentsSum;
  };

  const safeExpenses = Array.isArray(expenseData) ? expenseData : [];

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let data = [...safeExpenses];

    if (activeFilter.from && activeFilter.to) {
      data = data.filter(e => {
        const d = new Date(e.timestamp);
        return d >= activeFilter.from && d <= activeFilter.to;
      });
    }

    if (selectedCategory !== 'All') {
      data = data.filter(e => e.category === selectedCategory);
    }

    if (searchText.trim()) {
      const txt = searchText.toLowerCase();
      data = data.filter(e =>
        (e.note || '').toLowerCase().includes(txt) ||
        (e.category || '').toLowerCase().includes(txt)
      );
    }

    return data.map(e => ({
      ...e,
      paidAmt: computeExpensePaid(e),
      remaining: Math.max(0, Number(e.total || 0) - computeExpensePaid(e)),
    }));
  }, [safeExpenses, activeFilter, paymentsData, selectedCategory, searchText]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    let data = [...paymentsData];

    if (activeFilter.from && activeFilter.to) {
      data = data.filter(p => {
        const d = new Date(p.timestamp);
        return d >= activeFilter.from && d <= activeFilter.to;
      });
    }

    if (selectedCategory !== 'All') {
      data = data.filter(p => p.category === selectedCategory);
    }

    if (searchText.trim()) {
      const txt = searchText.toLowerCase();
      data = data.filter(p =>
        (p.note || '').toLowerCase().includes(txt) ||
        (p.category || '').toLowerCase().includes(txt)
      );
    }

    return data;
  }, [paymentsData, activeFilter, selectedCategory, searchText]);

  // Totals
  const displayTotals = useMemo(() => {
    let total = 0, paid = 0, remaining = 0;
    filteredExpenses.forEach(e => {
      total += Number(e.total || 0);
      paid += e.paidAmt || 0;
      remaining += e.remaining || 0;
    });
    return { total, paid, remaining };
  }, [filteredExpenses]);

  // Pie chart data
  const groupedByCategory = useMemo(() => {
    const groups = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Others';
      const amount = Number(e.total || 0);
      groups[cat] = (groups[cat] || 0) + amount;
    });

    const colors = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336', '#00BCD4', '#8BC34A', '#FFC107', '#795548', '#607D8B'];
    return Object.entries(groups).map(([name, total], idx) => ({
      name,
      population: total,
      color: colors[idx % colors.length],
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    }));
  }, [filteredExpenses]);


  // Render items
  const renderExpenseItem = ({ item }) => (
    <ListCardItem
      item={item}
      activeTab={activeTab}
      type="OtherExpenses"
    />
  );

  const renderPaymentItem = ({ item }) => (
    <ListCardItem
      item={item}
      activeTab={'Payments'}
      type="OtherExpenses"
    />
  );
  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Date Filter */}
      <DateFilter
        dataSets={[
          { name: 'expenses', data: expenseData, dateKey: 'timestamp' },
          { name: 'payments', data: paymentsData, dateKey: 'timestamp' },
        ]}
        onSelect={(filter, results, range) => setActiveFilter(range)}
      />
      <TabSwitch
        tabs={['Analytics', 'Expense', 'Payment']}
        activeTab={activeTab}
        onChange={setActiveTab}
      />




      {/* Search Bar with clear icon */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginVertical: 8, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, elevation: 2 }}>
        <TextInput
          placeholder="Search by note or category..."
          value={searchText}
          onChangeText={setSearchText}
          style={{ flex: 1, height: 40 }}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={{ color: "black", fontSize: 16 }}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Highlighted search totals */}
      {searchText.length > 0 && (
        <View
          style={{
            backgroundColor: '#FFF3E0',
            marginHorizontal: 12,
            marginVertical: 8,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#FFB74D',
          }}
        >
          <Text style={{ fontWeight: '600', marginBottom: 4 }}>
            {searchText}
          </Text>
        </View>
      )}


      {/* Category Picker */}
      {/* Tabs */}

      {/* Analytics */}
      {activeTab === 'Analytics' && (
        <ScrollView >
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
        </ScrollView>
      )}

      {/* Expense Tab */}
      {activeTab === 'Expense' && (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 80 }}
        />
      )}

      {/* Payment Tab */}
      {activeTab === 'Payment' && (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentItem}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 80 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
