// src/screens/WorkerDetail.js
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import { GLOBAL_STYLES, COLORS, SIZE, FONTS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import ListCardItem from '../../components/ListCardItem'; // <-- using new component

export default function WorkerDetail({ route }) {
  const { itemKey, type } = route.params;
  const dispatch = useDispatch();
  const millKey = useSelector((state) => state.mill.millKey);
  const itemData = useSelector((state) =>
    selectMillItemData(state, millKey, type || 'Workers', itemKey)
  );

  const [activeTab, setActiveTab] = useState('Analysis');
  const [activeFilter, setActiveFilter] = useState({ type: 'month', from: null, to: null });
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [extraField, setExtraField] = useState('');
  const [modalPaymentVisible, setPaymentModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [currentMode, setCurrentMode] = useState('payment'); // 'payment' | 'tip'
  const [createdDate, setCreateDate] = useState(new Date());

  const screenWidth = Dimensions.get('window').width;

  /* ----------------- Subscribe in real-time ----------------- */
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, type || 'Workers'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, type || 'Workers'));
    };
  }, [millKey]);

  /* ----------------- Prepare data ----------------- */
  const payments = useMemo(() => (itemData?.Data ? Object.values(itemData.Data).reverse() : []), [itemData]);
  const tips = useMemo(() => (itemData?.Tips ? Object.values(itemData.Tips).reverse() : []), [itemData]);
  const attendance = useMemo(() => (itemData?.attendance ? Object.values(itemData.attendance) : []), [itemData]);

  /* ----------------- Filter results ----------------- */
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
      attendance: filterByDate(attendance, 'timestamp'),
      tips: filterByDate(tips, 'createdDate'),
    };
  }, [payments, tips, attendance, activeFilter]);

  const filteredPayments = filteredResults.payments;
  const filteredAttendance = filteredResults.attendance;
  const filteredTips = filteredResults.tips;

  /* ----------------- Totals ----------------- */
  const totalPaid = filteredPayments.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
  const totalTipped = filteredTips.reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);

  const totalPresents = filteredAttendance.filter(a => a.status?.toLowerCase() === 'present').length;
  const totalAbsents = filteredAttendance.filter(a => a.status?.toLowerCase() === 'absent').length;

  // Accurate total earned using attendance earning field + tips
  const totalEarned = filteredAttendance.reduce((sum, a) => sum + (parseInt(a.earning) || 0), 0) + totalTipped;
  const totalBaseEarned = filteredAttendance.reduce((sum, a) => sum + (parseInt(a.earning) || 0), 0);

  /* ----------------- Add Payment / Tip ----------------- */
  const addEntry = async () => {
    if (!note || !amount) return alert('Enter all required fields');

    const data =
      editItem !== null
        ? { ...editItem, note, amount, extraField, createdDate, timestamp: Date.now() }
        : { note, amount, extraField, createdDate: Date.now(), timestamp: Date.now() };

    dispatch(
      addEntityData({
        millKey,
        entityType: type || 'Workers',
        entityKey: itemKey,
        entryType: currentMode === 'tip' ? 'Tips' : 'Data',
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


  const getExtraFieldLabel = () => {
    switch (type) {
      case 'BoxMakers':
        return 'Box Size / Type';
      case 'BoxBuyers':
        return 'Buyer Name / Quantity';
      case 'WoodCutters':
        return 'Tree Type / Length';
      default:
        return '';
    }
  };

  /* ----------------- Chart Data ----------------- */

  /* ----------------- Pie Chart Data ----------------- */
  const pieData = [
    { name: 'Paid', amount: totalPaid, color: COLORS.kpitotalpaid, legendFontColor: '#7F7F7F', legendFontSize: 13 },
    { name: 'Earned', amount: totalEarned, color: COLORS.kpitotal, legendFontColor: '#7F7F7F', legendFontSize: 13 },
    { name: 'Extra', amount: totalTipped, color: COLORS.kpiextra, legendFontColor: '#7F7F7F', legendFontSize: 13 },
    {
      name: totalEarned - totalPaid > 0 ? 'To Pay' : 'Advance',
      amount: Math.abs(totalEarned - totalPaid),
      color: COLORS.kpitopay,
      legendFontColor: '#7F7F7F',
      legendFontSize: 13,
    },
  ];

  /* ----------------- UI ----------------- */
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={GLOBAL_STYLES.container}>
        {/* HEADER */}
        <View style={GLOBAL_STYLES.headerContainer}>
          <Text style={GLOBAL_STYLES.headerText}>{itemData?.name || 'Worker Detail'}</Text>
          <TouchableOpacity
            style={GLOBAL_STYLES.headerbutton}
            onPress={() => {
              setCurrentMode(activeTab === 'Tips' ? 'tip' : 'payment');
              setPaymentModalVisible(true);
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 30, fontWeight: FONTS.montserratBold }}>+</Text>
          </TouchableOpacity>
        </View>

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
                onLongPress={() => {
                  setNote(item.note);
                  setAmount(item.amount.toString());
                  setExtraField(item.extraField || '');
                  setEditItem(item);
                  setCurrentMode('payment');
                  setPaymentModalVisible(true);
                }}
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
                onLongPress={() => {
                  setNote(item.note);
                  setAmount(item.amount.toString());
                  setExtraField(item.extraField || '');
                  setEditItem(item);
                  setCurrentMode('tip');
                  setPaymentModalVisible(true);
                }}
                type="Workers"
              />

            )}
          />
        ) : (
          <ScrollView>
            {/* KPIs */}
            <KpiAnimatedCard
              title="Earnings Overview"
              kpis={[
                { label: 'Base', value: totalBaseEarned || 0, icon: 'cash', gradient: [COLORS.kpibase, COLORS.kpibaseg] },
                { label: 'Extra', value: totalTipped || 0, icon: 'plus-circle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] },
                { label: 'Total', value: totalBaseEarned + totalTipped || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
                { label: totalBaseEarned + totalTipped - totalPaid > 0 ? 'To Pay' : 'Advance', value: Math.abs(totalBaseEarned + totalTipped - totalPaid) || 0, icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
              ]}
              progressData={{
                label: 'Total Paid',
                value: totalPaid || 0,
                total: totalBaseEarned + totalTipped || 0,
                icon: 'check-decagram',
                gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
              }}
            />
            <KpiAnimatedCard
              title="Attendance Overview"

              kpis={[
                { label: 'Present', value: totalPresents, icon: 'check-circle', gradient: [COLORS.kpiyes, COLORS.kpiyesg], isPayment: 0 },
                { label: 'Absents', value: totalAbsents, icon: 'cancel', gradient: [COLORS.kpino, COLORS.kpinog], isPayment: 0 },
              ]}

            />

            {filteredAttendance.length > 0 && (
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
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
            )}
          </ScrollView>
        )}

        {/* ADD PAYMENT / TIP MODAL */}
        <Modal visible={modalPaymentVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: COLORS.accent, padding: 20, borderRadius: 12, width: '85%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                {editItem ? 'Update' : currentMode === 'tip' ? 'Add Tip' : 'Add Payment'}
              </Text>

              <TextInput style={GLOBAL_STYLES.input} placeholder="Note" value={note} onChangeText={setNote} />
              <TextInput
                style={GLOBAL_STYLES.input}
                placeholder="Amount"
                value={amount}
                onChangeText={(text) => /^[0-9]*$/.test(text) && setAmount(text)}
                keyboardType="numeric"
              />
              {getExtraFieldLabel() && (
                <TextInput
                  style={GLOBAL_STYLES.input}
                  placeholder={getExtraFieldLabel()}
                  value={extraField}
                  onChangeText={setExtraField}
                />
              )}
              <View style={GLOBAL_STYLES.row}>
                <Pressable style={[GLOBAL_STYLES.cancelbutton, { width: '40%', marginTop: 15 }]} onPress={() => setPaymentModalVisible(false)}>
                  <Text style={GLOBAL_STYLES.cancelbuttonText} >Cancel</Text>
                </Pressable>
                <Pressable style={[GLOBAL_STYLES.button, { width: '40%', marginTop: 15 }]} onPress={addEntry}>
                  <Text style={GLOBAL_STYLES.buttonText}>{editItem ? 'Update' : 'Add'}</Text>
                </Pressable>

              </View>
            </View>
          </View>
        </Modal>

        {/* DETAIL MODAL */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Payment Details</Text>
              {selectedPoint && (
                <>
                  <Text>Date: {new Date(selectedPoint.createdDate).toLocaleString()}</Text>
                  <Text>Note: {selectedPoint.note}</Text>
                  {selectedPoint.extraField && <Text>Info: {selectedPoint.extraField}</Text>}
                  <Text>Amount: {selectedPoint.amount} Rs</Text>
                </>
              )}
              <Pressable
                onPress={() => setModalVisible(false)}
                style={{ marginTop: 15, backgroundColor: COLORS.primary, padding: 10, borderRadius: 8 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
