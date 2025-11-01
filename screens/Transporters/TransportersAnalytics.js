import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { PieChart } from 'react-native-chart-kit';
import { useSelector } from 'react-redux';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';
import ListCardItem from '../../components/ListCardItem';
const screenWidth = Dimensions.get('window').width;

export default function TransportersAnalytics() {
    // Mill key from Redux
    const millKey = useSelector((state) => state?.mill?.millKey);

    // Tabs
    const [activeTab, setActiveTab] = useState('Shipped'); // Shipped / Payments
    const [activeSubTab, setActiveSubTab] = useState('Analytics'); // Analytics / History

    // Data
    const [transporters, setTransporters] = useState([]);
    const [savedShipped, setSavedShipped] = useState([]);
    const [savedPayments, setSavedPayments] = useState([]);

    // Filter
    const [activeFilterRange, setActiveFilterRange] = useState({ type: 'month', from: null, to: null });

    // Detail modal
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // ---------- Firebase listener ----------
    useEffect(() => {
        if (!millKey) return;

        const transportersRef = ref(database, `Mills/${millKey}/Transporters`);

        const handleTransporters = (snap) => {
            const val = snap.val() ?? {};
            const arr = Object.keys(val).map((k) => ({ id: k, ...val[k] }));
            setTransporters(arr);

            // Collect all Shipped and Payments
            const allShipped = [];
            const allPayments = [];
            arr.forEach((t) => {
                if (t?.Shipped) {
                    Object.keys(t.Shipped).forEach((sid) => {
                        allShipped.push({ id: sid, transporterId: t.id, userName: t.name ?? '', ...t.Shipped[sid] });
                    });
                }
                if (t?.Payments) {
                    Object.keys(t.Payments).forEach((pid) => {
                        allPayments.push({ id: pid, transporterId: t.id, userName: t.name ?? '', ...t.Payments[pid] });
                    });
                }
            });

            setSavedShipped(allShipped);
            setSavedPayments(allPayments);
        };

        const unsub = onValue(transportersRef, handleTransporters);
        return () => off(transportersRef);
    }, [millKey]);

    // ---------- Filter ----------
    const filteredResults = useMemo(() => {
        const results = { shipped: [], payments: [] };
        const from = activeFilterRange?.from;
        const to = activeFilterRange?.to;

        const safeFilter = (arr = []) => {
            if (!Array.isArray(arr)) return [];
            if (!from || !to) return arr;
            const fromD = from instanceof Date ? from : new Date(from);
            const toD = to instanceof Date ? to : new Date(to);
            return arr.filter((it) => {
                try {
                    const d = it?.timestamp ? new Date(it.timestamp) : null;
                    if (!d) return false;
                    return d >= fromD && d <= toD;
                } catch {
                    return false;
                }
            });
        };

        results.shipped = safeFilter(savedShipped);
        results.payments = safeFilter(savedPayments);
        return results;
    }, [savedShipped, savedPayments, activeFilterRange]);

    const currentData = activeTab === 'Shipped' ? filteredResults.shipped : filteredResults.payments;

    // ---------- Totals ----------
    const totals = useMemo(() => {
        const shippedArr = Array.isArray(filteredResults.shipped) ? filteredResults.shipped : [];
        const paymentsArr = Array.isArray(filteredResults.payments) ? filteredResults.payments : [];

        const totalShipped = shippedArr.length;
        const boxShippedCount = shippedArr.filter((d) => d?.shippingItem === 'Box').length;
        const logShippedCount = shippedArr.filter((d) => d?.shippingItem === 'Log').length;
        const otherShippedCount = shippedArr.filter((d) => d?.shippingItem === 'Other').length;

        let totalFullQty = 0;
        let totalHalfQty = 0;
        let boxEarning = 0;
        let logEarning = 0;
        let otherEarning = 0;
        let totalEarned = 0;

        shippedArr.forEach((d) => {
            const amt = Number(d?.shippingCost ?? d?.amount ?? 0) || 0;
            if (d?.shippingItem === 'Box') {
                boxEarning += amt;
                totalEarned += amt;
                totalFullQty += Number(d?.fullQuantity ?? 0) || 0;
                totalHalfQty += Number(d?.halfQuantity ?? 0) || 0;
            } else if (d?.shippingItem === 'Log') {
                logEarning += amt;
                totalEarned += amt;
            } else if (d?.shippingItem === 'Other') {
                otherEarning += amt;
                totalEarned += amt;
            }
        });

        let totalPaid = 0;
        const paymentModeMap = {};
        paymentsArr.forEach((p) => {
            const amt = Number(p?.amount ?? 0) || 0;
            totalPaid += amt;
            const mode = p?.mode ?? 'Unknown';
            if (!paymentModeMap[mode]) paymentModeMap[mode] = { sum: 0, count: 0 };
            paymentModeMap[mode].sum += amt;
            paymentModeMap[mode].count += 1;
        });

        const balance = totalEarned - totalPaid;

        return {
            shipped: {
                totalShipped,
                boxShippedCount,
                logShippedCount,
                otherShippedCount,
                totalFullQty,
                totalHalfQty,
                boxEarning,
                logEarning,
                otherEarning,
                totalEarned,
            },
            payments: {
                totalPaid,
                paymentModeMap,
                balance,
            },
        };
    }, [filteredResults]);

    // ---------- Pie Charts ----------
    const pieData = useMemo(() => {
        const s = totals?.shipped ?? {};
        const p = totals?.payments ?? {};
        if (activeTab === 'Shipped') {
            return [
                { name: 'Full Box', amount: s.totalFullQty ?? 0, color: '#cd4009ff', legendFontColor: COLORS.text, legendFontSize: 12 },
                { name: 'Half Box', amount: s.totalHalfQty ?? 0, color: '#FF9800', legendFontColor: COLORS.text, legendFontSize: 12 },
            ];
        } else {
            return [
                { name: 'Total Earned', amount: s.totalEarned ?? 0, color: '#cd4009ff', legendFontColor: COLORS.text, legendFontSize: 12 },
                { name: 'Total Paid', amount: p.totalPaid ?? 0, color: '#933e05ff', legendFontColor: COLORS.text, legendFontSize: 12 },
                { name: Number(s.totalEarned) - Number(p.totalPaid) > 0 ? 'Balance' : 'Advance', amount: Math.abs(Number(s.totalEarned) - Number(p.totalPaid)) ?? 0, color: '#FF9800', legendFontColor: COLORS.text, legendFontSize: 12 },
            ];
        }
    }, [totals, activeTab]);


    // ---------- Render Shipped / Payments item ----------
    const renderItem = ({ item }) => (
        <ListCardItem
            item={item}
            activeTab = {activeTab}
            type = 'Transporter'
        />
    );
    const renderKpis = () => {
        const s = totals?.shipped ?? {};
        const p = totals?.payments ?? {};
        if (activeTab === 'Shipped') {
            return (
                <>
                    <KpiAnimatedCard
                        title="Shipping Box Overview"
                        kpis={[
                            {
                                label: 'Full',
                                value: s.totalFullQty || 0,
                                icon: 'warehouse',        // Represents full stock/inventory
                                gradient: [COLORS.kpibase, COLORS.kpibaseg],
                                isPayment: 0
                            },
                            {
                                label: 'Half',
                                value: s.totalHalfQty || 0,
                                icon: 'cube-outline',     // Represents partial quantity
                                gradient: [COLORS.kpiextra, COLORS.kpiextrag],
                                isPayment: 0
                            },

                        ]}


                    />
                    <DonutKpi
                        data={[
                            { label: 'Full', value: s.totalFullQty || 0, color: COLORS.kpibase },
                            { label: 'Half', value: s.totalHalfQty || 0, color: COLORS.kpiextra },
                        ]}

                        showTotal={false}
                        isMoney={false}
                        label=""
                        labelPosition="right"
                    />
                    <KpiAnimatedCard
                        title="Shipping Overview"
                        kpis={[

                            {
                                label: 'Boxs',
                                value: s.boxShippedCount || 0,
                                icon: 'cube',              // Box icon
                                gradient: [COLORS.kpibase, COLORS.kpibaseg],
                                isPayment: 0
                            },
                            {
                                label: 'Logs',
                                value: s.logShippedCount || 0,
                                icon: 'nature',              // Logs icon
                                gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
                                isPayment: 0
                            },
                            {
                                label: 'Other',
                                value: s.otherShippedCount || 0,
                                icon: 'dots-horizontal',   // Generic "other" icon
                                gradient: [COLORS.kpiextra, COLORS.kpiextrag],
                                isPayment: 0
                            },
                            {
                                label: 'Total',
                                value: s.totalShipped || 0,
                                icon: 'calculator',               // Total/summary icon
                                gradient: [COLORS.kpitotal, COLORS.kpitotalg],
                                isPayment: 0
                            },
                        ]}


                    />

                    <DonutKpi
                        data={[
                            { label: 'Box', value: s.boxShippedCount || 0, color: COLORS.kpibase },
                            { label: 'Log', value: s.logShippedCount || 0, color: COLORS.kpitotalpaid },
                            { label: 'Other', value: s.otherShippedCount || 0, color: COLORS.kpiextra },
                        ]}

                        showTotal={false}
                        isMoney={false}
                        label=""
                        labelPosition="left"
                    />
                </>
            );
        } else {
            return (
                <>
                    <KpiAnimatedCard
                        title="Earnings Overview"
                        kpis={[
                            { label: 'Boxs', value: s.boxEarning || 0, icon: 'cash', gradient: [COLORS.kpibase, COLORS.kpibaseg] },
                            { label: 'Logs', value: s.logEarning || 0, icon: 'plus-circle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] },
                            { label: 'Other', value: s.otherEarning || 0, icon: 'plus-circle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] },
                            { label: 'Total', value: s.totalEarned || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
                            { label: p.balance > 0 ? 'To Pay' : 'Advance', value: Math.abs(p.balance) || 0, icon: 'cash-remove', gradient: [COLORS.kpitopay, COLORS.kpitopayg] },
                        ]}
                        progressData={{
                            label: 'Total Paid',
                            value: p.totalPaid || 0,
                            total: s.totalEarned || 0,
                            icon: 'check-decagram',
                            gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
                        }}
                    />
                    <DonutKpi
                        data={[
                            { label: 'Paid', value: p.totalPaid || 0, color: COLORS.kpitotalpaid },
                            { label: 'Total', value: s.totalEarned || 0, color: COLORS.kpitotalg },

                        ]}

                        showTotal={true}
                        isMoney={true}
                        label="Shipping"
                        labelPosition="left"
                    /></>
            );
        }
    };

    return (
        <View style={GLOBAL_STYLES.container}>
            <DateFilter filters={['day', 'week', 'month', 'year', 'all']} value={activeFilterRange} setValue={setActiveFilterRange} />
            <TabSwitch tabs={['Shipped', 'Payments']} activeTab={activeTab} onChange={setActiveTab} />
            <TabSwitch tabs={['Analytics', 'History']} activeTab={activeSubTab} onChange={setActiveSubTab} />


            {/* Analytics */}
            {activeSubTab === 'Analytics' ? (
                <ScrollView style={{ marginVertical: 10 }}>
                    {/* Pie Charts */}
                    {renderKpis()}

                </ScrollView>
            ) : (
                <FlatList
                    data={currentData.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No data found</Text>}
                />
            )}

            {/* Detail Modal */}
            <Modal visible={detailModalVisible} animationType="slide" transparent>
                <View style={GLOBAL_STYLES.modalOverlay}>
                    <View style={GLOBAL_STYLES.modalBox}>
                        <Text style={GLOBAL_STYLES.modalTitle}>Details</Text>
                        {selectedItem && (
                            <ScrollView>
                                {Object.keys(selectedItem).map((k) => (
                                    <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 }}>
                                        <Text style={{ fontWeight: 'bold' }}>{k}</Text>
                                        <Text>{JSON.stringify(selectedItem[k])}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                        <TouchableOpacity
                            onPress={() => setDetailModalVisible(false)}
                            style={GLOBAL_STYLES.modalCloseBtn}
                        >
                            <Text style={{ color: '#fd1717ff' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 0.5,
        borderColor: COLORS.border,
        justifyContent: 'space-between',
    },
    itemText: {
        flex: 1,
        textAlign: 'center',
    },
});
