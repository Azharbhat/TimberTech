import React, { useState } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager,ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DashboardMenu({ slideAnim, toggleMenu, activeScreen, navigation }) {
  const [showCalcDropdown, setShowCalcDropdown] = useState(false);

  const salesItems = [
    { icon: 'account-box', label: 'Box Buyers', screen: 'ListScreen', params: { name: 'Box Buyers', dataType: 'BoxBuyers', detailScreen: 'BoxBuyerDetails' } },
    { icon: 'tree', label: 'Flat Logs', screen: 'FlatLogSaved' },
    { icon: 'cash-plus', label: 'Other Income', screen: 'ListScreen', params: { name: 'Other Income', dataType: 'OtherIncome', detailScreen: 'OtherIncome' } },
  ];

  const expenseItems = [
    { icon: 'account-group', label: 'Workers', screen: 'ListScreen', params: { name: 'Workers', dataType: 'Workers', detailScreen: 'WorkerDetail' } },
    { icon: 'hammer', label: 'Box Makers', screen: 'ListScreen', params: { name: 'Box Makers', dataType: 'BoxMakers', detailScreen: 'BoxMakerDetail' } },
    { icon: 'truck', label: 'Transporters', screen: 'ListScreen', params: { name: 'Transporters', dataType: 'Transporters', detailScreen: 'TransporterDetail' } },
    { icon: 'tree-outline', label: 'Wood Cutters', screen: 'ListScreen', params: { name: 'Wood Cutters', dataType: 'WoodCutter', detailScreen: 'WoodCutterDetail' } },
    { icon: 'cash-minus', label: 'Other Expenses', screen: 'ListScreen', params: { name: 'Other Expenses', dataType: 'OtherExpenses', detailScreen: 'OtherExpenses' } },
    { icon: 'pine-tree', label: 'Round Logs', screen: 'LogSaved' },
  ];

  const profileItems = [
    { icon: 'calendar-check', label: 'Attendance', screen: 'Attendance' },
    { icon: 'account-circle', label: 'Profile', screen: 'Profile' },
  ];

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCalcDropdown(!showCalcDropdown);
  };

  const renderSection = (title, items) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.navItem, activeScreen === item.screen && { backgroundColor: '#FFE4B5', borderRadius: 8 }]}
          onPress={() => {
            toggleMenu();
            navigation.navigate(item.screen, item.params || {});
          }}
        >
          <Icon name={item.icon} size={22} color="#8B4513" style={{ marginRight: 10 }} />
          <Text style={styles.navText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Animated.View style={[styles.navbarRight, { right: slideAnim }]}>
    <ScrollView>
      

      {/* Sales Section */}
      {renderSection('Sales', salesItems)}

      {/* Expenses Section */}
      {renderSection('Expenses', expenseItems)}

      {/* Other/Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Other</Text>

        {/* Calculators Dropdown */}
        <View>
          <TouchableOpacity style={styles.navItem} onPress={toggleDropdown}>
            <Icon name="calculator" size={22} color="#8B4513" style={{ marginRight: 10 }} />
            <Text style={styles.navText}>Calculators</Text>
            <Icon
              name={showCalcDropdown ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#8B4513"
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>

          {showCalcDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  toggleMenu();
                  navigation.navigate('LogCalculator');
                }}
              >
                <Text style={styles.dropdownText}>Log Calculator</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  toggleMenu();
                  navigation.navigate('FlatLogCalculator');
                }}
              >
                <Text style={styles.dropdownText}>Flat Log Calculator</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile / Other Items */}
        {profileItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.navItem, activeScreen === item.screen && { backgroundColor: '#FFE4B5', borderRadius: 8 }]}
            onPress={() => {
              toggleMenu();
              navigation.navigate(item.screen, item.params || {});
            }}
          >
            <Icon name={item.icon} size={22} color="#8B4513" style={{ marginRight: 10 }} />
            <Text style={styles.navText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  navbarRight: {
    position: 'absolute',
    top: 0,
    width: 260,
    height: '100%',
    backgroundColor: '#FFF',
    padding: 20,
    paddingTop: 40,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    elevation: 8,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#8B4513', textAlign: 'center' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#A0522D', marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#D2B48C', paddingBottom: 3 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 5, borderBottomColor: '#eee', borderBottomWidth: 1 },
  navText: { fontSize: 16, color: '#4B2E05' },
  dropdown: { marginLeft: 5, marginBottom: 10, paddingLeft: 10, backgroundColor: '#FFF' },
  dropdownItem: { paddingVertical: 6,borderWidth:1,borderColor:'#8B4513',borderRadius:5,marginVertical:5 },
  dropdownText: { fontSize: 15, color: '#8B4513' ,paddingStart:5},
});
