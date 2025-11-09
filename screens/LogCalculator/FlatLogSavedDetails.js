import React, { useState, useEffect, useMemo } from 'react';
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
import DateFilter from '../../components/Datefilter';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ref, push, onValue } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import { useSelector, useDispatch } from 'react-redux';
import ListCardItem from '../../components/ListCardItem';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';
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
  // DATE FILTER
  const [activeFilterRange, setActiveFilterRange] = useState({
    type: 'all',
    from: null,
    to: null,
  });


  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!item.timestamp) return false;

      const itemDate = new Date(item.timestamp);
      const from = activeFilterRange.from ? new Date(activeFilterRange.from) : null;
      const to = activeFilterRange.to ? new Date(activeFilterRange.to) : null;

      if (from && itemDate < from) return false;
      if (to) {
        to.setHours(23, 59, 59, 999);
        if (itemDate > to) return false;
      }

      return true;
    });
  }, [data, activeFilterRange]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!p.timestamp) return false;

      const payDate = new Date(p.timestamp);
      const from = activeFilterRange.from ? new Date(activeFilterRange.from) : null;
      const to = activeFilterRange.to ? new Date(activeFilterRange.to) : null;

      if (from && payDate < from) return false;
      if (to) {
        to.setHours(23, 59, 59, 999);
        if (payDate > to) return false;
      }

      return true;
    });
  }, [payments, activeFilterRange]);
  // GRAND TOTALS
  const totalsFromEntries = filteredData.reduce(
    (acc, item) => {
      const buyed = Number(item.totalPrice) || 0;
      const payed = Number(item.payedPrice) || 0;
      const otherTotal = item.payments
        ? Array.isArray(item.payments)
          ? item.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
          : Object.values(item.payments).reduce((s, p) => s + (Number(p.amount) || 0), 0)
        : 0;

      acc.buyed += buyed;
      acc.payed += payed;
      acc.other += otherTotal;
      return acc;
    },
    { buyed: 0, payed: 0, other: 0 }
  );

  // Use filteredPayments instead of all payments
  const allOtherPayments =
    (filteredPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const grandTotals = {
    buyed: totalsFromEntries.buyed,
    payed: totalsFromEntries.payed,
    other: totalsFromEntries.other + allOtherPayments,
    balance:
      totalsFromEntries.buyed - (totalsFromEntries.payed + totalsFromEntries.other + allOtherPayments),
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
        <TouchableOpacity onPress={() => setPaymentModalVisible(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <DateFilter
        filters={['day', 'week', 'month', 'year', 'all']}
        dataSets={[
          { name: 'shipped', data: Array.isArray(data) ? data : [], dateKey: 'timestamp' },
          { name: 'payments', data: Array.isArray(payments) ? payments : [], dateKey: 'timestamp' },
        ]}
        onSelect={(selectedFilter, filtered, range) => {
          setActiveFilterRange(range ?? { type: selectedFilter, from: null, to: null });
        }}
      />


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
          <KpiAnimatedCard
            title="Earnings Overview"
            kpis={[
              { label: 'Total', value: Number(grandTotals.buyed).toFixed(2) || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
              { label: Number(grandTotals.balance).toFixed(2) > 0 ? 'To Pay' : 'Advance', value: Math.abs(Number(grandTotals.balance).toFixed(2) || 0), icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
            ]}
            progressData={{
              label: 'Total Paid',
              value: grandTotals.other || 0,
              total: Number(grandTotals.buyed).toFixed(2) || 0,
              icon: 'check-decagram',
              gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
            }}
          />
          <DonutKpi
            data={[
              { label: 'Paid', value: grandTotals.other || 0, color: COLORS.kpitotalpaid },
              { label: grandTotals.balance > 0 ? 'To Pay' : 'Advance', value: grandTotals.balance || 0, color: grandTotals.balance > 0 ? COLORS.kpitopay : COLORS.kpiadvance },
            ]}
            showTotal={true}
            isMoney={true}
            label=""
            labelPosition="left"
          />
        </ScrollView>
      )}

      {/* CALCULATION SUMMARY */}
      {currentTab === 'Calculation' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {filteredData.map((item, index) => {
            const buyed = Number(item.totalPrice) || 0;
            const advancePaid = Number(item.payedPrice) || 0;
            const entryPayments = item.payments
              ? Array.isArray(item.payments)
                ? item.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
                : Object.values(item.payments).reduce((s, p) => s + (Number(p.amount) || 0), 0)
              : 0;

            const totalOtherPayments = (payments || []).reduce(
              (sum, p) => sum + (Number(p.amount) || 0),
              0
            );

            const balance = buyed - (advancePaid + totalOtherPayments);

            const enrichedItem = {
              ...item,
              buyed,
              advancePaid,
              entryPayments,
              totalOtherPayments,
              balance,
            };

            if (!(item.totalArea > 0)) return null; // 👈 simpler condition

            return (
              <ListCardItem
                key={item.timestamp || item.id || index.toString()} // ✅ unique key
                item={enrichedItem}
                activeTab={currentTab}
                onPress={() => {
                  setSelectedCalculation(enrichedItem);
                  setModalVisible(true);
                }}
                type="FlatLog"
              />
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
                          <MaterialCommunityIcons name="square" size={18} color="#A0522D" />
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
              data={filteredPayments}
              keyExtractor={(item, idx) => item.timestamp?.toString() || idx.toString()}
              renderItem={({ item }) => (
                <ListCardItem
                  item={item}
                  activeTab={currentTab == 'payments' ? 'Payments' : currentTab}
                  type="FlatLog"
                />
              )}
              ListEmptyComponent={<Text style={styles.noData}>No payments yet.</Text>}
            />
          )}
        </View>
      )}
      {/* ADD PAYMENT MODAL */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={GLOBAL_STYLES.modalBox}>
            <Text style={GLOBAL_STYLES.modalTitle}>Add Payment</Text>


            <View style={GLOBAL_STYLES.inputRow}>
              <View style={GLOBAL_STYLES.legendContainer}>
                <Text style={GLOBAL_STYLES.legendText}>Note</Text>
              </View>
              <TextInput
                style={GLOBAL_STYLES.input}
                placeholder="Note"
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
                style={GLOBAL_STYLES.input}
                placeholder="Amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
            </View>
            <View style={GLOBAL_STYLES.row}>
              <TouchableOpacity style={[GLOBAL_STYLES.cancelbutton, { width: '40%', marginTop: 15 }]} onPress={() => { setPaymentModalVisible(false); }}>
                <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GLOBAL_STYLES.button, { width: '40%', marginTop: 15 }]}
                onPress={addPayment}
              >
                <Text style={GLOBAL_STYLES.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#FFF8E7', padding: 18, borderRadius: 12, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#8B4513' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginVertical: 6, backgroundColor: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  pageButton: { backgroundColor: '#8B4513', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  pageText: { color: '#fff', fontWeight: '700' },
});
