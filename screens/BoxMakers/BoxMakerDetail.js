// screens/BoxMakers/BoxMakerDetail.js
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
  Alert, ScrollView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import TabSwitch from '../../components/TabSwitch';
import DateFilter from '../../components/Datefilter';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import ListCardItem from '../../components/ListCardItem';

const screenWidth = Dimensions.get('window').width;

export default function BoxMakerDetail({ route }) {
  const { itemKey } = route.params;
  const dispatch = useDispatch();

  const millKey = useSelector((state) => state.mill.millKey);
  const itemData = useSelector((state) =>
    selectMillItemData(state, millKey, 'BoxMakers', itemKey)
  );

  const [activeTab, setActiveTab] = useState('Work');
  const [activeSubTab, setActiveSubTab] = useState('Analytics');
  const [type, setType] = useState('full');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [activeFilter, setActiveFilter] = useState({ type: 'month', from: null, to: null });
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false); // <-- new state for edit mode
  const [editKey, setEditKey] = useState(null); // <-- to hold firebase key

  const colors = { full: '#cd4009ff', half: '#FF9800', side: '#933e05ff', payment: '#2196F3' };

  // ----------------- Subscribe -----------------
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'BoxMakers'));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'BoxMakers'));
    };
  }, [millKey]);

  const savedWork = itemData?.Data ? Object.entries(itemData.Data).map(([id, obj]) => ({ id, ...obj })) : [];
  const savedPayments = itemData?.Payments ? Object.entries(itemData.Payments).map(([id, obj]) => ({ id, ...obj })) : [];

  // ----------------- Filter -----------------
  const filteredResults = useMemo(() => {
    const { from, to } = activeFilter;
    const filterByDate = (list) =>
      from && to
        ? list.filter((item) => {
          const d = new Date(item.timestamp);
          return d >= from && d <= to;
        })
        : list;

    return {
      work: filterByDate(savedWork),
      payments: filterByDate(savedPayments),
    };
  }, [savedWork, savedPayments, activeFilter]);

  const currentData = activeTab === 'Work' ? filteredResults.work : filteredResults.payments;

  // ----------------- Totals -----------------
  const totals = useMemo(() => {
    let full = 0,
      half = 0,
      side = 0,
      fullEarning = 0,
      halfEarning = 0,
      sideEarning = 0,
      totalEarning = 0;

    filteredResults.work.forEach((item) => {
      const amt = parseInt(item.amount || 0);
      if (item.type === 'full') {
        full += amt;
        const earn = amt * Number(itemData?.salaryFullBox || 0);
        fullEarning += earn;
        totalEarning += earn;
      }
      if (item.type === 'half') {
        half += amt;
        const earn = amt * Number(itemData?.salaryHalfBox || 0);
        halfEarning += earn;
        totalEarning += earn;
      }
      if (item.type === 'side') {
        side += amt;
        const earn = amt * Number(itemData?.salaryOneSide || 0);
        sideEarning += earn;
        totalEarning += earn;
      }
    });

    const payment = filteredResults.payments.reduce(
      (sum, item) => sum + parseInt(item.amount || 0),
      0
    );

    return {
      work: { full, half, side, fullEarning, halfEarning, sideEarning, totalEarning },
      payments: { payment },
    };
  }, [filteredResults, itemData]);

  const currentTotals = activeTab === 'Work' ? totals.work : totals.payments;

  // ----------------- Pie Chart -----------------
  const pieData = useMemo(() => {
    if (activeTab === 'Work') {
      return [
        { name: 'Full', amount: currentTotals.full, color: COLORS.kpibase },
        { name: 'Half', amount: currentTotals.half, color: COLORS.kpiextra },
        { name: 'Side', amount: currentTotals.side, color: COLORS.kpitotal },
      ];
    } else {
      return [
        { name: 'Earned', amount: totals.work.totalEarning, color: COLORS.kpitotal },
        { name: 'Paid', amount: currentTotals.payment, color: COLORS.kpitotalpaid },
        {
          name: totals.work.totalEarning - currentTotals.payment > 0 ? 'Balance' : 'Advance',
          amount: Math.abs(totals.work.totalEarning - currentTotals.payment),
          color: COLORS.kpitopay,
        },
      ];
    }
  }, [currentTotals, totals, activeTab]);

  // ----------------- Add / Update Data -----------------
  const handleSave = async () => {
    if (!amount) return alert('Enter amount');

    const now = Date.now();
    const data =
      activeTab === 'Work'
        ? {
          type,
          amount: parseFloat(amount),
          earned:
            type === 'full'
              ? itemData.salaryFullBox * parseFloat(amount)
              : type === 'half'
                ? itemData.salaryHalfBox * parseFloat(amount)
                : itemData.salaryOneSide * parseFloat(amount),
          createdDate: editMode ? selectedItem.createdDate : now,
          timestamp: now,
        }
        : {
          type: 'payment',
          amount: parseFloat(amount),
          note,
          createdDate: editMode ? selectedItem.createdDate : now,
          timestamp: now,
        };

    dispatch(
      addEntityData({
        millKey,
        entityType: 'BoxMakers',
        entityKey: itemKey,
        entryType: activeTab === 'Work' ? 'Data' : 'Payments',
        data,
        dataKey: editMode ? editKey : undefined, // pass existing key for update
      })
    );

    setAmount('');
    setNote('');
    setEditMode(false);
    setEditKey(null);
    setInputModalVisible(false);
  };

  // ----------------- Handle Edit -----------------
  const handleEdit = (item) => {
    setEditMode(true);
    setEditKey(item.id);
    setSelectedItem(item);
    setAmount(String(item.amount));
    if (activeTab === 'Payments') setNote(item.note || '');
    if (activeTab === 'Work') setType(item.type);
    setInputModalVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={GLOBAL_STYLES.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>{itemData?.name || 'Box Maker Detail'}</Text>
        <TouchableOpacity
          onPress={() => {
            setEditMode(false);
            setAmount('');
            setNote('');
            setInputModalVisible(true);
          }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <DateFilter
        dataSets={[
          { name: 'work', data: savedWork, dateKey: 'timestamp' },
          { name: 'payments', data: savedPayments, dateKey: 'timestamp' },
        ]}
        onSelect={(filter, results, range) => setActiveFilter(range)}
      />

      <TabSwitch tabs={['Work', 'Payments']} activeTab={activeTab} onChange={setActiveTab} />
      <TabSwitch tabs={['Analytics', 'History']} activeTab={activeSubTab} onChange={setActiveSubTab} />

      {activeSubTab !== 'History' ? (
        <>
          {activeTab === 'Work' ? (
            <KpiAnimatedCard
              title="Work Overview"
              kpis={[
                { label: 'Full Box', value: currentTotals.full || 0, icon: 'cash', gradient: [COLORS.kpibase, COLORS.kpibaseg],isPayment:0 },
                { label: 'Half Box', value: currentTotals.half || 0, icon: 'plus-circle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] ,isPayment:0},
                { label: 'One Side', value: currentTotals.side || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] ,isPayment:0},
              ]}
            />
          ) : (<ScrollView>
            <KpiAnimatedCard
              title="Earnings Overview"
              kpis={[
                { label: 'FullBox', value: totals.work.fullEarning || 0, icon: 'cube', gradient: [COLORS.kpibase, COLORS.kpibaseg] },
                 { label: 'HalfBox', value: totals.work.halfEarning || 0, icon: 'square', gradient: [COLORS.kpibase, COLORS.kpibaseg] },
                { label: 'Onesided', value: totals.work.sideEarning || 0, icon: 'rectangle', gradient: [COLORS.kpiextra, COLORS.kpiextrag] },
                { label: 'Total', value: totals.work.totalEarning || 0, icon: 'wallet', gradient: [COLORS.kpitotal, COLORS.kpitotalg] },
                {
                  label: totals.work.totalEarning - totals.payments.payment > 0 ? 'To Pay' : 'Advance',
                  value: Math.abs(totals.work.totalEarning - totals.payments.payment) || 0,
                  icon: 'cash-remove',
                  gradient: [COLORS.kpitopay, COLORS.kpitopayg],
                },
              ]}
              progressData={{
                label: 'Total Paid',
                value: totals.payments.payment || 0,
                total: totals.work.totalEarning || 0,
                icon: 'check-decagram',
                gradient: [COLORS.kpitotalpaid, COLORS.kpitotalpaidg],
              }}
            />
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <PieChart
                data={pieData.map((d) => ({
                  name: `${d.name}`,
                  population: d.amount,
                  color: d.color,
                  legendFontColor: COLORS.text,
                  legendFontSize: 12,
                }))}
                width={screenWidth - 20}
                height={200}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
              />
            </View>
          </ScrollView>

          )}


        </>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (

            <ListCardItem
              item={item}
              activeTab={activeTab}
              onPress={() => {
                setSelectedItem(item);
                setModalVisible(true);
              }}
              onLongPress={() => handleEdit(item)}
              type="BoxWork"
            />
          )}
        />
      )}



      {/* Input Modal */}
      <Modal transparent visible={inputModalVisible} animationType="slide">
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={[GLOBAL_STYLES.modalBox, { padding: 20 }]}>
            <Text style={GLOBAL_STYLES.modalTitle}>{editMode ? 'Update Entry' : `Add ${activeTab}`}</Text>

            {activeTab === 'Work' && (
              <TabSwitch tabs={['full', 'half', 'side']} activeTab={type} onChange={setType} />
            )}

            {activeTab === 'Payments' && (
              <TextInput
                style={[GLOBAL_STYLES.input, { marginVertical: 10 }]}
                placeholder="Note"
                value={note}
                onChangeText={setNote}
              />
            )}

            <TextInput
              style={[GLOBAL_STYLES.input, { marginTop: 10 }]}
              placeholder="Amount"
              value={amount}
              keyboardType="numeric"
              onChangeText={setAmount}
            />

            <View style={GLOBAL_STYLES.row}>
              <TouchableOpacity
                style={[GLOBAL_STYLES.cancelbutton, { width: '40%', marginTop: 15 }]}
                onPress={() => setInputModalVisible(false)}
              >
                <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GLOBAL_STYLES.button, { width: '40%', marginTop: 15 }]}
                onPress={handleSave}
              >
                <Text style={GLOBAL_STYLES.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
