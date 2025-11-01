// src/screens/WorkerAnalytics.js
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { subscribeEntity, stopSubscribeEntity, addEntityData } from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import ListCardItem from '../../components/ListCardItem';


export default function WorkerAnalytics() {
  const dispatch = useDispatch();
  const millKey = useSelector((state) => state.mill.millKey);
  const millData = useSelector((state) => state.mill.millData);
  const screenWidth = Dimensions.get('window').width;

  const [activeTab, setActiveTab] = useState('Analysis');
  const [activeFilter, setActiveFilter] = useState({ type: 'month', from: null, to: null });
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [extraField, setExtraField] = useState('');
  const [modalPaymentVisible, setPaymentModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [createdDate, setCreateDate] = useState(new Date());

  /* ---------------- Subscribe to all workers ---------------- */
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'Workers'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'Workers'));
    };
  }, [millKey]);

  /* ---------------- Aggregate payments, tips, and attendance ---------------- */
  const allWorkers = millData?.Workers ? Object.values(millData.Workers) : [];

  const payments = useMemo(() => {
    return allWorkers
      .flatMap((worker) =>
        worker.Data
          ? Object.values(worker.Data).map((p) => ({
            ...p,
            userName: worker.name || 'N/A',
          }))
          : []
      )
      .sort((a, b) => (b.createdDate || 0) - (a.createdDate || 0));
  }, [allWorkers]);

  const tips = useMemo(() => {
    return allWorkers
      .flatMap((worker) =>
        worker.Tips
          ? Object.values(worker.Tips).map((t) => ({
            ...t,
            userName: worker.name || 'N/A',
          }))
          : []
      )
      .sort((a, b) => (b.createdDate || 0) - (a.createdDate || 0));
  }, [allWorkers]);

  const attendance = useMemo(() => {
    return allWorkers.flatMap((worker) =>
      worker.attendance
        ? Object.values(worker.attendance).map((a) => ({
          ...a,
          userName: worker.name || 'N/A',
          tip: parseInt(a.tip) || 0,
        }))
        : []
    );
  }, [allWorkers]);

  /* ---------------- Date filtering ---------------- */
  const filteredResults = useMemo(() => {
    const { from, to } = activeFilter;
    const filterByDate = (list, key = 'timestamp') =>
      from && to
        ? list.filter((item) => {
          const d = new Date(item[key]);
          return d >= from && d <= to;
        })
        : list;

    return {
      payments: filterByDate(payments, 'createdDate'),
      tips: filterByDate(tips, 'createdDate'),
      attendance: filterByDate(attendance, 'timestamp'),
    };
  }, [payments, tips, attendance, activeFilter]);

  const filteredPayments = filteredResults.payments;
  const filteredTips = filteredResults.tips;
  const filteredAttendance = filteredResults.attendance;
  /* ---------------- Totals ---------------- */
  const totalPaid = filteredPayments.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
  const totalTips = filteredTips.reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
  const totalEarned = filteredAttendance.reduce(
    (sum, a) => sum + (parseInt(a.earning) || 0) + (parseInt(a.tip) || 0),
    0
  );

  /* ---------------- Add / Update Payment ---------------- */
  const addPayment = async () => {
    if (!note || !amount) return alert('Enter all required fields');

    const data =
      editItem !== null
        ? { ...editItem, note, amount, extraField, createdDate, timestamp: Date.now() }
        : { note, amount, extraField, createdDate: Date.now(), timestamp: Date.now() };

    dispatch(
      addEntityData({
        millKey,
        entityType: 'Workers',
        entityKey: 'all', // for all workers
        entryType: 'Data',
        data,
        dataKey: editItem?.key || undefined,
      })
    );

    setNote('');
    setAmount('');
    setExtraField('');
    setEditItem(null);
    setPaymentModalVisible(false);
  };

  const handlePointClick = (index) => {
    const point = filteredPayments[index];
    if (point) setSelectedPoint(point) && setModalVisible(true);
  };

  /* ---------------- Pie Chart Data ---------------- */
  const pieData = [
    { name: 'Paid', amount: totalPaid, color: COLORS.kpitotalpaid, legendFontColor: '#7F7F7F', legendFontSize: 13 },
    { name: 'Earned', amount: totalEarned, color: COLORS.kpitotal, legendFontColor: '#7F7F7F', legendFontSize: 13 },
    { name: 'Extra', amount: totalTips, color: COLORS.kpiextra, legendFontColor: '#7F7F7F', legendFontSize: 13 },
    { name: totalEarned + totalTips - totalPaid > 0 ? 'To Pay' : 'Advance', amount: Math.abs(totalEarned + totalTips - totalPaid), color: COLORS.kpitopay, legendFontColor: '#7F7F7F', legendFontSize: 13 },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={GLOBAL_STYLES.container}>
        {/* DATE FILTER */}
        <DateFilter
          dataSets={[
            { name: 'attendance', data: attendance, dateKey: 'timestamp' },
            { name: 'payments', data: payments, dateKey: 'createdDate' },
            { name: 'tips', data: tips, dateKey: 'createdDate' },
          ]}
          onSelect={(filterType, results, range) => setActiveFilter(range)}
        />

        {/* TABS */}
        <TabSwitch tabs={['Analysis', 'Payments', 'Tips']} activeTab={activeTab} onChange={setActiveTab} />

        {/* CONTENT */}
        {activeTab === 'Payments' ? (
          <FlatList
            data={filteredPayments}
            keyExtractor={(item, i) => item.key || i.toString()}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No payments found</Text>}
            renderItem={({ item }) => (
              <ListCardItem
                item={item}
                activeTab={activeTab}
                type="Workers"
              />
            )}
          />
        ) : activeTab === 'Tips' ? (
          <FlatList
            data={filteredTips}
            keyExtractor={(item, i) => item.key || i.toString()}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No tips found</Text>}
            renderItem={({ item }) => (
              <ListCardItem
                item={item}
                activeTab={activeTab}

                type="Workers"
              />
            )}
          />
        ) : (
          <ScrollView>
            {/* KPI BOXES */}

            <KpiAnimatedCard
              title="Earnings Overview"
              kpis={[
                { label: 'Base', value: totalEarned || 0, icon: 'cash', gradient: [COLORS.kpibase, COLORS.kpibaseg] },
                { label: 'Extra', value: totalTips || 0, icon: 'plus-circle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] },
                { label: 'Total', value: totalEarned + totalTips || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
                { label: totalEarned + totalTips - totalPaid > 0 ? 'To Pay' : 'Advance', value: Math.abs(totalEarned + totalTips - totalPaid) || 0, icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
              ]}
              progressData={{
                label: 'Total Paid',
                value: totalPaid || 0,
                total: totalEarned + totalTips || 0,
                icon: 'check-decagram',
                gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
              }}
            />

            {/* PIE CHART */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <PieChart
                data={pieData.map((d) => ({
                  name: d.name,
                  population: d.amount,
                  color: d.color,
                  legendFontColor: d.legendFontColor,
                  legendFontSize: d.legendFontSize,
                }))}
                width={screenWidth - 80}
                height={200}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="5"
                absolute
                chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
