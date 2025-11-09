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
import ListCardItem from '../../components/ListCardItem';

import { AntDesign, Feather, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
  updateEntityData
} from '../../src/redux/slices/millSlice';
import KpiAnimatedCard from '../../components/KpiAnimatedCard';
import DonutKpi from '../../components/Charts/DonutKpi';
const screenWidth = Dimensions.get('window').width;

export default function BoxBuyerDetail({ route }) {
  const [activeFilterRange, setActiveFilterRange] = useState({ type: 'month', from: null, to: null });
  const { itemKey, key } = route.params;
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState(false);
  const [editKey, setEditKey] = useState(null);
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

  const shippedData = itemData?.Shipped ? Object.values(itemData.Shipped) : [];
  const paymentsData = itemData?.Payments ? Object.values(itemData.Payments) : [];
  const orderedData = itemData?.Ordered ? Object.values(itemData.Ordered) : [];

  const filterByDate = (data) => {
    if (!data) return [];

    // If activeFilterRange has from & to, use it
    if (activeFilterRange?.from && activeFilterRange?.to) {
      const from = new Date(activeFilterRange.from).getTime();
      const to = new Date(activeFilterRange.to).getTime();
      return data.filter(item => {
        const ts = new Date(item.timestamp).getTime();
        return ts >= from && ts <= to;
      });
    }

    // Fallback to old filter by predefined type
    const now = new Date();
    switch (activeFilterRange.type) {
      case 'day':
        return data.filter(item =>
          new Date(item.timestamp).toDateString() === now.toDateString()
        );
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
        return data.filter(
          item =>
            new Date(item.timestamp).getMonth() === now.getMonth() &&
            new Date(item.timestamp).getFullYear() === now.getFullYear()
        );
      case 'year':
        return data.filter(
          item => new Date(item.timestamp).getFullYear() === now.getFullYear()
        );
      case 'all':
      default:
        return data;
    }
  };



  const filteredShipped = useMemo(() => [...filterByDate(shippedData)], [shippedData, filter]);
  const filteredPayments = useMemo(() => [...filterByDate(paymentsData)], [paymentsData, filter]);
  const filteredOrdered = useMemo(() => [...filterByDate(orderedData)], [orderedData, filter]);

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
  const handleEdit = (item) => {
    setEditMode(true);
    setEditKey(item.key);
    setModalVisible(true);

    if (currentTab === 'shipped') {
      setAmount({
        full: String(item.fullQuantity || ''),
        half: String(item.halfQuantity || ''),
        side: String(item.sideQuantity || ''),
      });
      const types = [];
      if (item.fullQuantity) types.push('full');
      if (item.halfQuantity) types.push('half');
      setBoxType(types);
    } else if (currentTab === 'payments') {
      setAmount({
        note: item.note || '',
        value: String(item.amount || ''),
      });
    } else if (currentTab === 'ordered') {
      setAmount({
        fullQty: String(item.fullQty || ''),
        halfQty: String(item.halfQty || ''),
        fullBoxPrice: String(item.fullBoxPrice || ''),
        halfBoxPrice: String(item.halfBoxPrice || ''),
        note: item.note || '',
      });
    }
  };
  const updateEntry = async () => {
    if (!editKey) {
      return alert('No entry selected for update');
    }

    let updatedEntry = {};

    if (currentTab === 'shipped') {
      if ((amount.full && amount.full !== '') || (amount.half && amount.half !== '')) {
        updatedEntry = {
          fullQuantity: Number(amount.full) || 0,
          halfQuantity: Number(amount.half) || 0,
          sideQuantity: Number(amount.side) || 0,
          updatedAt: Date.now(),
        };
      } else {
        return alert('Enter full or half quantity');
      }
    } else if (currentTab === 'payments') {
      if (!amount.value || !amount.note) {
        return alert('Enter amount and note');
      }
      updatedEntry = {
        amount: parseFloat(amount.value) || 0,
        note: amount.note,
        updatedAt: Date.now(),
      };
    } else if (currentTab === 'ordered') {
      const fullBoxPrice = parseFloat(amount.fullBoxPrice || 0);
      const halfBoxPrice = parseFloat(amount.halfBoxPrice || 0);
      const fullQty = parseFloat(amount.fullQty || 0);
      const halfQty = parseFloat(amount.halfQty || 0);
      const total = fullBoxPrice * fullQty + halfBoxPrice * halfQty;

      updatedEntry = {
        fullBoxPrice,
        halfBoxPrice,
        fullQty,
        halfQty,
        total,
        note: amount.note || '',
        updatedAt: Date.now(),
      };
    }

    dispatch(
      addEntityData({
        millKey,
        entityType: 'BoxBuyers',
        entityKey: itemKey,
        entryType:
          currentTab === 'shipped'
            ? 'Shipped'
            : currentTab === 'payments'
              ? 'Payments'
              : 'Ordered',
        data: updatedEntry,
        dataKey: editMode ? editKey : undefined, // ✅ crucial for updates
      })
    );

    // Reset UI
    setAmount({});
    setBoxType([]);
    setEditKey(null);
    setEditMode(false);
    setModalVisible(false);
  };

  return (
    <KeyboardAvoidingView style={GLOBAL_STYLES.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>{itemData?.name || 'Box Buyer Detail'}</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: '#fff', fontSize: 30 }}>+</Text>
        </TouchableOpacity>
      </View>

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
              onLongPress={() => handleEdit(item)}
              type="BoxBuyer"
            />
          )
        }
      />
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
                        paddingVertical: 10,
                        width: '47%',

                        paddingHorizontal: 20,
                        borderRadius: 10,
                        marginHorizontal: 5,
                      }}
                    >
                      <Text
                        style={{
                          color: boxType.includes(type) ? '#fff' : '#000',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          textTransform: 'capitalize',
                        }}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {boxType.includes('full') && (
                  <View style={GLOBAL_STYLES.inputRow}>
                    <View style={GLOBAL_STYLES.legendContainer}>
                      <Text style={GLOBAL_STYLES.legendText}>Full Quantity</Text>
                    </View>
                    <TextInput
                      placeholder="Enter quantity"
                      keyboardType="numeric"
                      value={String(amount.full || '')}
                      onChangeText={(text) => setAmount({ ...amount, full: text })}
                      style={GLOBAL_STYLES.input}
                    />
                    <MaterialIcons
                      name="inventory"
                      size={20}
                      color={COLORS.primary}
                      style={{ marginLeft: 8 }}
                    />
                  </View>

                )}
                {boxType.includes('half') && (

                  <View style={GLOBAL_STYLES.inputRow}>
                    <View style={GLOBAL_STYLES.legendContainer}>
                      <Text style={GLOBAL_STYLES.legendText}>Half Quantity</Text>
                    </View>
                    <TextInput
                      placeholder="Half Quantity"
                      keyboardType="numeric"
                      value={String(amount.half || '')}
                      onChangeText={(text) => setAmount({ ...amount, half: text })}
                      style={GLOBAL_STYLES.input}
                    />
                    <MaterialIcons
                      name="square"
                      size={20}
                      color={COLORS.primary}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                )}
              </>
            )}

            {currentTab === 'payments' && (
              <>
                <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Note</Text>
                  </View>
                  <TextInput
                    placeholder="Note"
                    value={amount.note}
                    onChangeText={(text) => setAmount({ ...amount, note: text })}
                    style={GLOBAL_STYLES.input}
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
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={String(amount.value || '')}
                    onChangeText={(text) => setAmount({ ...amount, value: text })}
                    style={GLOBAL_STYLES.input}
                  />
                  <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                </View>

              </>
            )}

            {currentTab === 'ordered' && (
              <>
                <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Full Box Qty</Text>
                  </View>
                  <TextInput
                    placeholder="Full Box Qty"
                    keyboardType="numeric"
                    value={String(amount.fullQty || '')}
                    onChangeText={(text) => setAmount({ ...amount, fullQty: text })}
                    style={GLOBAL_STYLES.input}
                  />
                  <MaterialCommunityIcons name="counter" size={20} color={COLORS.primary} />
                </View>
                <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Full Box Price</Text>
                  </View>
                  <TextInput
                    placeholder="Full Box Price"
                    keyboardType="numeric"
                    value={String(amount.fullBoxPrice || '')}
                    onChangeText={(text) => setAmount({ ...amount, fullBoxPrice: text })}
                    style={GLOBAL_STYLES.input}
                  />
                  <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                </View>

                <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Full Box Qty</Text>
                  </View>
                  <TextInput
                    placeholder="Half Box Qty"
                    keyboardType="numeric"
                    value={String(amount.halfQty || '')}
                    onChangeText={(text) => setAmount({ ...amount, halfQty: text })}
                    style={GLOBAL_STYLES.input}
                  />
                  <MaterialCommunityIcons name="counter" size={20} color={COLORS.primary} />
                </View>


                

                <View style={GLOBAL_STYLES.inputRow}>
                  <View style={GLOBAL_STYLES.legendContainer}>
                    <Text style={GLOBAL_STYLES.legendText}>Half Box Price</Text>
                  </View>
                  <TextInput
                    placeholder="Half Box Price"
                    keyboardType="numeric"
                    value={String(amount.halfBoxPrice || '')}
                    onChangeText={(text) => setAmount({ ...amount, halfBoxPrice: text })}
                    style={GLOBAL_STYLES.input}
                  />
                  <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.primary} />
                </View>

              </>
            )}

            <View style={GLOBAL_STYLES.row}>
              <TouchableOpacity style={[GLOBAL_STYLES.cancelbutton, { width: '40%', marginTop: 15 }]} onPress={() => { setModalVisible(false); setBoxType([]); setAmount({}); }}>
                <Text style={GLOBAL_STYLES.cancelbuttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GLOBAL_STYLES.button, { width: '40%', marginTop: 15 }]}
                onPress={editMode ? updateEntry : addEntry}
              >
                <Text style={GLOBAL_STYLES.buttonText}>{editMode ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
