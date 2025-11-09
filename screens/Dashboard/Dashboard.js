import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableWithoutFeedback, Animated } from 'react-native';
import DashboardHeader from './components/DashboardHeader';
import DateFilter from '../../components/Datefilter';
import ExpenseBarChart from './components/ExpenseBarChart';
import QuickActionsList from './components/QuickActionsList';
import DashboardMenu from './components/DashboardMenu';
import { COLORS } from '../../theme/theme';
import DonutKpi from '../../components/Charts/DonutKpi';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';
import { useSelector, useDispatch } from 'react-redux';
export default function Dashboard({ navigation }) {
  const dispatch = useDispatch();
  const { millData } = useSelector((state) => state.mill);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeScreen, setActiveScreen] = useState('Dashboard');
  const [filter, setFilter] = useState('all');
  const slideAnim = useRef(new Animated.Value(-260)).current;
  const [filterRange, setFilterRange] = useState({ start: null, end: null });

  const millKey = useSelector((state) => state.mill.millKey);
  const toggleMenu = () => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? -260 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setMenuVisible(!menuVisible));
  };
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey));
    };
  }, [millKey]);

  // ---------------------------------------
  // 🧭 Filter Utility — checks timestamp
  // ---------------------------------------
const isWithinFilter = (timestamp) => {
  if (!timestamp || !filterRange.from || !filterRange.to) return false;
  const date = timestamp instanceof Date ? timestamp : new Date(Number(timestamp));
  const start = filterRange.from;
  const end = filterRange.to;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
};

  // ---------------------------------------
  // 🧮 Compute Dashboard Data
  // ---------------------------------------
  const dashboardData = useMemo(() => {
    if (!millData) return null;

    // ------------------ SALES ------------------
    let BoxOrderTotal = 0, BoxOrderPaid = 0;
    let FlatLogsTotal = 0, FlatLogsPaid = 0;
    let OtherIncomeTotal = 0, OtherIncomePaid = 0;

    Object.values(millData.BoxBuyers || {}).forEach(buyer => {
      Object.values(buyer.Ordered || {}).forEach(order => {
        if (isWithinFilter(order.timestamp)) BoxOrderTotal += Number(order.total || 0);
      });
      Object.values(buyer.Payments || {}).forEach(payment => {
        if (isWithinFilter(payment.timestamp)) BoxOrderPaid += Number(payment.amount || 0);
      });
    });


    Object.values(millData.FlatLogCalculations || {}).forEach(group => {
      const calculations = group.Calculations || {};
      const payments = group.payments || {};

      Object.values(calculations).forEach(calc => {
        if (!calc || !calc.timestamp) return;

        // Add total if calculation timestamp is within range
        if (isWithinFilter(calc.timestamp)) {
          FlatLogsTotal += Number(calc.totalPrice || 0);
        }

        // Add payments linked to this group
        Object.values(payments).forEach(payment => {
          if (!payment.timestamp) return;
          if (isWithinFilter(payment.timestamp)) {
            FlatLogsPaid += Number(payment.amount || 0);
          }
        });
      });
    });


    Object.values(millData.OtherIncome || {}).forEach(group => {
      Object.values(group.Income || {}).forEach(entry => {
        if (isWithinFilter(entry.timestamp)) {
          OtherIncomeTotal += Number(entry.total || 0);
          OtherIncomePaid += Number(entry.initialPaid || 0);
        }
      });
      Object.values(group.Payments || {}).forEach(payment => {
        if (isWithinFilter(payment.timestamp)) OtherIncomePaid += Number(payment.amount || 0);
      });
    });

    const salesOverall = {
      total: BoxOrderTotal + FlatLogsTotal + OtherIncomeTotal,
      paid: BoxOrderPaid + FlatLogsPaid + OtherIncomePaid,
    };
    salesOverall.pending = salesOverall.total - salesOverall.paid;

    // ------------------ EXPENSES ------------------
    let WorkerTotal = 0, WorkerPaid = 0;
    let BoxMakerTotal = 0, BoxMakerPaid = 0;
    let TransportTotal = 0, TransportPaid = 0;
    let WoodCutterTotal = 0, WoodCutterPaid = 0;
    let LogsBuyedTotal = 0, LogsBuyedPaid = 0;
    let OtherExpTotal = 0, OtherExpPaid = 0;

    // Workers
    Object.values(millData.Workers || {}).forEach(worker => {
      Object.values(worker.Data || {}).forEach(entry => {
        if (isWithinFilter(entry.timestamp)) WorkerPaid += Number(entry.paid || entry.amount || 0);
      });
      Object.values(worker.Tips || {}).forEach(tip => {
        if (isWithinFilter(tip.timestamp)) WorkerTotal += Number(tip.amount || 0);
      });
      Object.values(worker.attendance || {}).forEach(att => {
        if (isWithinFilter(att.timestamp)) WorkerTotal += Number(att.earning || 0);
      });
    });

    // BoxMakers
    Object.values(millData.BoxMakers || {}).forEach(boxMaker => {
      Object.values(boxMaker.Data || {}).forEach(entry => {
        if (isWithinFilter(entry.timestamp)) BoxMakerTotal += Number(entry.earned || entry.amount || 0);
      });
      Object.values(boxMaker.Payments || {}).forEach(payment => {
        if (isWithinFilter(payment.timestamp)) BoxMakerPaid += Number(payment.amount || 0);
      });
    });

    // Transporters
    Object.values(millData.Transporters || {}).forEach(transporter => {
      Object.values(transporter.Shipped || {}).forEach(shipment => {
        if (isWithinFilter(shipment.timestamp)) TransportTotal += Number(shipment.shippingCost || 0);
      });
      Object.values(transporter.Payments || {}).forEach(payment => {
        if (isWithinFilter(payment.timestamp)) TransportPaid += Number(payment.amount || 0);
      });
    });

    // WoodCutters
    Object.values(millData.WoodCutter || {}).forEach(cutter => {
      Object.values(cutter.Data || {}).forEach(entry => {
        if (isWithinFilter(entry.timestamp)) WoodCutterTotal += Number(entry.totalPrice || 0);
      });
      Object.values(cutter.Payments || {}).forEach(payment => {
        if (isWithinFilter(payment.timestamp)) WoodCutterPaid += Number(payment.amount || 0);
      });
    });

    Object.values(millData.LogCalculations || {}).forEach(group => {
      const calculations = group.Calculations || {};
      const payments = group.payments || {};

      Object.values(calculations).forEach(calc => {
        if (!calc || !calc.timestamp) return;

        // Add buyedPrice if calculation is within range
        if (isWithinFilter(calc.timestamp)) {
          LogsBuyedTotal += Number(calc.buyedPrice || 0);
          LogsBuyedPaid += Number(calc.payedPrice || 0); // top-level paid amount
        }

        // Sum all related payments (if any)
        Object.values(payments).forEach(payment => {
          if (!payment.timestamp) return;
          if (isWithinFilter(payment.timestamp)) {
            LogsBuyedPaid += Number(payment.amount || 0);
          }
        });
      });
    });


    // OtherExpenses
    Object.values(millData.OtherExpenses || {}).forEach(expense => {
      Object.values(expense.Expense || {}).forEach(entry => {
        if (isWithinFilter(entry.timestamp)) {
          OtherExpTotal += Number(entry.total || 0);
          OtherExpPaid += Number(entry.initialPaid || 0);
        }
      });
      Object.values(expense.Payments || {}).forEach(payment => {
        if (isWithinFilter(payment.timestamp)) OtherExpPaid += Number(payment.amount || 0);
      });
    });

    const totalExp = WorkerTotal + BoxMakerTotal + TransportTotal + WoodCutterTotal + LogsBuyedTotal + OtherExpTotal;
    const paidExp = WorkerPaid + BoxMakerPaid + TransportPaid + WoodCutterPaid + LogsBuyedPaid + OtherExpPaid;
    const pendingExp = totalExp - paidExp;

    const totalRevenue = salesOverall.total - totalExp;
    const paidRevenue = salesOverall.paid - paidExp;
    const pendingRevenue = salesOverall.pending - pendingExp;

    return {
      sales: {
        BoxOrders: { total: BoxOrderTotal, paid: BoxOrderPaid, pending: BoxOrderTotal - BoxOrderPaid },
        FlatLogs: { total: FlatLogsTotal, paid: FlatLogsPaid, pending: FlatLogsTotal - FlatLogsPaid },
        OtherIncome: { total: OtherIncomeTotal, paid: OtherIncomePaid, pending: OtherIncomeTotal - OtherIncomePaid },
        overall: salesOverall,
      },
      expenses: {
        Workers: { total: WorkerTotal, paid: WorkerPaid, pending: WorkerTotal - WorkerPaid },
        BoxMakers: { total: BoxMakerTotal, paid: BoxMakerPaid, pending: BoxMakerTotal - BoxMakerPaid },
        Transporters: { total: TransportTotal, paid: TransportPaid, pending: TransportTotal - TransportPaid },
        WoodCutters: { total: WoodCutterTotal, paid: WoodCutterPaid, pending: WoodCutterTotal - WoodCutterPaid },
        LogsBuyed: { total: LogsBuyedTotal, paid: LogsBuyedPaid, pending: LogsBuyedTotal - LogsBuyedPaid },
        OtherExpenses: { total: OtherExpTotal, paid: OtherExpPaid, pending: OtherExpTotal - OtherExpPaid },
        overall: { total: totalExp, paid: paidExp, pending: pendingExp },
      },
      revenue: { total: totalRevenue, paid: paidRevenue, pending: pendingRevenue },
    };
  }, [millData, filterRange]);

  // ---------------------------------------
  // 🧱 UI
  // ---------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8DC' }}>
      <DashboardHeader millName={millData?.millname || 'Mill Dashboard'} navigation={navigation} onMenuPress={toggleMenu} />

      <DateFilter
        filters={['day', 'week', 'month', 'year', 'all']}
        onSelect={(selectedFilter, results, range) => {
          // range should be an object like { start: Date, end: Date }
          setFilterRange(range);
        }}
      />


      <ScrollView  >
        <KpiAnimatedCard
          title={dashboardData?.revenue?.total < 0 ? "Loss" : "Revenue"}
          kpis={[
            { label: 'Total', value: Math.abs(dashboardData?.revenue?.total) || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
            { label: Math.abs(dashboardData?.revenue?.total) - Math.abs(dashboardData?.revenue?.paid) > 0 ? 'To Pay' : 'Advance', value: Math.abs(dashboardData?.revenue?.total) - Math.abs(dashboardData?.revenue?.paid) || 0, icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
          ]}
          progressData={{
            label: 'Total Paid',
            value: Math.abs(dashboardData?.revenue?.paid) || 0,
            total: Math.abs(dashboardData?.revenue?.total) || 0,
            icon: 'check-decagram',
            gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
          }}
        />
        <DonutKpi
          data={[
            { label: 'Paid', value: Math.abs(dashboardData?.revenue?.paid), color: '#4cd137' },
            { label: 'Remaining', value: Math.abs(dashboardData?.revenue?.pending), color: '#ff6a6a' },
          ]}
          showTotal={true}
          isMoney={true}
          labelPosition='right'
        />
        <QuickActionsList navigation={navigation} />
        <KpiAnimatedCard
          title="Sales"
          kpis={[
            { label: 'Total', value: Math.abs(dashboardData?.sales?.overall?.total) || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
            { label: Math.abs(dashboardData?.sales?.overall?.total) - Math.abs(dashboardData?.sales?.overall?.paid) > 0 ? 'To Pay' : 'Advance', value: Math.abs(dashboardData?.sales?.overall?.total) - Math.abs(dashboardData?.sales?.overall?.paid) || 0, icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
          ]}
          progressData={{
            label: 'Total Paid',
            value: Math.abs(dashboardData?.sales?.overall?.paid) || 0,
            total: Math.abs(dashboardData?.sales?.overall?.total) || 0,
            icon: 'check-decagram',
            gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
          }}
        />

        <ExpenseBarChart
          title="Sales by Category"
          labels={['Box Orders', 'Flat Logs', 'Other Income']}
          colors={[COLORS.kpitotalpaid, COLORS.kpitopay, COLORS.kpiextra]}
          dataSets={[
            [
              dashboardData?.sales?.BoxOrders?.paid || 0,
              dashboardData?.sales?.FlatLogs?.paid || 0,
              dashboardData?.sales?.OtherIncome?.paid || 0,
            ],
            [
              dashboardData?.sales?.BoxOrders?.pending || 0,
              dashboardData?.sales?.FlatLogs?.pending || 0,
              dashboardData?.sales?.OtherIncome?.pending || 0,
            ], [
              dashboardData?.sales?.BoxOrders?.total || 0,
              dashboardData?.sales?.FlatLogs?.total || 0,
              dashboardData?.sales?.OtherIncome?.total || 0,
            ],
          ]}
        />
        <KpiAnimatedCard
          title="Expenses"
          kpis={[
            { label: 'Total', value: Math.abs(dashboardData?.expenses?.overall?.total) || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
            { label: Math.abs(dashboardData?.expenses?.overall?.total) - Math.abs(dashboardData?.expenses?.overall?.paid) > 0 ? 'To Pay' : 'Advance', value: Math.abs(dashboardData?.expenses?.overall?.total) - Math.abs(dashboardData?.expenses?.overall?.paid) || 0, icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
          ]}
          progressData={{
            label: 'Total Paid',
            value: Math.abs(dashboardData?.expenses?.overall?.paid) || 0,
            total: Math.abs(dashboardData?.expenses?.overall?.total) || 0,
            icon: 'check-decagram',
            gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
          }}
        />
        <ExpenseBarChart
          title="Expenses by Category"
          labels={['Workers', 'Box Makers', 'Transporters', 'Wood Cutters', 'Logs Bought', 'Other Expenses']}
          colors={[COLORS.kpitotalpaid, COLORS.kpitopay, COLORS.kpiextra]}
          dataSets={[
            [
              dashboardData?.expenses?.Workers?.paid || 0,
              dashboardData?.expenses?.BoxMakers?.paid || 0,
              dashboardData?.expenses?.Transporters?.paid || 0,
              dashboardData?.expenses?.WoodCutters?.paid || 0,
              dashboardData?.expenses?.LogsBuyed?.paid || 0,
              dashboardData?.expenses?.OtherExpenses?.paid || 0,
            ], // Paid
            [
              dashboardData?.expenses?.Workers?.pending || 0,
              dashboardData?.expenses?.BoxMakers?.pending || 0,
              dashboardData?.expenses?.Transporters?.pending || 0,
              dashboardData?.expenses?.WoodCutters?.pending || 0,
              dashboardData?.expenses?.LogsBuyed?.pending || 0,
              dashboardData?.expenses?.OtherExpenses?.pending || 0,
            ], // Pending
            [
              dashboardData?.expenses?.Workers?.total || 0,
              dashboardData?.expenses?.BoxMakers?.total || 0,
              dashboardData?.expenses?.Transporters?.total || 0,
              dashboardData?.expenses?.WoodCutters?.total || 0,
              dashboardData?.expenses?.LogsBuyed?.total || 0,
              dashboardData?.expenses?.OtherExpenses?.total || 0,
            ], // Total (optional, or for "Other")
          ]}
        />
      </ScrollView>
      {menuVisible && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.2)' }} />
        </TouchableWithoutFeedback>
      )}

      <DashboardMenu
        slideAnim={slideAnim}
        toggleMenu={toggleMenu}
        activeScreen={activeScreen}
        navigation={navigation}
      />
    </View>
  );
}
