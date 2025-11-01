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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { PieChart } from 'react-native-chart-kit';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';
const screenWidth = Dimensions.get('window').width;

export default function BoxBuyerDetail({ route }) {
  const { itemKey, key } = route.params;
  const dispatch = useDispatch();

  const millKey = useSelector((state) => state.mill.millKey);
  const itemData = useSelector((state) =>
    selectMillItemData(state, millKey, 'BoxBuyers', itemKey)
  );

  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'BoxBuyers'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'BoxBuyers'));
    };
  }, [millKey]);

  const [currentTab, setCurrentTab] = useState('shipped');
  const [currentSubTab, setCurrentSubTab] = useState('Analytics');
  const [filter, setFilter] = useState('month');
  const [boxType, setBoxType] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState({});

  const colors = {
    full: '#cd4009ff',
    half: '#FF9800',
    side: '#933e05ff',
    payment: '#2E8B57',
    Ordered: '#0077b6',
  };

  const shippedData = itemData?.Shipped ? Object.values(itemData.Shipped) : [];
  const paymentsData = itemData?.Payments ? Object.values(itemData.Payments) : [];
  const orderedData = itemData?.Ordered ? Object.values(itemData.Ordered) : [];

  const filterByDate = (data) => {
    if (!data) return [];
    const now = new Date();

    switch (filter) {
      case 'day':
        return data.filter(
          (item) =>
            new Date(item.timestamp).toDateString() === now.toDateString()
        );
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Sunday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Saturday
        return data.filter((item) => {
          const d = new Date(item.timestamp);
          return d >= weekStart && d <= weekEnd;
        });
      case 'month':
        return data.filter(
          (item) =>
            new Date(item.timestamp).getMonth() === now.getMonth() &&
            new Date(item.timestamp).getFullYear() === now.getFullYear()
        );
      case 'year':
        return data.filter(
          (item) => new Date(item.timestamp).getFullYear() === now.getFullYear()
        );
      case 'all':
      default:
        return data;
    }
  };


  const filteredShipped = useMemo(() => filterByDate(shippedData), [shippedData, filter]);
  const filteredPayments = useMemo(() => filterByDate(paymentsData), [paymentsData, filter]);
  const filteredOrdered = useMemo(() => filterByDate(orderedData), [orderedData, filter]);

  // ---------------- Totals ----------------
  const totals = useMemo(() => {
    let full = 0,
      half = 0,
      side = 0,
      payment = 0,
      OrderedTotal = 0,
      fullAmountPaid = 0,
      halfAmountPaid = 0,
      orderAmountFull = 0,
      orderAmountHalf = 0;

    filteredShipped.forEach((item) => {
      full += parseInt(item.fullQuantity || 0);
      half += parseInt(item.halfQuantity || 0);
      side += parseInt(item.sideQuantity || 0);
    });

    filteredPayments.forEach((item) => {
      payment += parseFloat(item.amount || 0);
      fullAmountPaid += parseFloat(item.fullAmount || 0) || 0;
      halfAmountPaid += parseFloat(item.halfAmount || 0) || 0;
    });

    filteredOrdered.forEach((item) => {
      orderAmountFull += parseFloat(Number(item.fullBoxPrice) * Number(item.fullQty) || 0);
      orderAmountHalf += parseFloat(Number(item.halfBoxPrice) * Number(item.halfQty) || 0);
      OrderedTotal += parseFloat(item.total || 0);
    });

    return {
      full,
      half,
      side,
      payment,
      OrderedTotal,
      fullAmountPaid,
      halfAmountPaid,
      orderAmountFull,
      orderAmountHalf,
    };
  }, [filteredShipped, filteredPayments, filteredOrdered]);

  const OrderedTotals = useMemo(() => {
    let full = 0,
      half = 0,
      price = 0;
    filteredOrdered.forEach((item) => {
      full += parseInt(item.fullQty || 0);
      half += parseInt(item.halfQty || 0);
      price += parseFloat(item.total || 0);
    });
    return { full, half, price };
  }, [filteredOrdered]);

  const memoizedDataSets = useMemo(
    () => [
      { name: 'shipped', data: shippedData, dateKey: 'timestamp' },
      { name: 'payments', data: paymentsData, dateKey: 'timestamp' },
      { name: 'ordered', data: orderedData, dateKey: 'timestamp' },
    ],
    [shippedData, paymentsData, orderedData]
  );

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    labelColor: () => '#000',
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
  };

  const pieDataForShipped = [
    { name: 'Ordered', population: OrderedTotals.full || 0, color: colors.full, legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Shipped', population: totals.full || 0, color: colors.half, legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Balance', population: Math.abs(OrderedTotals.full - totals.full) || 0, color: colors.side, legendFontColor: '#7F7F7F', legendFontSize: 12 },
  ];
  const pieDataForhafShipped = [
    { name: 'Ordered', population: OrderedTotals.half || 0, color: colors.full, legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Shipped', population: totals.half || 0, color: colors.half, legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Balance', population: Math.abs(OrderedTotals.half - totals.half) || 0, color: colors.side, legendFontColor: '#7F7F7F', legendFontSize: 12 },
  ];

  const pieDataForPayments = [
    { name: 'Paid', population: totals.payment || 0, color: colors.payment, legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Balance', population: Math.max((totals.OrderedTotal || 0) - (totals.payment || 0), 0), color: '#ccc', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  ];

  const pieDataForOrdered = [
    { name: 'Full', population: OrderedTotals.full || 0, color: colors.Ordered, legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Half', population: OrderedTotals.half || 0, color: colors.half, legendFontColor: '#7F7F7F', legendFontSize: 12 },
  ];

  const renderHeader = () => (
    <View style={GLOBAL_STYLES.container}>
      {currentTab === 'shipped' && currentSubTab === 'Analytics' && (
        <>

          <KpiAnimatedCard
            title="Full Box Shipping Overview"
            kpis={[
              { label: 'Order Full', value: OrderedTotals.full || 0, icon: 'cart', gradient: [COLORS.kpitotal, COLORS.kpitotalg], isPayment: 0 },
              { label: Number(Math.abs(OrderedTotals.full - totals.full)) > 0 ? 'To Ship' : 'Advance Shipped', value: Math.abs(Math.abs(OrderedTotals.full - totals.full) || 0), icon: 'car', gradient: [COLORS.kpitopay, COLORS.kpitopayg], isPayment: 0 },
            ]}
            progressData={{
              label: 'Total Shipped',
              value: totals.full || 0,
              total: OrderedTotals.full || 0,
              icon: 'check-decagram',

              gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
            }}
          />
          <DonutKpi
            data={[
              { label: 'Shipped', value: totals.full || 0, color: COLORS.kpitotalpaid },
              { label: Number(Math.abs(OrderedTotals.full - totals.full)) > 0 ? 'To Ship' : 'Advance', value: Number(Math.abs(OrderedTotals.full - totals.full)) || 0, color: Number(Math.abs(OrderedTotals.full - totals.full)) > 0 ? COLORS.kpitopay : COLORS.kpiadvance },
            ]}
            showTotal={true}
            isMoney={false}
            label=""
            labelPosition="left"
          />

          <KpiAnimatedCard
            title="Half Box Shipping Overview"
            kpis={[
              { label: 'Order Half', value: OrderedTotals.half || 0, icon: 'cart', gradient: [COLORS.kpitotal, COLORS.kpitotalg], isPayment: 0 },
              { label: Number(Math.abs(OrderedTotals.half - totals.half)) > 0 ? 'To Ship' : 'Advance Shipped', value: Math.abs(Math.abs(OrderedTotals.half - totals.half) || 0), icon: 'car', gradient: [COLORS.kpitopay, COLORS.kpitopayg], isPayment: 0 },
            ]}
            progressData={{
              label: 'Total Shipped',
              value: totals.half || 0,
              total: OrderedTotals.half || 0,
              icon: 'check-decagram',
              gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
            }}
          />
          <DonutKpi
            data={[
              { label: 'Shipped', value: totals.half || 0, color: COLORS.kpitotalpaid },
              { label: Number(Math.abs(OrderedTotals.half - totals.half)) > 0 ? 'To Ship' : 'Advance', value: Number(Math.abs(OrderedTotals.half - totals.half)) || 0, color: Number(Math.abs(OrderedTotals.half - totals.half)) > 0 ? COLORS.kpitopay : COLORS.kpiadvance },
            ]}
            showTotal={true}
            isMoney={false}
            label=""
            labelPosition="left"
          />
        </>
      )}

      {currentTab === 'payments' && currentSubTab === 'Analytics' && (
        <>
          <KpiAnimatedCard
            title="Earnings Overview"
            kpis={[
              { label: 'Full Box', value: totals.orderAmountFull || 0, icon: 'cube', gradient: [COLORS.kpibaseg, COLORS.kpibaseg] },
              { label: 'Half Box', value: totals.orderAmountHalf || 0, icon: 'rectangle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] },
              { label: 'Total', value: totals.OrderedTotal || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
              { label: totals.OrderedTotal - totals.payment > 0 ? 'To Pay' : 'Advance', value: Math.abs(Number(totals.OrderedTotal - totals.payment)), icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
            ]}
            progressData={{
              label: 'Total Paid',
              value: totals.payment || 0,
              total: totals.OrderedTotal || 0,
              icon: 'check-decagram',
              gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
            }}
          />
          <DonutKpi
            data={[
              { label: 'Paid', value: totals.payment || 0, color: COLORS.kpitotalpaid },
              { label: totals.OrderedTotal - totals.payment > 0 ? 'To Pay' : 'Advance', value: totals.OrderedTotal - totals.payment || 0, color: totals.OrderedTotal - totals.payment > 0 ? COLORS.kpitopay : COLORS.kpiadvance },
            ]}
            showTotal={true}
            isMoney={true}
            label=""
            labelPosition="left"
          />
        </>
      )}

      {currentTab === 'ordered' && currentSubTab === 'Analytics' && (
        <>
          <KpiAnimatedCard
            title="Orders Overview"
            kpis={[
              { label: 'Full Box', value: OrderedTotals.full || 0, icon: 'cube', gradient: [COLORS.kpibaseg, COLORS.kpibaseg], isPayment: 0 },
              { label: 'Half Box', value: OrderedTotals.half || 0, icon: 'rectangle', gradient: [COLORS.kpiextra, COLORS.kpiextrag], isPayment: 0 },
            ]}
          />
          <DonutKpi
            data={[
              { label: 'Full', value: OrderedTotals.full || 0, color: COLORS.kpitotalpaid },
              { label: 'Half', value: OrderedTotals.half || 0, color: COLORS.kpitopay },
            ]}
            showTotal={true}
            isMoney={false}
            label=""
            labelPosition="left"
          />
        </>
      )}
    </View>
  );

  const dataToShow =
    currentTab === 'shipped' ? filteredShipped : currentTab === 'payments' ? filteredPayments : filteredOrdered;

  const addEntry = async () => {
    let entry = {};
    if (currentTab === 'shipped') {
      if ((amount.full && amount.full !== '') || (amount.half && amount.half !== '')) {
        entry = {
          fullQuantity: Number(amount.full) || 0,
          halfQuantity: Number(amount.half) || 0,
          sideQuantity: Number(amount.side) || 0,
          timestamp: Date.now(),
        };
      } else return alert('Enter full or half quantity');
    } else if (currentTab === 'payments') {
      if (!amount.value || !amount.note) return alert('Enter amount and note');
      entry = { amount: parseFloat(amount.value) || 0, note: amount.note, timestamp: Date.now() };
    } else if (currentTab === 'ordered') {
      const fullBoxPrice = parseFloat(amount.fullBoxPrice || 0);
      const halfBoxPrice = parseFloat(amount.halfBoxPrice || 0);
      const fullQty = parseFloat(amount.fullQty || 0);
      const halfQty = parseFloat(amount.halfQty || 0);
      const total = fullBoxPrice * fullQty + halfBoxPrice * halfQty;
      entry = { fullBoxPrice, halfBoxPrice, fullQty, halfQty, total, note: amount.note || '', timestamp: Date.now() };
    }

    dispatch(
      addEntityData({
        millKey,
        entityType: 'BoxBuyers',
        entityKey: itemKey,
        entryType: currentTab === 'shipped' ? 'Shipped' : currentTab === 'payments' ? 'Payments' : 'Ordered',
        data: entry,
      })
    );

    setAmount({});
    setBoxType([]);
    setModalVisible(false);
  };

  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>{itemData?.name || 'Box Buyer Detail'}</Text>
      </View>

      <DateFilter filters={['day', 'week', 'month', 'year', 'all']} dataSets={memoizedDataSets} onSelect={(selectedFilter) => setFilter(selectedFilter)} />

      <TabSwitch tabs={['Analytics', 'History']} activeTab={currentSubTab} onChange={setCurrentSubTab} />
      <TabSwitch tabs={['shipped', 'payments', 'ordered']} activeTab={currentTab} onChange={setCurrentTab} />

      <FlatList
        data={dataToShow}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) =>
          currentSubTab === 'History' && (
            <View style={[GLOBAL_STYLES.listItem, { marginHorizontal: 15, marginVertical: 6 }]}>
              {/* ===== SHIPPED TAB ===== */}
              {currentTab === 'shipped' && (
                <View>
                  {/* From → Destination */}
                  {(item.from || item.destination) && (
                    <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                      {item.from && (
                        <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.text }]}>
                          {item.from}
                        </Text>
                      )}
                      {item.destination && (
                        <>
                          <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.text }]}>
                            {' '}→{' '}
                          </Text>
                          <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.primary }]}>
                            {item.destination}
                          </Text>
                        </>
                      )}
                    </View>
                  )}

                  {/* Quantities */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 }}>
                    <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.text }]}>
                      Full: <Text style={{ color: COLORS.primary }}>{item.fullQuantity || 0}</Text>
                    </Text>
                    <Text style={[GLOBAL_STYLES.squareLabel, { marginLeft: 10, color: COLORS.text }]}>
                      Half: <Text style={{ color: COLORS.primary }}>{item.halfQuantity || 0}</Text>
                    </Text>
                    {item.sideQuantity ? (
                      <Text style={[GLOBAL_STYLES.squareLabel, { marginLeft: 10, color: COLORS.text }]}>
                        Side: <Text style={{ color: COLORS.primary }}>{item.sideQuantity}</Text>
                      </Text>
                    ) : null}
                  </View>

                  {/* Shipping Cost */}
                  {item.transporterName ? (
                    <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.success }]}>
                      Transporter:  {item.transporterName}
                    </Text>
                  ) : null}
                  {item.shippingCost ? (
                    <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.success }]}>
                      Shipping Cost : ₹{item.shippingCost}
                    </Text>
                  ) : null}


                  {/* Optional Note */}
                  {item.note ? (
                    <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.secondary, marginTop: 4 }]}>
                      Note: {item.note}
                    </Text>
                  ) : null}

                  {/* Date */}
                  {item.timestamp ? (
                    <Text
                      style={[
                        GLOBAL_STYLES.squareLabel,
                        { color: COLORS.muted, fontSize: 12, marginTop: 6 },
                      ]}
                    >
                      {new Date(item.timestamp).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* ===== PAYMENTS TAB ===== */}
              {currentTab === 'payments' && (
                <View>
                  <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.primary }]}>
                    ₹{item.amount || 0}
                  </Text>
                  {item.note ? (
                    <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.text }]}>
                      Note: {item.note}
                    </Text>
                  ) : null}
                  {item.timestamp ? (
                    <Text
                      style={[
                        GLOBAL_STYLES.squareLabel,
                        { color: COLORS.muted, fontSize: 12, marginTop: 6 },
                      ]}
                    >
                      {new Date(item.timestamp).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* ===== ORDERED TAB ===== */}
              {currentTab === 'ordered' && (
                <View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 }}>
                    <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.text }]}>
                      Full: <Text style={{ color: COLORS.primary }}>{item.fullQty || 0}</Text>
                    </Text>
                    <Text style={[GLOBAL_STYLES.squareLabel, { marginLeft: 10, color: COLORS.text }]}>
                      Half: <Text style={{ color: COLORS.primary }}>{item.halfQty || 0}</Text>
                    </Text>
                  </View>

                  {/* Total */}
                  <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.success }]}>
                    ₹{item.total ? item.total.toLocaleString() : 0}
                  </Text>

                  {/* Optional Note */}
                  {item.note ? (
                    <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.secondary, marginTop: 4 }]}>
                      Note: {item.note}
                    </Text>
                  ) : null}

                  {/* Date */}
                  {item.timestamp ? (
                    <Text
                      style={[
                        GLOBAL_STYLES.squareLabel,
                        { color: COLORS.muted, fontSize: 12, marginTop: 6 },
                      ]}
                    >
                      {new Date(item.timestamp).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          )
        }
      />


      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 25,
          right: 25,
          backgroundColor: COLORS.primary,
          borderRadius: 50,
          width: 60,
          height: 60,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: '#fff', fontSize: 30 }}>+</Text>
      </TouchableOpacity>

      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={[GLOBAL_STYLES.modalBox, { padding: 20 }]}>
            <Text style={GLOBAL_STYLES.modalTitle}>Add {currentTab}</Text>

            {currentTab === 'shipped' && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                  {['full', 'half'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() =>
                        setBoxType((prev) =>
                          prev.includes(type)
                            ? prev.filter((t) => t !== type)
                            : [...prev, type]
                        )
                      }
                      style={{
                        backgroundColor: boxType.includes(type) ? COLORS.primary : '#ddd',
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        borderRadius: 20,
                        marginHorizontal: 5,
                      }}
                    >
                      <Text
                        style={{
                          color: boxType.includes(type) ? '#fff' : '#000',
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                        }}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {boxType.includes('full') && (
                  <TextInput
                    placeholder="Full Quantity"
                    keyboardType="numeric"
                    value={String(amount.full || '')}
                    onChangeText={(text) => setAmount({ ...amount, full: text })}
                    style={GLOBAL_STYLES.input}
                  />
                )}

                {boxType.includes('half') && (
                  <TextInput
                    placeholder="Half Quantity"
                    keyboardType="numeric"
                    value={String(amount.half || '')}
                    onChangeText={(text) => setAmount({ ...amount, half: text })}
                    style={GLOBAL_STYLES.input}
                  />
                )}

                <TextInput
                  placeholder="Side Quantity (optional)"
                  keyboardType="numeric"
                  value={String(amount.side || '')}
                  onChangeText={(text) => setAmount({ ...amount, side: text })}
                  style={GLOBAL_STYLES.input}
                />
              </>
            )}

            {currentTab === 'payments' && (
              <>
                <TextInput
                  placeholder="Note"
                  value={amount.note}
                  onChangeText={(text) => setAmount({ ...amount, note: text })}
                  style={GLOBAL_STYLES.input}
                />
                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={String(amount.value || '')}
                  onChangeText={(text) => setAmount({ ...amount, value: text })}
                  style={GLOBAL_STYLES.input}
                />
              </>
            )}

            {currentTab === 'ordered' && (
              <>
                <TextInput
                  placeholder="Full Box Qty"
                  keyboardType="numeric"
                  value={String(amount.fullQty || '')}
                  onChangeText={(text) => setAmount({ ...amount, fullQty: text })}
                  style={GLOBAL_STYLES.input}
                />
                <TextInput
                  placeholder="Half Box Qty"
                  keyboardType="numeric"
                  value={String(amount.halfQty || '')}
                  onChangeText={(text) => setAmount({ ...amount, halfQty: text })}
                  style={GLOBAL_STYLES.input}
                />
                <TextInput
                  placeholder="Full Box Price"
                  keyboardType="numeric"
                  value={String(amount.fullBoxPrice || '')}
                  onChangeText={(text) => setAmount({ ...amount, fullBoxPrice: text })}
                  style={GLOBAL_STYLES.input}
                />
                <TextInput
                  placeholder="Half Box Price"
                  keyboardType="numeric"
                  value={String(amount.halfBoxPrice || '')}
                  onChangeText={(text) => setAmount({ ...amount, halfBoxPrice: text })}
                  style={GLOBAL_STYLES.input}
                />
              </>
            )}

            <View style={GLOBAL_STYLES.row}>
              <TouchableOpacity style={[GLOBAL_STYLES.cancelbutton, { width: '40%', marginTop: 15 }]} onPress={() => { setModalVisible(false); setBoxType([]); setAmount({}); }}>
                <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[GLOBAL_STYLES.button, { width: '40%', marginTop: 15 }]} onPress={addEntry}>
                <Text style={GLOBAL_STYLES.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
