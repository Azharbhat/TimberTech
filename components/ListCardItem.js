import React, { useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, GLOBAL_STYLES, SIZE } from '../theme/theme';

export default function ListCardItem({
  item = {},
  
  activeTab = 'Work', // 'Work' | 'Payments' | 'Shipped'
  onPress = () => { },
  onLongPress = () => { },
  type = 'Other', // 'WoodCutter' | 'Transporter' | etc.
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dateLabel = item?.timestamp
    ? new Date(item.timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : 'N/A';

  /** TYPE CONFIGURATION **/
/** TYPE CONFIGURATION **/

const configMap = {
  WoodCutter: {
    icon: 'axe',
    work: {
      main: { label: 'Feet', value: item?.feetCut ? `${item.feetCut} ft` : '0 ft' },
      sub: { label: 'Place', value: item?.place ?? '—' },
      details: [
        { label: 'Price/Feet', value: `₹${item?.pricePerFeet ?? 0}` },
        { label: 'Total Price', value: `₹${item?.totalPrice ?? 0}`, highlight: true },
      ],
    },
  },

  Transporter: {
    icon: 'truck-fast',
    work: {
      main: { label: 'Item', value: item?.shippingItem ?? '—' },
      sub: { label: 'Route', value: `${item?.from ?? '—'} → ${item?.to ?? '—'}` },
      details: [
        { label: 'Shipping Cost', value: `₹${item?.shippingCost ?? 0}`, highlight: true },
        { label: 'Note', value: item?.note ?? '—' },
      ],
    },
  },

  Log: {
    icon: 'tree',
    work: {
      main: { label: 'Logs', value: item?.count ?? 0 },
      sub: { label: 'Type', value: item?.logType ?? '—' },
      details: [
        { label: 'Price/Log', value: `₹${item?.pricePerLog ?? 0}` },
        { label: 'Total Price', value: `₹${item?.totalPrice ?? 0}`, highlight: true },
      ],
    },
  },

  BoxWork: {
    icon: 'package-variant-closed',
    work: {
      main: { label: item?.type == 'full' ? 'Full Box' : 'Half Box', value: `${item?.amount ?? 0}` },
      sub: { label: 'Type', value: item?.type ?? '—' },
      details: [
        { label: item?.type == 'full' ? 'Full Box' : 'Half Box', value: `${item?.amount ?? 0}` },
        { label: 'Earning', value: `₹${item?.earned ?? 0}`, highlight: true },
      ],
    },
  },

  Other: {
    icon: 'cog',
    work: {
      main: { label: 'Work', value: item?.workName ?? '—' },
      sub: { label: 'Description', value: item?.description ?? '—' },
      details: [{ label: 'Cost', value: `₹${item?.cost ?? 0}`, highlight: true }],
    },
  },

  /** ✅ NEW CONFIG: OTHER EXPENSES **/
  OtherExpenses: {
    icon: 'wallet',
    work: {
      main: { label: 'Expense', value: item?.note ?? '—' },
      sub: { label: 'Category', value: item?.category ?? 'General' },
      details: [
        { label: 'Total', value: `₹${Number(item?.total || 0).toFixed(2)}`, highlight: true },
        { label: 'Intial Paid', value: `₹${Number(item?.initialPaid || 0).toFixed(2)}` },
        { label: 'Paid', value: `₹${Number(item?.paidAmt || 0).toFixed(2)}` },
        {
          label: 'Remaining',
          value: `₹${Number(item?.remaining||0 )}`,
          highlight: Number(item?.remaining ) > 0,
        },
      ],
    },
  },
};


  const typeConfig = configMap[type] || configMap.Other;
  /** TAB-SPECIFIC LOGIC **/
 /** TAB-SPECIFIC LOGIC **/
const tabConfig = {
  Work: {
    icon: typeConfig.icon,
    main: typeConfig.work.main.value,
    sub: typeConfig.work.sub.value,
    details: typeConfig.work.details,
  },
  Payments: {
    icon: 'cash-multiple',
    main: `₹${item?.amount ?? 0}`,
    sub: item?.note ?? '—',
  },
  Tips: {
    icon: 'cash-multiple',
    main: `₹${item?.amount ?? 0}`,
    sub: item?.note ?? '—',
  },
  BoxWork: configMap.BoxWork,
  Shipped: {
    icon: 'truck-fast',
    main: item?.shippingItem ?? '—',
    sub: `${item?.from ?? '—'} → ${item?.to ?? item?.destination}`,
    details: [
      { label: 'From', value: item?.from ?? '—' },
      { label: 'To', value: item?.to ?? item?.destination },
      { label: 'Cost', value: `₹${item?.shippingCost ?? 0}`, highlight: true },
      { label: 'Note', value: item?.note ?? null },
      { label: 'fullQuantity', value: item?.fullQuantity != 0 ? item?.fullQuantity : null },
      { label: 'halfQuantity', value: item?.halfQuantity != 0 ? item?.halfQuantity : null },
    ],
  },
  /** ✅ NEW TAB TYPE **/
  OtherExpenses: {
    icon: configMap.OtherExpenses.icon,
    main: configMap.OtherExpenses.work.main.value,
    sub: configMap.OtherExpenses.work.sub.value,
    details: configMap.OtherExpenses.work.details,
  },
};

  const currentTab = tabConfig[activeTab] || tabConfig.Work;

  /** ANIMATION **/
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={[COLORS.cardGradientStart, COLORS.cardGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name={currentTab.icon}
                size={26}
                color={COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText}>{currentTab.main}</Text>
              <Text style={styles.subInfo}>{currentTab.sub}</Text>
            </View>
          </View>

          {/* DETAILS */}
          {
            currentTab.details && (<>
              <View style={styles.detailBox}>
                {currentTab?.details
                  ?.filter(d => d?.value !== null && d?.value !== undefined && d?.value !== '') // ✅ skip null/empty
                  .map((d, i) => (
                    <View key={i} style={styles.row}>
                      <Text style={styles.label}>{d.label}:</Text>
                      <Text style={[styles.value, d.highlight && styles.highlightValue]}>
                        {d.value}
                      </Text>
                    </View>
                  ))}

              </View>
            </>)
          }


          {/* DATE FOOTER */}
          <View style={{...GLOBAL_STYLES.row,paddingTop:10}}>
            <View style={GLOBAL_STYLES.row}>
              <MaterialCommunityIcons name="calendar" size={14} color={COLORS.text} />
              <Text style={styles.dateText}>{dateLabel}</Text>
            </View>
            {item.userName && (<>

              <Text style={GLOBAL_STYLES.listItemText}>
                {item.userName}
              </Text>

            </>)}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

/** 🎨 STYLES **/
const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  gradient: {
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
  },
  titleText: {
    fontSize: SIZE.sizes.large,
    color: COLORS.primary,
    fontFamily: FONTS.montserratBold,
  },
  subInfo: {
    fontSize: SIZE.sizes.small,
    color: COLORS.text,
    fontFamily: FONTS.poppinsRegular,
    marginTop: 2,
  },
  detailBox: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  label: {
    color: COLORS.text,
    fontSize: SIZE.sizes.small,
    fontFamily: FONTS.poppinsRegular,
  },
  value: {
    color: COLORS.primary,
    fontSize: SIZE.sizes.small,
    fontFamily: FONTS.montserratMedium,
  },
  highlightValue: {
    color: COLORS.kpitotalpaid,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  dateText: {
    fontSize: SIZE.sizes.small,
    color: COLORS.text,
    marginLeft: 4,
    fontFamily: FONTS.montserratRegular,
  },
});
