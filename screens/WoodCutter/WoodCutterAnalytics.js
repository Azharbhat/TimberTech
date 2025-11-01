// screens/WoodCutter/WoodCutterAnalytics.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { Ionicons } from '@expo/vector-icons';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import ListCardItem from '../../components/ListCardItem'; // <-- using new list
const screenWidth = Dimensions.get('window').width;

export default function WoodCutterAnalytics() {
  const millKey = useSelector(state => state.mill.millKey);

  const [allWoodcutters, setAllWoodcutters] = useState([]);
  const [activeTab, setActiveTab] = useState('Analytics'); // Analytics / Work / Payments
  const [activeFilter, setActiveFilter] = useState({ type: 'month', from: null, to: null });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const colors = { work: '#cd4009ff', payments: '#2196F3', side: '#FF9800' };

  // ----------------- Fetch All Woodcutters -----------------
  useEffect(() => {
    if (!millKey) return;
    const fetchData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${millKey}/WoodCutter`));
        if (snapshot.exists()) {
          const results = [];
          snapshot.forEach(childSnapshot => {
            results.push({
              workerKey: childSnapshot.key,
              ...childSnapshot.val(),
            });
          });
          setAllWoodcutters(results);
        } else {
          setAllWoodcutters([]);
        }
      } catch (error) {
        console.error('Error fetching woodcutters:', error);
      }
    };
    fetchData();
  }, [millKey]);

  // ----------------- Aggregate Data -----------------
  const savedWork = useMemo(() => allWoodcutters.flatMap(wc => (wc?.Data ? Object.values(wc.Data) : [])), [allWoodcutters]);
  const savedPayments = useMemo(() => allWoodcutters.flatMap(wc => (wc?.Payments ? Object.values(wc.Payments) : [])), [allWoodcutters]);

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

  const formatDate = ts => new Date(ts).toLocaleDateString();

  // ----------------- Render Items -----------------
  const renderWorkItem = ({ item }) => (
     <ListCardItem
          item={item}
          activeTab='Work'

          type="WoodCutter"
        />
  );

  const renderPaymentItem = ({ item }) => (
    <ListCardItem
          item={item}
          activeTab='Payments'
          type="WoodCutter"
        />
  );

  const renderKpis = () => (
    <ScrollView style={{ paddingBottom: 120 }}>
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
          { label: totals.payments.balance > 0 ? 'To Pay' : 'Advance', value: Math.abs(totals.payments.balance) || 0, color:  totals.payments.balance > 0 ? COLORS.kpitopay:COLORS.kpiadvance  },
        ]}
         showTotal={true}
        isMoney={true}
        label=""
        labelPosition="left"
      />

      <KpiAnimatedCard
        title="Work Overview"
        kpis={[{ label: 'Total Feets', value: totals.work.totalFeet || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg], isPayment: 0 }]}
      />
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        <DateFilter
          dataSets={[
            { name: 'work', data: savedWork, dateKey: 'timestamp' },
            { name: 'payments', data: savedPayments, dateKey: 'timestamp' },
          ]}
          onSelect={(filter, results, range) => setActiveFilter(range)}
        />

        <TabSwitch tabs={['Analytics', 'Work', 'Payments']} activeTab={activeTab} onChange={setActiveTab} />

        {/* Analytics View */}
        {activeTab === 'Analytics' && renderKpis()}

        {/* Work / Payments List */}
        {(activeTab === 'Work' || activeTab === 'Payments') && (
          <FlatList
            data={currentData}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={activeTab === 'Work' ? renderWorkItem : renderPaymentItem}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
