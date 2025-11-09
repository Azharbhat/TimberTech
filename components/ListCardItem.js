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
  activeTab = 'Work', // 'Work' | 'Payments' | 'Shipped' | etc.
  onPress = () => { },
  onLongPress = () => { },
  type = 'Other', // 'WoodCutter' | 'Transporter' | 'BoxBuyer' | etc.
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
  const configMap = {
    BoxBuyer: {
      icon: 'account-box-multiple',

      // 🔹 Ordered Tab
      ordered: {
        main: { label: 'Total', value: `₹${item?.total ?? 0}` },
        sub: { label: 'Boxes', value: `${item?.fullQty ?? 0} Full / ${item?.halfQty ?? 0} Half` },
        details: [
          { label: 'Full Per Box Price', value: `₹${item?.fullBoxPrice ?? 0}` },
          { label: 'Full Box Qty', value: `${item?.fullQty ?? 0}` },
          { label: 'Full Box Price', value: `₹${item?.fullBoxPrice * item?.fullQty ?? 0}` },
          { label: 'Half Per Box Price', value: `₹${item?.halfBoxPrice ?? 0}` },
          { label: 'Half Box Qty', value: `${item?.halfQty ?? 0}` },
          { label: 'Half Box Price', value: `₹${item?.halfBoxPrice * item?.halfQty ?? 0}` },

          { label: 'Note', value: item?.note ?? '—' },
        ],
      },

      // 🔹 Payments Tab
      payments: {
        main: { label: 'Amount', value: `₹${item?.amount ?? 0}` },
        sub: { label: 'Note', value: item?.note ?? '—' },
      },

      // 🔹 Shipped Tab
      shipped: {
        main: {
          label: 'Route',
          value: `${item?.from ?? '—'} → ${item?.destination ?? '—'}`,
        },
        sub: { label: 'Transporter', value: item?.transporterName ?? '—' },
        details: [
          { label: 'Full Quantity', value: `${item?.fullQuantity ?? 0}` },
          { label: 'Half Quantity', value: `${item?.halfQuantity ?? 0}` },
          { label: 'Shipping Cost', value: `₹${item?.shippingCost ?? 0}`, highlight: true },
        ],
      },

    },


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
      shipped: {
        main: { label: 'Item', value: item?.shippingItem ?? '—' },
        sub: {
          label: 'Route',
          value: `${item?.from ?? '—'} → ${item?.to ? item.to : item.destination ?? '—'}`,
        },
        details: [
          { label: 'Shipping Cost', value: `₹${item?.shippingCost ?? 0}`, highlight: true },
          { label: 'Shipped To', value: item?.buyerName ?? null },
          { label: 'FullBox', value: item?.fullQuantity ?? null },
          { label: 'HalfBox', value: item?.halfQuantity ?? null },
          { label: 'Note', value: item?.note ?? null },
        ],
      }
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

    OtherExpenses: {
      icon: 'wallet',
      work: {
        main: { label: 'Expense', value: item?.note ?? '—' },
        sub: { label: 'Category', value: item?.category ?? 'General' },
        details: [
          { label: 'Total', value: `₹${Number(item?.total || 0).toFixed(2)}`, highlight: true },
          { label: 'Initial Paid', value: `₹${Number(item?.initialPaid || 0).toFixed(2)}` },
          { label: 'Paid', value: `₹${Number(item?.paidAmt || 0).toFixed(2)}` },
          {
            label: 'Remaining',
            value: `₹${Number(item?.remaining || 0)}`,
            highlight: Number(item?.remaining) > 0,
          },
        ],
      },
    },
    FlatLog: {
      icon: 'wallet',
      work: {
        main: {
          label: 'Total Area',
          value: `${item?.totalArea ?? 0} sq.ft (${item?.data?.length ?? 0})`
        },
        sub: {
          label: 'Total Price',
          value: `₹${Number(item?.totalPrice || 0).toFixed(2)}`
        },
      },
    },
    RoundLog: {
      icon: 'wallet',
      work: {
        main: {
          label: 'Total Volume',
          value: `${(item?.totalCft ?? item?.totalArea ?? 0).toFixed(3)} CFT (${item?.data?.length ?? 0} logs)`,
        },
        sub: {
          label: 'Buyed',
          value: `₹${item?.buyed ?? 0}`,
        },
      },
    },


    OtherIncome: {
      icon: 'wallet-plus',
      work: {
        main: { label: 'Income', value: item?.note ?? '—' },
        sub: { label: 'Category', value: item?.category ?? 'General' },
        details: [
          { label: 'Total', value: `₹${Number(item?.total || 0).toFixed(2)}`, highlight: true },
          { label: 'Received', value: `₹${Number(item?.paidAmt || 0).toFixed(2)}` },
        ],
      },
    },
  }

  /** GET CONFIG SAFELY **/
  const typeConfig = configMap[type] || configMap.Other;
  /** ✅ TAB LOGIC (SAFE) **/
  const tabConfig = {
    Ordered: {
      icon: typeConfig.icon,
      main: typeConfig?.ordered?.main?.value ?? '—',
      sub: typeConfig?.ordered?.sub?.value ?? '—',
      details: typeConfig?.ordered?.details ?? [],
    },
    Work: {
      icon: typeConfig.icon,
      main: typeConfig?.work?.main?.value ?? '—',
      sub: typeConfig?.work?.sub?.value ?? '—',
      details: typeConfig?.work?.details ?? [],
    },
    Calculation: {
      icon: typeConfig.icon,
      main: typeConfig?.work?.main?.value ?? '—',
      sub: typeConfig?.work?.sub?.value ?? '—',
      details: typeConfig?.work?.details ?? [],
    },
    Shipped: {
      icon: typeConfig.icon,
      main: typeConfig?.shipped?.main?.value ?? '—',
      sub: typeConfig?.shipped?.sub?.value ?? '—',
      details: typeConfig?.shipped?.details ?? [],
    },
    shipped: {
      icon: typeConfig.icon,
      main: typeConfig?.shipped?.main?.value ?? '—',
      sub: typeConfig?.shipped?.sub?.value ?? '—',
      details: typeConfig?.shipped?.details ?? [],
    },
    Payments: {
      icon: 'cash-multiple',
      main: typeConfig?.payments?.main?.value ?? `₹${item?.amount ?? 0}`,
      sub: typeConfig?.payments?.sub?.value ?? item?.note ?? '—',
      details: typeConfig?.payments?.details ?? [],
    },
    Tips: {
      icon: 'cash-multiple',
      main: `₹${item?.amount ?? 0}`,
      sub: item?.note ?? '—',
      details: [],
    },
    BoxWork: configMap.BoxWork.work,
    OtherExpenses: configMap.OtherExpenses.work,
    OtherIncome: configMap.OtherIncome.work,
  };

  // ✅ Fallback Handling
  let currentTab = tabConfig[activeTab];
  if (!currentTab) {
    if (type === 'BoxBuyer') currentTab = tabConfig.Ordered;
    else currentTab = tabConfig.Work;
  }

  // ✅ Safety fallback for missing values
  currentTab = {
    icon: currentTab?.icon ?? typeConfig.icon,
    main: currentTab?.main ?? '—',
    sub: currentTab?.sub ?? '—',
    details: currentTab?.details ?? [],
  };

  /** ANIMATION **/
  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();

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
          {currentTab.details?.length > 0 && (
            <View style={styles.detailBox}>
              {currentTab.details
                .filter(d => d?.value !== null && d?.value !== undefined && d?.value !== '')
                .map((d, i) => (
                  <View key={i} style={styles.row}>
                    <Text style={GLOBAL_STYLES.listItemSmallText}>{d.label}:</Text>
                    <Text style={[GLOBAL_STYLES.listItemSmallText, d.highlight && styles.highlightValue]}>
                      {d.value}
                    </Text>
                  </View>
                ))}
            </View>
          )}

          {/* FOOTER */}
          <View style={{ ...GLOBAL_STYLES.row, paddingTop: 10 }}>
            <View style={GLOBAL_STYLES.row}>
              <MaterialCommunityIcons name="calendar" size={14} color={COLORS.text} />
              <Text style={styles.dateText}>{dateLabel}</Text>
            </View>
            {item.userName && (
              <Text style={GLOBAL_STYLES.listItemText}>{item.userName}</Text>
            )}
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
  gradient: { padding: 16, borderRadius: 16 },
  header: { flexDirection: 'row', alignItems: 'center' },
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
    padding: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  label: { color: COLORS.text, fontSize: SIZE.sizes.small, fontFamily: FONTS.poppinsRegular },
  value: { color: COLORS.primary, fontSize: SIZE.sizes.small, fontFamily: FONTS.montserratMedium },
  highlightValue: { color: COLORS.kpitotalpaid, fontWeight: 'bold' },
  dateText: {
    fontSize: SIZE.sizes.small,
    color: COLORS.text,
    marginLeft: 4,
    fontFamily: FONTS.montserratRegular,
  },
});
