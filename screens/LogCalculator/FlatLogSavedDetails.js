import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ref, push, onValue } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';
export default function FlatLogSavedDetail({ route }) {
  const { data = [], name = 'Unknown', MillKey } = route.params || {};
  const millKey = useSelector(state => state.mill.millKey);
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false); // Calculation details
  const [paymentModalVisible, setPaymentModalVisible] = useState(false); // Add payment
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [currentTab, setCurrentTab] = useState('GrandTotal');

  const screenWidth = Dimensions.get('window').width - 20;

  // GRAND TOTALS
  const grandTotals = data.reduce(
    (acc, item) => {
      const buyed = Number(item.totalPrice) || 0;
      console.log(item)
      const payed = Number(item.payedPrice) || 0;
      const otherTotal = item.payments
        ? Array.isArray(item.payments)
          ? item.payments.reduce((s, p) => s + (p.amount || 0), 0)
          : Object.values(item.payments).reduce((s, p) => s + (p.amount || 0), 0)
        : 0;

      acc.buyed += buyed;
      acc.payed += payed;
      acc.other += otherTotal;
      acc.balance += buyed - (payed + otherTotal);
      return acc;
    },
    { buyed: 0, payed: 0, other: 0, balance: 0 }
  );

  // Prepare chart data
  const areaData = data.map((item) => ({
    date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '—',
    area: typeof item.area === 'number'
      ? Number(item.area)
      : item.data?.reduce((s, e) => s + (Number(e.area) || 0), 0) || 0,
  }));

  const areaChartData = {
    labels: areaData.map((a) => a.date).slice(-6),
    datasets: [{ data: areaData.map((a) => a.area).slice(-6) }],
  };

  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'FlatLogCalculations'));

    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'FlatLogCalculations'));
    };
  }, [millKey]);
  // Fetch Payments
  useEffect(() => {
    if (!MillKey) return;

    setLoadingPayments(true);
    const paymentRef = ref(database, `Mills/${MillKey}/FlatLogCalculations/${name}/payments`);

    const unsubscribe = onValue(paymentRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        setPayments([]);
        setLoadingPayments(false);
        return;
      }

      const allPayments = Object.values(val); // directly get all payment entries
      setPayments(allPayments);
      setLoadingPayments(false);
    });

    return () => unsubscribe();
  }, [MillKey, name]);


  const addPayment = async () => {
    if (!note || !amount) {
      Alert.alert('Validation', 'Please enter note and amount.');
      return;
    }

    if (!MillKey) {
      console.warn('MillKey missing — payment not pushed to Firebase.');
      setNote('');
      setAmount('');
      setPaymentModalVisible(false);
      return;
    }

    try {
      const paymentRef = ref(database, `Mills/${MillKey}/FlatLogCalculations/${name}/payments`);
      await push(paymentRef, {
        note,
        amount: Number(amount),
        timestamp: Date.now(),
      });
      setNote('');
      setAmount('');
      setPaymentModalVisible(false);
    } catch (err) {
      console.error('Add payment error:', err);
      Alert.alert('Error', 'Could not save payment. See console for details.');
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.nameText}>{name}</Text>
      </View>

      <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
        <TabSwitch
          tabs={['GrandTotal', 'Calculation', 'payments']}
          activeTab={currentTab}
          onChange={setCurrentTab}
        />
      </View>

      {/* GRAND TOTAL */}
      {currentTab === 'GrandTotal' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Grand Total</Text>
          <View style={[GLOBAL_STYLES.kpiRow, { flexWrap: 'wrap' }]}>
            {[
              { icon: 'pricetag', label: 'Selled', value: grandTotals.buyed },
              { icon: 'cash', label: 'Advance Paid', value: grandTotals.payed },
              { icon: 'wallet', label: 'Other Payments', value: grandTotals.other },
              { icon: 'calculator', label: 'Balance', value: grandTotals.balance },
            ].map((it, idx) => (
              <View style={[GLOBAL_STYLES.kpiBox, { width: '30%' }]} key={idx}>
                <Ionicons name={it.icon} size={26} color="#8B4513" />
                <Text style={styles.squareLabel}>{it.label}</Text>
                <Text style={styles.squareValue}>{it.value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.graphTitle}>🪵 Total Area Over Time</Text>
          {areaChartData.datasets[0].data.length ? (
            <BarChart
              data={areaChartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noData}>No total data for charts.</Text>
          )}
        </ScrollView>
      )}

      {/* CALCULATION SUMMARY */}
      {currentTab === 'Calculation' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {data.map((item, index) => {
            const itemTotal = typeof item.area === 'number'
              ? Number(item.area)
              : item.data?.reduce((s, e) => s + (Number(e.area) || 0), 0) || 0;

            const otherPaymentsTotal = item.payments
              ? Array.isArray(item.payments)
                ? item.payments.reduce((s, p) => s + (p.amount || 0), 0)
                : Object.values(item.payments).reduce((s, p) => s + (p.amount || 0), 0)
              : 0;

            const buyed = item.totalPrice || 0;
            const advancePaid = item.payedPrice || 0;
            const balance = buyed - (advancePaid + otherPaymentsTotal);

            return (
              <TouchableOpacity
                key={index}
                style={styles.entryCard}
                onPress={() => {
                  setSelectedCalculation(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.entryTitle}>S/No: {index + 1}</Text>
                <Text style={styles.entryDetail}>
                  Date: {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                </Text>
                <Text style={styles.entryDetail}>Total Area: {itemTotal.toFixed(2)}</Text>
                <Text style={styles.entryDetail}>Balance: ₹{balance.toFixed(2)}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Calculation Details Modal */}
          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalBox, { maxHeight: '80%' }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>Calculation Details</Text>
                  {(selectedCalculation?.data || []).map((it, idx) => (
                    <View style={styles.itemCard} key={idx}>
                      <View style={styles.row}>
                        <View style={styles.rowLeft}>
                          <MaterialCommunityIcons name="ruler" size={18} color="#A0522D" />
                          <Text style={styles.headerText}>Length</Text>
                        </View>
                        <Text style={styles.itemText}>{it.lengthFeet ?? '-'}</Text>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.rowLeft}>
                          <MaterialCommunityIcons name="arrow-up-down" size={18} color="#A0522D" />
                          <Text style={styles.headerText}>Height</Text>
                        </View>
                        <Text style={styles.itemText}>{it.heightInches ?? '-'}</Text>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.rowLeft}>
                          <MaterialCommunityIcons name="arrow-left-right" size={18} color="#A0522D" />
                          <Text style={styles.headerText}>Breadth</Text>
                        </View>
                        <Text style={styles.itemText}>{it.breadthInches ?? '-'}</Text>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.rowLeft}>
                          <FontAwesome5 name="boxes" size={16} color="#A0522D" />
                          <Text style={styles.headerText}>Qty</Text>
                        </View>
                        <Text style={styles.itemText}>{it.quantity ?? '-'}</Text>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.rowLeft}>
                          <FontAwesome5 name="rupee-sign" size={16} color="#A0522D" />
                          <Text style={styles.headerText}>Price/Unit</Text>
                        </View>
                        <Text style={styles.itemText}>{it.pricePerUnit ?? '-'}</Text>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.rowLeft}>
                          <MaterialCommunityIcons name="square-foot" size={18} color="#A0522D" />
                          <Text style={styles.headerText}>Total Area</Text>
                        </View>
                        <Text style={styles.itemText}>{it.area ?? '-'}</Text>
                      </View>

                      <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <View style={styles.rowLeft}>
                          <FontAwesome5 name="money-bill-wave" size={16} color="#A0522D" />
                          <Text style={styles.headerText}>Total Price</Text>
                        </View>
                        <Text style={[styles.itemText, { fontWeight: 'bold', color: '#A0522D' }]}>
                          ₹{it.totalPrice ?? '-'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.pageButton, { marginTop: 10 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.pageText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}

      {/* PAYMENTS */}
      {currentTab === 'payments' && (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {loadingPayments ? (
            <ActivityIndicator size="large" color="#8B4513" style={{ marginTop: 10 }} />
          ) : (
            <FlatList
              data={payments}
              keyExtractor={(item, idx) => item.timestamp?.toString() || idx.toString()}
              renderItem={({ item }) => (
                <View style={styles.paymentItem}>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemNote}>{item.note ?? 'Advance Payment'}</Text>
                    <Text style={styles.itemDate}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</Text>
                  </View>
                  <Text style={styles.amountText}>₹{item.amount}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.noData}>No payments yet.</Text>}
            />
          )}

          <TouchableOpacity style={styles.fab} onPress={() => setPaymentModalVisible(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* ADD PAYMENT MODAL */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Payment</Text>
            <TextInput
              style={styles.input}
              placeholder="Note"
              value={note}
              onChangeText={setNote}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.pageButton} onPress={addPayment}>
                <Text style={styles.pageText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pageButton, { backgroundColor: '#ccc' }]}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.pageText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  style: { borderRadius: 16 },
  propsForDots: { r: '5', strokeWidth: '2', stroke: '#8B4513' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7' },
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#8B4513',
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  nameText: { color: '#fff', fontSize: 20, flex: 1, fontWeight: '700' },
  sectionTitle: { fontSize: 18, color: '#4B2E05', fontWeight: '700', margin: 12 },
  squareLabel: { color: '#4B2E05', fontSize: 14, marginTop: 6 },
  squareValue: { color: '#000', fontSize: 16, fontWeight: '700', marginTop: 4 },
  graphTitle: { fontSize: 16, color: '#4B2E05', fontWeight: '700', marginLeft: 20, marginTop: 12 },
  chart: { marginVertical: 10, borderRadius: 16, marginHorizontal: 10 },
  entryCard: { backgroundColor: '#FFF0DC', marginHorizontal: 15, marginVertical: 8, padding: 12, borderRadius: 10, elevation: 3 },
  entryTitle: { fontSize: 16, fontWeight: '700', color: '#8B4513' },
  entryDetail: { fontSize: 14, color: '#4B2E05', marginTop: 2 },
  itemCard: { backgroundColor: '#FFE4C4', padding: 8, borderRadius: 8, marginVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 4 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: 4, fontWeight: '600', color: '#4B2E05' },
  itemText: { color: '#333', fontWeight: '500' },
  noData: { textAlign: 'center', marginVertical: 20, color: '#8B4513' },
  paymentItem: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', backgroundColor: '#FFF0DC', marginHorizontal: 10, borderRadius: 8, marginVertical: 4 },
  itemNote: { fontWeight: '600', color: '#4B2E05' },
  itemDate: { fontSize: 12, color: '#4B2E05' },
  amountText: { fontWeight: '700', color: '#8B4513', fontSize: 16 },
  fab: { position: 'absolute', bottom: 25, right: 25, backgroundColor: '#8B4513', borderRadius: 50, padding: 15, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#FFF8E7', padding: 18, borderRadius: 12, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#8B4513' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginVertical: 6, backgroundColor: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  pageButton: { backgroundColor: '#8B4513', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  pageText: { color: '#fff', fontWeight: '700' },
});
