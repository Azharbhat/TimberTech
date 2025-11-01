import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import DateFilter from '../../components/Datefilter';
import TabSwitch from '../../components/TabSwitch';
import { subscribeEntity, stopSubscribeEntity, selectMillItemData } from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import ListCardItem from '../../components/ListCardItem';
const screenWidth = Dimensions.get('window').width;


export default function BoxMakerAnalytics() {
  const dispatch = useDispatch();
  const millKey = useSelector(state => state.mill.millKey);

  const boxMakersData = useSelector(state =>
    selectMillItemData(state, millKey, 'BoxMakers')
  );

  const [activeTab, setActiveTab] = useState('Work'); // Work or Payments
  const [activeSubTab, setActiveSubTab] = useState('Analytics'); // Analytics or History
  const [activeFilter, setActiveFilter] = useState({ type: 'month', from: null, to: null });

  const colors = { full: '#cd4009ff', half: '#FF9800', side: '#933e05ff', payment: '#2196F3' };

  // Subscribe to BoxMakers
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'BoxMakers'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'BoxMakers'));
    };
  }, [millKey]);

  // Collect all work and payment data
  const allWork = useMemo(() => {
    if (!boxMakersData) return [];
    return Object.values(boxMakersData)
      .filter(user => user?.Data)
      .flatMap(user =>
        Object.values(user.Data).map(entry => ({
          ...entry,
          userName: user.name || 'Unknown',
        }))
      );
  }, [boxMakersData]);

  const allPayments = useMemo(() => {
    if (!boxMakersData) return [];
    return Object.values(boxMakersData)
      .filter(user => user?.Payments)
      .flatMap(user =>
        Object.values(user.Payments).map(entry => ({
          ...entry,
          userName: user.name || 'Unknown',
        }))
      );
  }, [boxMakersData]);

  // Filter by date
  const filteredResults = useMemo(() => {
    const { from, to } = activeFilter;
    const filterByDate = list =>
      from && to
        ? list.filter(item => {
          const d = new Date(item.timestamp);
          return d >= from && d <= to;
        })
        : list;

    return {
      work: filterByDate(allWork),
      payments: filterByDate(allPayments),
    };
  }, [allWork, allPayments, activeFilter]);

  const currentData = activeTab === 'Work' ? filteredResults.work : filteredResults.payments;

  // Calculate totals
const totals = useMemo(() => {
  let full = 0, half = 0, side = 0;
  let fullEarning = 0, halfEarning = 0, sideEarning = 0;
  let totalEarning = 0;

  filteredResults.work.forEach(item => {
    const amt = parseFloat(item.amount || 0);
    const earned = parseFloat(item.earned || 0);

    if (item.type === 'full') {
      full += amt;
      fullEarning += earned;
    } else if (item.type === 'half') {
      half += amt;
      halfEarning += earned;
    } else if (item.type === 'side') {
      side += amt;
      sideEarning += earned;
    }

    totalEarning += earned;
  });

  const totalPaid = filteredResults.payments.reduce(
    (sum, item) => sum + parseFloat(item.amount || 0),
    0
  );

  return {
    // Amount totals
    full,
    half,
    side,

    // Earning totals
    fullEarning,
    halfEarning,
    sideEarning,

    // Overall
    totalEarning,
    totalPaid,
    balance: totalEarning - totalPaid,
  };
}, [filteredResults]);


  // Pie Chart Data
  const pieData = useMemo(() => {
    if (activeTab === 'Work') {
      return [
        { name: 'Full', amount: totals.full, color: COLORS.kpibase, legendFontColor: COLORS.text, legendFontSize: 12 },
        { name: 'Half', amount: totals.half, color: COLORS.kpiextra, legendFontColor: COLORS.text, legendFontSize: 12 },
        { name: 'Side', amount: totals.side, color: COLORS.kpitotal, legendFontColor: COLORS.text, legendFontSize: 12 },
      ].filter(d => d.amount > 0);
    } else {
      return [
        { name: 'Earned', amount: totals.totalEarning, color: COLORS.kpitotal, legendFontColor: COLORS.text, legendFontSize: 12 },
        { name: 'Paid', amount: totals.totalPaid, color: COLORS.kpitotalpaid, legendFontColor: COLORS.text, legendFontSize: 12 },
        {
          name: totals.balance >= 0 ? 'Balance' : 'Advance',
          amount: Math.abs(totals.balance),
          color: COLORS.kpitopay,
          legendFontColor: COLORS.text,
          legendFontSize: 12,
        },
      ].filter(d => d.amount > 0);
    }
  }, [totals, activeTab]);

  // Line Chart Data with dynamic aggregation
  const lineChartData = useMemo(() => {
    if (!filteredResults.work.length) return { labels: [], datasets: [], legend: [] };

    const groupByLabel = (date) => {
      const d = new Date(date);
      switch (activeFilter.type) {
        case 'day': return `${d.getHours()}:00`;
        case 'week': return d.toLocaleDateString();
        case 'month': return `Week ${Math.ceil(d.getDate() / 7)}-${d.getMonth() + 1}`;
        case 'year': return `${d.getMonth() + 1}-${d.getFullYear()}`;
        case 'all':
        default: return `${d.getFullYear()}`;
      }
    };

    const sums = { full: {}, half: {}, side: {} };
    const labelsSet = new Set();

    filteredResults.work.forEach(item => {
      const label = groupByLabel(item.timestamp);
      labelsSet.add(label);
      sums.full[label] = sums.full[label] || 0;
      sums.half[label] = sums.half[label] || 0;
      sums.side[label] = sums.side[label] || 0;

      if (item.type === 'full') sums.full[label] += parseFloat(item.amount || 0);
      if (item.type === 'half') sums.half[label] += parseFloat(item.amount || 0);
      if (item.type === 'side') sums.side[label] += parseFloat(item.amount || 0);
    });

    let labels = Array.from(labelsSet).sort((a, b) => {
      const parseLabel = l => {
        if (activeFilter.type === 'day') return new Date(`1970-01-01T${l}`);
        if (activeFilter.type === 'week') return new Date(l);
        if (activeFilter.type === 'month') {
          const [week, month] = l.match(/\d+/g);
          return new Date(new Date().getFullYear(), month - 1, week * 7);
        }
        if (activeFilter.type === 'year') {
          const [month, year] = l.split('-').map(Number);
          return new Date(year, month - 1, 1);
        }
        if (activeFilter.type === 'all') return new Date(`01-01-${l}`);
        return new Date(l);
      };
      return parseLabel(a) - parseLabel(b);
    });

    // Reduce label clutter
    const maxLabels = 7;
    if (labels.length > maxLabels) {
      const step = Math.ceil(labels.length / maxLabels);
      labels = labels.filter((_, index) => index % step === 0);
    }

    return {
      labels,
      datasets: [
        { data: labels.map(l => sums.full[l] || 0), color: () => COLORS.kpibase, strokeWidth: 2 },
        { data: labels.map(l => sums.half[l] || 0), color: () => COLORS.kpiextra, strokeWidth: 2 },
        { data: labels.map(l => sums.side[l] || 0), color: () => COLORS.kpitotal, strokeWidth: 2 },
      ],
      legend: ['Full', 'Half', 'Side'],
    };
  }, [filteredResults.work, activeFilter.type]);

  return (
    <ScrollView>
      <DateFilter
        dataSets={[
          { name: 'work', data: allWork, dateKey: 'timestamp' },
          { name: 'payments', data: allPayments, dateKey: 'timestamp' },
        ]}
        onSelect={(filter, results, range) => setActiveFilter(range)}
      />

      <TabSwitch tabs={['Work', 'Payments']} activeTab={activeTab} onChange={setActiveTab} />
      <TabSwitch tabs={['Analytics', 'History']} activeTab={activeSubTab} onChange={setActiveSubTab} />

      {activeSubTab === 'Analytics' && (
        <>
          {/* KPI Row */}
          {activeTab === 'Work' ? (
            <>
              <KpiAnimatedCard
                title="Work Overview"
                kpis={[
                  { label: 'Full Box', value: totals.full || 0, icon: 'cash', gradient: [COLORS.kpibase, COLORS.kpibaseg], isPayment: 0 },
                  { label: 'Half Box', value: totals.half || 0, icon: 'plus-circle', gradient: [COLORS.kpiextra, COLORS.kpiextrag], isPayment: 0 },
                  { label: 'One Side', value: totals.side || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg], isPayment: 0 },
                ]}
                progressData={null}

              />
            </>
          ) : (
            <>
              <KpiAnimatedCard
                title="Earnings Overview"
                kpis={[
                  { label: 'FullBox', value: totals.fullEarning || 0, icon: 'cube', gradient: [COLORS.kpibase, COLORS.kpibaseg] },
                  { label: 'HalfBox', value: totals.halfEarning || 0, icon: 'rectangle', gradient:  [COLORS.kpibase, COLORS.kpibaseg]},
                  { label: 'OneSided', value: totals.sideEarning || 0, icon: 'square', gradient:[COLORS.kpiextra, COLORS.kpiextrag]  },
                  { label: 'Total', value: totals.totalEarning || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
                  { label: totals.totalEarning - totals.totalPaid > 0 ? 'To Pay' : 'Advance', value: Math.abs(totals.totalEarning - totals.totalPaid) || 0, icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
                ]}
                progressData={{
                  label: 'Total Paid',
                  value: totals.totalPaid || 0,
                  total: totals.totalEarning || 0,
                  icon: 'check-decagram',
                  gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
                }}
              />
            </>
          )}


          {/* Pie Chart */}
          <Text style={[GLOBAL_STYLES.kpiLabel, { textAlign: 'center', marginBottom: 10 }]}>
            {activeTab === 'Work' ? 'Box Distribution' : 'Payment History'}
          </Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData.map(d => ({
                name: d.name,
                population: d.amount,
                color: d.color,
                legendFontColor: d.legendFontColor,
                legendFontSize: d.legendFontSize,
              }))}
              width={screenWidth - 20}
              height={200}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
            />
          ) : (
            <Text style={{ textAlign: 'center', marginVertical: 20 }}>No data to display</Text>
          )}

          {/* Line Chart */}
          {activeTab === 'Work' && (
            <>
              <Text style={[GLOBAL_STYLES.kpiLabel, { textAlign: 'center', marginVertical: 10 }]}>
                Box Production Trend
              </Text>
              {lineChartData.datasets.length > 0 ? (
                <LineChart
                  data={lineChartData}
                  width={screenWidth}
                  height={250}
                  chartConfig={{
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    color: (opacity = 1) => `rgba(139,69,19,${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    strokeWidth: 2,
                    propsForDots: { r: '3', strokeWidth: '1', stroke: '#fff' },
                  }}
                  bezier
                  style={{ borderRadius: 10 }}
                />
              ) : (
                <Text style={{ textAlign: 'center', marginVertical: 20 }}>No trend data available</Text>
              )}
            </>
          )}
        </>
      )}

      {/* History */}
      {activeSubTab === 'History' && (
        <>
          {currentData.map((item, index) => (
            <ListCardItem
              key={item?.id || item?.timestamp || index} // ✅ added key prop
              item={item}
              activeTab={activeTab}
              type="BoxWork"
            />
          ))}

        </>
      )}
    </ScrollView>
  );
}
