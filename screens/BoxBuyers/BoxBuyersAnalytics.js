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
import ListCardItem from '../../components/ListCardItem';
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
  const [activeFilterRange, setActiveFilterRange] = useState({ type: 'month', from: null, to: null });


  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'BoxBuyers'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'BoxBuyers'));
    };
  }, [millKey]);

  const [currentTab, setCurrentTab] = useState('shipped');
  const [currentSubTab, setCurrentSubTab] = useState('Analytics');
  const [filter, setFilter] = useState('month');

  // Aggregate all BoxBuyers data with buyer name
  const shippedData = useMemo(() => {
    if (!allBoxBuyers) return [];
    return Object.values(allBoxBuyers).flatMap((buyer) =>
      buyer.Shipped
        ? Object.values(buyer.Shipped).map((item) => ({ ...item, userName: buyer.name || 'Unknown' }))
        : []
    );
  }, [allBoxBuyers]);

  const paymentsData = useMemo(() => {
    if (!allBoxBuyers) return [];
    return Object.values(allBoxBuyers).flatMap((buyer) =>
      buyer.Payments
        ? Object.values(buyer.Payments).map((item) => ({ ...item, userName: buyer.name || 'Unknown' }))
        : []
    );
  }, [allBoxBuyers]);

  const orderedData = useMemo(() => {
    if (!allBoxBuyers) return [];
    return Object.values(allBoxBuyers).flatMap((buyer) =>
      buyer.Ordered
        ? Object.values(buyer.Ordered).map((item) => ({ ...item, userName: buyer.name || 'Unknown' }))
        : []
    );
  }, [allBoxBuyers]);


const filterByDate = (data) => {
  if (!data) return [];

  const { type, from, to } = activeFilterRange || {};
  if (from && to) {
    const fromTs = new Date(from).getTime();
    const toTs = new Date(to).getTime();
    return data.filter(item => {
      const ts = new Date(item.timestamp).getTime();
      return ts >= fromTs && ts <= toTs;
    });
  }

  const now = new Date();

  switch (type) {
    case 'day':
      return data.filter(item => new Date(item.timestamp).toDateString() === now.toDateString());
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return data.filter(item => {
        const d = new Date(item.timestamp);
        return d >= weekStart && d <= weekEnd;
      });
    case 'month':
      return data.filter(item => new Date(item.timestamp).getMonth() === now.getMonth() && new Date(item.timestamp).getFullYear() === now.getFullYear());
    case 'year':
      return data.filter(item => new Date(item.timestamp).getFullYear() === now.getFullYear());
    case 'all':
    default:
      return data;
  }
};




const filteredShipped = useMemo(() => filterByDate(shippedData), [shippedData, activeFilterRange]);
const filteredPayments = useMemo(() => filterByDate(paymentsData), [paymentsData, activeFilterRange]);
const filteredOrdered = useMemo(() => filterByDate(orderedData), [orderedData, activeFilterRange]);


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

  // Optional: Aggregate addEntry logic can be implemented if needed (currently disabled)

  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>


      <DateFilter
        filters={['day', 'week', 'month', 'year', 'all']}
        dataSets={[
          { name: 'ordered', data: filteredOrdered, dateKey: 'timestamp' },
          { name: 'shipped', data: filteredShipped, dateKey: 'timestamp' },
          { name: 'payments', data: filteredPayments, dateKey: 'timestamp' },
        ]}
        onSelect={(selectedFilter, filtered, range) => {
          setActiveFilterRange(range ?? { type: selectedFilter, from: null, to: null });
          setFilter(selectedFilter);
        }}
      />
      <TabSwitch tabs={['Analytics', 'History']} activeTab={currentSubTab} onChange={setCurrentSubTab} />
      <TabSwitch tabs={['shipped', 'payments', 'ordered']} activeTab={currentTab} onChange={setCurrentTab} />

      <FlatList
        data={dataToShow}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) =>
          currentSubTab === 'History' && (
            <ListCardItem
              item={item}
              activeTab={currentTab == 'payments' ? 'Payments' : currentTab} // like "Ordered" / "Payments" / "History"
              type="BoxBuyer"
            />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}
