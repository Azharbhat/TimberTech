import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ref, push, onValue } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';

export default function LogSavedDetail({ route }) {
  const { data = [], name = 'Unknown', MillKey } = route.params || {};
 const dispatch = useDispatch();
  const [currentTab, setCurrentTab] = useState('GrandTotal');
 const millKey = useSelector(state => state.mill.millKey);
  const [selectedItem, setSelectedItem] = useState(null); // calculation detail
  const [calcDetailModalVisible, setCalcDetailModalVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false); // add payment
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const screenWidth = Dimensions.get('window').width - 20;

  /** 🔹 FETCH PAYMENTS */
    useEffect(() => {
      if (millKey) dispatch(subscribeEntity(millKey, 'LogCalculations'));
  
      return () => {
        if (millKey) dispatch(stopSubscribeEntity(millKey, 'LogCalculations'));
      };
    }, [millKey]);
  useEffect(() => {
    if (!MillKey || !name) return;
    setLoadingPayments(true);

    const payRef = ref(database, `Mills/${MillKey}/LogCalculations/${name}/payments`);
    const unsubscribe = onValue(payRef, (snap) => {
      const val = snap.val();
      if (val) {
        const arr = Object.entries(val).map(([id, v]) => ({ id, ...v }));
        setPayments(arr);
      } else {
        setPayments([]);
      }
      setLoadingPayments(false);
    });

    return () => unsubscribe();
  }, [MillKey, name]);

  /** 🔹 ADD PAYMENT */
  const addPayment = async () => {
    if (!note || !amount) {
      Alert.alert('Validation', 'Please enter note and amount.');
      return;
    }
    if (!MillKey || !name) return;

    try {
      const payRef = ref(database, `Mills/${MillKey}/LogCalculations/${name}/payments`);
      await push(payRef, {
        note,
        amount: Number(amount),
        timestamp: Date.now(),
      });
      setNote('');
      setAmount('');
      setModalVisible(false);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save payment.');
    }
  };

  /** 🔹 FILTERED DATA */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const ts = item.timestamp || 0;
      if (startDate && ts < startDate) return false;
      if (endDate && ts > endDate) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const ts = p.timestamp || 0;
      if (startDate && ts < startDate) return false;
      if (endDate && ts > endDate) return false;
      return true;
    });
  }, [payments, startDate, endDate]);

  /** 🔹 GRAND TOTALS */
  const grandTotals = filteredData.reduce(
    (acc, item) => {
      const buyed = Number(item.buyedPrice) || 0;
      const advance = Number(item.payedPrice) || 0;
      acc.buyed += buyed;
      acc.advance += advance;
      return acc;
    },
    { buyed: 0, advance: 0 }
  );

  const totalOtherPayments = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaid = grandTotals.advance + totalOtherPayments;
  const balance = grandTotals.buyed - totalPaid;

  /** 🔹 CHART DATA */
  const paymentChartData = {
    labels: filteredPayments
      .map((p) => (p.timestamp ? new Date(p.timestamp).toLocaleDateString() : '—'))
      .slice(-6),
    datasets: [{ data: filteredPayments.map((p) => p.amount).slice(-6) }],
  };

  const areaData = filteredData.map((item) => ({
    date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '—',
    area: item.data ? item.data.reduce((sum, i) => sum + (Number(i.result) || 0), 0) : 0,
  }));

  const areaChartData = {
    labels: areaData.map((a) => a.date).slice(-6),
    datasets: [{ data: areaData.map((a) => a.area).slice(-6) }],
  };

  return (
    <View style={GLOBAL_STYLES.container}>
      {/* HEADER */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>{name}</Text>
      </View>

      {/* DATE FILTER */}
      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* TAB SWITCH */}
      <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
        <TabSwitch
          tabs={['GrandTotal', 'Calculation', 'Payments']}
          activeTab={currentTab}
          onChange={setCurrentTab}
        />
      </View>

      {/* 🔹 GRAND TOTAL */}
      {currentTab === 'GrandTotal' && (
        <ScrollView>
          <Text style={GLOBAL_STYLES.sectionTitle}>Grand Total</Text>
          <View style={[GLOBAL_STYLES.kpiRow,{flexWrap:'wrap'}]}>
            {[
              { icon: 'pricetag', label: 'Buyed', value: grandTotals.buyed },
              { icon: 'cash', label: 'Advance Paid', value: grandTotals.advance },
              { icon: 'wallet', label: 'Other Payments', value: totalOtherPayments },
              { icon: 'wallet', label: 'Total Paid', value: totalPaid },
              { icon: 'calculator', label: 'Balance', value: balance },
            ].map((it, idx) => (
              <View key={idx} style={[GLOBAL_STYLES.kpiBox,{width:'30%'}]}>
                <Ionicons name={it.icon} size={26} color={COLORS.primary} />
                <Text style={GLOBAL_STYLES.kpiLabel}>{it.label}</Text>
                <Text style={GLOBAL_STYLES.kpiValue}>₹{it.value.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <Text style={GLOBAL_STYLES.sectionTitle}>📈 Payments Over Time</Text>
          {paymentChartData.datasets[0].data.length ? (
            <LineChart
              data={paymentChartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ marginVertical: 10, borderRadius: 16 }}
              onDataPointClick={(d) => {
                const p = filteredPayments[d.index];
                setSelectedPayment(p);
                setPaymentModalVisible(true);
              }}
            />
          ) : (
            <Text style={GLOBAL_STYLES.kpiLabel}>No payment data.</Text>
          )}

          <Text style={GLOBAL_STYLES.sectionTitle}>🪵 Area Calculations</Text>
          {areaChartData.datasets[0].data.length ? (
            <BarChart
              data={areaChartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              style={{ marginVertical: 10, borderRadius: 16 }}
            />
          ) : (
            <Text style={GLOBAL_STYLES.kpiLabel}>No area data.</Text>
          )}
        </ScrollView>
      )}

      {/* 🔹 CALCULATION TAB */}
      {currentTab === 'Calculation' && (
        <FlatList
          data={filteredData}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => {
            const area = item.data?.reduce((s, i) => s + (Number(i.result) || 0), 0) || 0;
            const buyed = item.buyedPrice || 0;
            const paid = item.payedPrice || 0;
            const bal = buyed - paid;

            return (
              <TouchableOpacity
                style={GLOBAL_STYLES.itemBox}
                onPress={() => {
                  setSelectedItem(item);
                  setCalcDetailModalVisible(true);
                }}
              >
                <Text style={GLOBAL_STYLES.listItemText}>S/No: {index + 1}</Text>
                <Text>Area: {area.toFixed(2)} ft²</Text>
                <Text>Buyed: ₹{buyed}</Text>
                <Text>Advance: ₹{paid}</Text>
                <Text>Balance: ₹{bal}</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={GLOBAL_STYLES.kpiLabel}>No records found.</Text>}
        />
      )}

      {/* 🔹 CALCULATION DETAIL MODAL */}
      <Modal
        visible={calcDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCalcDetailModalVisible(false)}
      >
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={[GLOBAL_STYLES.modalBox, { maxHeight: '80%' }]}>
            <Text style={GLOBAL_STYLES.modalTitle}>Calculation Details</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 5 }}>
              <Text style={{ fontWeight: '700', flex: 1 }}>Length</Text>
              <Text style={{ fontWeight: '700', flex: 1 }}>Thickness</Text>
              <Text style={{ fontWeight: '700', flex: 1 }}>Result</Text>
            </View>

            <FlatList
              data={selectedItem?.data || []}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 5 }}>
                  <Text style={{ flex: 1 }}>{item.selectedValue}</Text>
                  <Text style={{ flex: 1 }}>{item.num1}</Text>
                  <Text style={{ flex: 1 }}>{item.result}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 12 }}>No calculations.</Text>}
            />

            <TouchableOpacity
              style={[GLOBAL_STYLES.pageButton, { marginTop: 12 }]}
              onPress={() => setCalcDetailModalVisible(false)}
            >
              <Text style={GLOBAL_STYLES.pageText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔹 PAYMENTS TAB */}
      {currentTab === 'Payments' && (
        <View style={{ flex: 1 }}>
          <Text style={GLOBAL_STYLES.sectionTitle}>All Payments</Text>
          {loadingPayments ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              data={filteredPayments}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={GLOBAL_STYLES.itemBox}>
                  <Text style={GLOBAL_STYLES.listItemText}>{item.note}</Text>
                  <Text>
                    Amount: ₹{item.amount} | Date:{' '}
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                  </Text>
                </View>
              )}
              ListEmptyComponent={<Text style={GLOBAL_STYLES.kpiLabel}>No payments yet.</Text>}
            />
          )}
          <TouchableOpacity
            style={GLOBAL_STYLES.floatingButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* 🔹 ADD PAYMENT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={GLOBAL_STYLES.modalBox}>
            <Text style={GLOBAL_STYLES.modalTitle}>Add Payment</Text>
            <TextInput
              style={GLOBAL_STYLES.input}
              placeholder="Note"
              value={note}
              onChangeText={setNote}
            />
            <TextInput
              style={GLOBAL_STYLES.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={GLOBAL_STYLES.modalActions}>
              <TouchableOpacity style={GLOBAL_STYLES.pageButton} onPress={addPayment}>
                <Text style={GLOBAL_STYLES.pageText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GLOBAL_STYLES.pageButton, { backgroundColor: '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={GLOBAL_STYLES.pageText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔹 PAYMENT DETAIL MODAL */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={GLOBAL_STYLES.modalBox}>
            <Text style={GLOBAL_STYLES.modalTitle}>Payment Details</Text>
            {selectedPayment && (
              <>
                <Text>Amount: ₹{selectedPayment.amount}</Text>
                <Text>
                  Date:{' '}
                  {selectedPayment.timestamp
                    ? new Date(selectedPayment.timestamp).toLocaleString()
                    : 'N/A'}
                </Text>
                <Text>Note: {selectedPayment.note || 'No note'}</Text>
              </>
            )}
            <TouchableOpacity
              style={[GLOBAL_STYLES.pageButton, { marginTop: 12 }]}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={GLOBAL_STYLES.pageText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const chartConfig = {
  backgroundColor: '#fff8e7',
  backgroundGradientFrom: '#fff8e7',
  backgroundGradientTo: '#f9e2c9',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(139, 69, 19, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(75, 46, 5, ${opacity})`,
  propsForDots: { r: '5', strokeWidth: '2', stroke: '#8B4513' },
};
