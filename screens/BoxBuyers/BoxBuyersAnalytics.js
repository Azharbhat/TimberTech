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

export default function BoxBuyersAnalytics() {
  const dispatch = useDispatch();
  const millKey = useSelector((state) => state.mill.millKey);
  const allBoxBuyers = useSelector((state) =>
    selectMillItemData(state, millKey, 'BoxBuyers')
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

  // Aggregate all BoxBuyers data with buyer name
  const shippedData = useMemo(() => {
    if (!allBoxBuyers) return [];
    return Object.values(allBoxBuyers).flatMap((buyer) =>
      buyer.Shipped
        ? Object.values(buyer.Shipped).map((item) => ({ ...item, buyerName: buyer.name || 'Unknown' }))
        : []
    );
  }, [allBoxBuyers]);

  const paymentsData = useMemo(() => {
    if (!allBoxBuyers) return [];
    return Object.values(allBoxBuyers).flatMap((buyer) =>
      buyer.Payments
        ? Object.values(buyer.Payments).map((item) => ({ ...item, buyerName: buyer.name || 'Unknown' }))
        : []
    );
  }, [allBoxBuyers]);

  const orderedData = useMemo(() => {
    if (!allBoxBuyers) return [];
    return Object.values(allBoxBuyers).flatMap((buyer) =>
      buyer.Ordered
        ? Object.values(buyer.Ordered).map((item) => ({ ...item, buyerName: buyer.name || 'Unknown' }))
        : []
    );
  }, [allBoxBuyers]);


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
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
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
      {/* ===== KPIs & PieCharts same as BoxBuyerDetail ===== */}
      {/* Full & Half Shipped Analytics */}
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

      {/* Payments Analytics */}
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

      {/* Ordered Analytics */}
      {currentTab === 'ordered' && currentSubTab === 'Analytics' && (
        <>
         <KpiAnimatedCard
            title="Orders Overview"
            kpis={[
              { label: 'Full Box', value: OrderedTotals.full || 0, icon: 'cube', gradient: [COLORS.kpibaseg, COLORS.kpibaseg] ,isPayment:0},
              { label: 'Half Box', value:OrderedTotals.half || 0, icon: 'rectangle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] ,isPayment:0},
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

  // Optional: Aggregate addEntry logic can be implemented if needed (currently disabled)

  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>


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
                  <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.primary }]}>
                    Name :{item.buyerName || "UnKnown"}
                  </Text>
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
                    Name :{item.buyerName || "UnKnown"}
                  </Text>
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
                  <Text style={[GLOBAL_STYLES.squareLabel, { color: COLORS.primary }]}>
                    Name :{item.buyerName || "UnKnown"}
                  </Text>
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
    </KeyboardAvoidingView>
  );
}
