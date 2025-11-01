import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { GLOBAL_STYLES, COLORS } from '../theme/theme';
import ListItemWithAvatar from '../components/ListItemWithAvatar';
import { useSelector } from 'react-redux';
import { selectMillDataByType } from '../src/redux/slices/millSlice';
import TabSwitch from './../components/TabSwitch';
import BoxMakerAnalytics from './BoxMakers/BoxMakerAnalytics';
import BoxBuyersAnalytics from './BoxBuyers/BoxBuyersAnalytics';
import TransportersAnalytics from './Transporters/TransportersAnalytics';
import WorkerAnalytics from './Workers/WorkersAnalytics';
import WoodCutterAnalytics from './WoodCutter/WoodCutterAnalytics';
import OtherExpensesAnalytics from './OtherExpenses/OtherExpensesAnalytics';
import OtherIcomeAnalytics from './OtherIncome/OtherIncomeAnalytics';

export default function ListScreen({ route, navigation }) {
  const { name, dataType, detailScreen } = route.params;
  const [activeTab, setActiveTab] = useState('list');
  
  const dataByType = useSelector((state) =>
    selectMillDataByType(state, dataType)
  );
  const { millKey, loading, error } = useSelector((state) => state.mill);

  const [searchText, setSearchText] = useState('');

  // Convert object to array for FlatList
  const listData = useMemo(() => {
    if (!dataByType || typeof dataByType !== 'object') return [];
    return Object.keys(dataByType).map((itemKey) => ({
      ...dataByType[itemKey],
      itemKey,
    }));
  }, [dataByType]);

  // Filter listData based on search text
  const filteredData = useMemo(() => {
    if (!searchText.trim()) return listData;
    return listData.filter((item) =>
      item.name?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, listData]);

  // Handle item press
  const handleItemPress = (item) => {
    if (detailScreen) {
      navigation.navigate(detailScreen, {
        millKey,
        itemKey: item.itemKey,
        data: item,
      });
    }
  };

  // Empty or Loading states
  const renderEmptyState = () => {
    if (loading)
      return (
        <Text style={{ textAlign: 'center', color: COLORS.text, marginTop: 20 }}>
          Loading...
        </Text>
      );
    if (error)
      return (
        <Text style={{ textAlign: 'center', color: 'red', marginTop: 20 }}>
          {error}
        </Text>
      );
    return (
      <Text style={{ textAlign: 'center', color: COLORS.text, marginTop: 20 }}>
        No records found.
      </Text>
    );
  };

  // Lazy mount analytics tab only when first opened
  const [analyticsMounted, setAnalyticsMounted] = useState(false);
  useEffect(() => {
    if (activeTab === 'Analytics') setAnalyticsMounted(true);
  }, [activeTab]);

  return (
    <View style={GLOBAL_STYLES.container}>
      {/* Header */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>{name}</Text>
      </View>

      {/* Tab Switch */}
      <TabSwitch tabs={['list','Analytics']} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tabs content */}
      <View style={{ flex: 1 }}>
        {/* List Tab */}
        <View style={{ display: activeTab === 'list' ? 'flex' : 'none', flex: 1 }}>
          {/* Search Bar */}
          <View style={GLOBAL_STYLES.searchContainer}>
            <TextInput
              placeholder="Search..."
              placeholderTextColor={COLORS.border}
              style={GLOBAL_STYLES.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* List */}
          {filteredData.length > 0 ? (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.itemKey}
              contentContainerStyle={{ padding: 10 }}
              renderItem={({ item }) => (
                <Pressable onPress={() => handleItemPress(item)}>
                  <ListItemWithAvatar item={item} />
                </Pressable>
              )}
            />
          ) : (
            renderEmptyState()
          )}
        </View>

        {/* Analytics Tab */}
        {analyticsMounted && (
          <View style={{ display: activeTab === 'Analytics' ? 'flex' : 'none', flex: 1 }}>
            {detailScreen === "BoxMakerDetail" && <BoxMakerAnalytics />}
            {detailScreen === "BoxBuyerDetails" && <BoxBuyersAnalytics />}
            {detailScreen === "TransporterDetail" && <TransportersAnalytics />}
            {detailScreen === "WorkerDetail" && <WorkerAnalytics />}
            {detailScreen === "WoodCutterDetail" && <WoodCutterAnalytics />}
            {detailScreen === "OtherExpenses" && <OtherExpensesAnalytics />}
            {detailScreen === "OtherIncome" && <OtherIcomeAnalytics />}
          </View>
        )}
      </View>
    </View>
  );
}
