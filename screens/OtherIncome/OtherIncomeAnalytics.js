// screens/OtherIncome.js
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

const screenWidth = Dimensions.get('window').width;

export default function OtherIcomeAnalytics() {
  const dispatch = useDispatch();
  const millKey = useSelector((state) => state.mill.millKey);

  const [activeTab, setActiveTab] = useState('Analytics');
  const [activeFilter, setActiveFilter] = useState({ from: null, to: null });
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Subscribe to OtherIncome in real-time
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'OtherIncome'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'OtherIncome'));
    };
  }, [millKey]);

  const allIncomeData = useSelector((state) =>
    selectMillItemData(state, millKey, 'OtherIncome')
  );

  // Flatten income and payments
  const incomeData = Object.values(allIncomeData || {}).flatMap(item =>
    item.Income ? Object.entries(item.Income).map(([id, e]) => ({ id, category: item.name, ...e })) : []
  );

  const paymentsData = Object.values(allIncomeData || {}).flatMap(item =>
    item.Payments ? Object.entries(item.Payments).map(([id, p]) => ({ id, category: item.name, ...p })) : []
  );

  const computeIncomePaid = (income) => {
    const linkedPaymentsSum = paymentsData
      .filter((p) => p.incomeId === income.id)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return Number(income.initialPaid || 0) + linkedPaymentsSum;
  };

  const safeincome = Array.isArray(incomeData) ? incomeData : [];

  // Filtered income
  const filteredIncome = useMemo(() => {
    let data = [...safeincome];

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
      paidAmt: computeIncomePaid(e),
      remaining: Math.max(0, Number(e.total || 0) - computeIncomePaid(e)),
    }));
  }, [safeincome, activeFilter, paymentsData, selectedCategory, searchText]);
  console.warn(filteredIncome)
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
    filteredIncome.forEach(e => {
      total += Number(e.total || 0);
      paid += e.paidAmt || 0;
      remaining += e.remaining || 0;
    });
    return { total, paid, remaining };
  }, [filteredIncome]);

  // Pie chart data
  const groupedByCategory = useMemo(() => {
    const groups = {};
    filteredIncome.forEach(e => {
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
  }, [filteredIncome]);

  const paidRemainingPie = useMemo(() => {
    const paid = filteredIncome.reduce((sum, e) => sum + (e.paidAmt || 0), 0);
    const total = filteredIncome.reduce((sum, e) => sum + Number(e.total || 0), 0);
    const remaining = Math.max(0, total - paid);
    return [
      { name: 'Paid', population: paid, color: '#4CAF50', legendFontColor: COLORS.text, legendFontSize: 12 },
      { name: 'Remaining', population: remaining, color: '#F44336', legendFontColor: COLORS.text, legendFontSize: 12 },
    ];
  }, [filteredIncome]);

  // Render items
  const renderIncomeItem = ({ item }) => (
    <View style={{ backgroundColor: '#fff', padding: 12, margin: 8, borderRadius: 8, elevation: 2 }}>
      <Text style={{ fontWeight: '600' }}>{item.note || 'Income'}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Total: ₹{Number(item.total || 0).toFixed(2)}</Text>
      <Text style={{ color: '#4CAF50' }}>Paid: ₹{Number(item.paidAmt || 0).toFixed(2)}</Text>
      <Text style={{ color: '#F44336' }}>Remaining: ₹{Number(item.remaining || 0).toFixed(2)}</Text>
    </View>
  );

  const renderPaymentItem = ({ item }) => (
    <View style={{ backgroundColor: '#fff', padding: 12, margin: 8, borderRadius: 8, elevation: 2 }}>
      <Text style={{ fontWeight: '600' }}>{item.note || 'Payment'}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Amount: ₹{Number(item.amount || 0).toFixed(2)}</Text>
      {item.incomeId ? <Text style={{ fontSize: 12 }}>Against: {item.incomeId}</Text> : null}
      <Text style={{ fontSize: 12, color: '#666' }}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</Text>
    </View>
  );

  // Categories for picker
  const categories = ['All', ...new Set(Object.values(allIncomeData || {}).map(i => i.name))];

  // Search highlight totals


  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Date Filter */}
      <DateFilter
        dataSets={[
          { name: 'income', data: incomeData, dateKey: 'timestamp' },
          { name: 'payments', data: paymentsData, dateKey: 'timestamp' },
        ]}
        onSelect={(filter, results, range) => setActiveFilter(range)}
      />
      <TabSwitch
        tabs={['Analytics', 'Income', 'Payment']}
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

          {groupedByCategory.length > 0 ? (
            <PieChart
              data={groupedByCategory}
              width={screenWidth - 24}
              height={220}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
            />
          ) : (
            <Text style={{ textAlign: 'center', marginVertical: 20 }}>No data to display</Text>
          )}
        </ScrollView>
      )}

      {/* Income Tab */}
      {activeTab === 'Income' && (
        <FlatList
          data={filteredIncome}
          keyExtractor={(item) => item.id}
          renderItem={renderIncomeItem}
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
