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
import { ref, push, onValue } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import { useSelector, useDispatch } from 'react-redux';
import ListCardItem from '../../components/ListCardItem';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';
import { MaterialCommunityIcons, FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
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
  const [activeFilterRange, setActiveFilterRange] = useState({ from: null, to: null });
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
    return data.filter(item => {
      if (!item.timestamp) return false;
      const ts = item.timestamp;
      const from = activeFilterRange.from;
      const to = activeFilterRange.to;
      if (from && ts < from) return false;
      if (to && ts > to) return false;
      return true;
    });
  }, [data, activeFilterRange]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (!p.timestamp) return false;
      const ts = p.timestamp;
      const from = activeFilterRange.from;
      const to = activeFilterRange.to;
      if (from && ts < from) return false;
      if (to && ts > to) return false;
      return true;
    });
  }, [payments, activeFilterRange]);

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
  console.warn(totalOtherPayments)
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
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* DATE FILTER */}
      <DateFilter
        onSelect={(selectedFilter, filtered, range) => {
          setActiveFilterRange(range); // range = { from: timestamp, to: timestamp }
        }}
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
          <KpiAnimatedCard
            title="Earnings Overview"
            kpis={[
              { label: 'Total', value: Number(grandTotals.buyed).toFixed(2) || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
              { label: Number(balance).toFixed(2) > 0 ? 'To Pay' : 'Advance', value: Math.abs(Number(balance).toFixed(2) || 0), icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
            ]}
            progressData={{
              label: 'Total Paid',
              value: Number(totalOtherPayments).toFixed(2) || 0,
              total: Number(grandTotals.buyed).toFixed(2) || 0,
              icon: 'check-decagram',
              gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
            }}
          />
          <DonutKpi
            data={[
              { label: 'Paid', value: totalOtherPayments || 0, color: COLORS.kpitotalpaid },
              { label: balance > 0 ? 'To Pay' : 'Advance', value: balance || 0, color: balance > 0 ? COLORS.kpitopay : COLORS.kpiadvance },
            ]}
            showTotal={true}
            isMoney={true}
            label=""
            labelPosition="right"
          />

        </ScrollView>
      )}

      {/* 🔹 CALCULATION TAB */}
      {currentTab === 'Calculation' && (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => item.id || item.timestamp || index.toString()}
          renderItem={({ item, index }) => {
            // 🧮 Calculate totals
            const totalArea =
              item.data?.reduce((sum, i) => sum + (Number(i.result) || 0), 0) || 0;
            const buyed = Number(item.buyedPrice) || 0;
            const advancePaid = Number(item.payedPrice) || 0;
            const balance = buyed - advancePaid;

            // 🧠 Enriched data (for modal or next screen)
            const enrichedItem = {
              ...item,
              totalArea,
              buyed,
              advancePaid,
              balance,
            };

            // 🚫 Skip invalid items
            if (!(totalArea > 0)) return null;

            // ✅ Use reusable card
            return (
              <ListCardItem
                key={item.timestamp || item.id || index.toString()}
                item={enrichedItem}
                activeTab={currentTab}
                onPress={() => {
                  setSelectedItem(item);
                  setCalcDetailModalVisible(true);
                }}
                type="RoundLog"
              />
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
          {loadingPayments ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              data={filteredPayments}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <ListCardItem
                  key={item.timestamp || item.id || index.toString()} // ✅ unique key
                  item={item}
                  activeTab={currentTab}
                  type="FlatLog"
                />
              )}
              ListEmptyComponent={<Text style={GLOBAL_STYLES.kpiLabel}>No payments yet.</Text>}
            />
          )}

        </View>
      )}

      {/* 🔹 ADD PAYMENT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
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
                name="book"
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
             {/* BUTTONS */}
                          <View style={GLOBAL_STYLES.row}>
                            <TouchableOpacity
                              style={[GLOBAL_STYLES.cancelbutton, { width: '47%' }]}
                               onPress={() => setModalVisible(false)}
                            >
                              <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
                            </TouchableOpacity>
            
                            <TouchableOpacity
                              style={[GLOBAL_STYLES.button, { width: '47%' }]}
                              onPress={addPayment}
                            >
                              <Text style={GLOBAL_STYLES.buttonText}>
                                Add
                              </Text>
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
