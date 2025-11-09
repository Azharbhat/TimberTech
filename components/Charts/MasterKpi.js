import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function MasterKpi({ route, header, expected: propExpected, paid: propPaid }) {
  const params = route?.params || {};
  const title = header || params.header || 'Revenue Overview';
  const expected = propExpected ?? params.expected ?? 0;
  const paid = propPaid ?? params.paid ?? 0;
  const pending = expected - paid;
  const progress = expected > 0 ? paid / expected : 0;

  const animatedExpected = useRef(new Animated.Value(0)).current;
  const animatedPaid = useRef(new Animated.Value(0)).current;
  const animatedPending = useRef(new Animated.Value(0)).current;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const [expectedValue, setExpectedValue] = useState(0);
  const [paidValue, setPaidValue] = useState(0);
  const [pendingValue, setPendingValue] = useState(0);
  const [progressValue, setProgressValue] = useState(0);

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedExpected, {
        toValue: expected,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(animatedPaid, {
        toValue: paid,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(animatedPending, {
        toValue: pending,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    const expectedListener = animatedExpected.addListener(({ value }) => setExpectedValue(value));
    const paidListener = animatedPaid.addListener(({ value }) => setPaidValue(value));
    const pendingListener = animatedPending.addListener(({ value }) => setPendingValue(value));
    const progressListener = animatedProgress.addListener(({ value }) => setProgressValue(value));

    return () => {
      animatedExpected.removeListener(expectedListener);
      animatedPaid.removeListener(paidListener);
      animatedPending.removeListener(pendingListener);
      animatedProgress.removeListener(progressListener);
    };
  }, [expected, paid, pending, progress]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>

      {/* Top KPI cards */}
      <View style={styles.row}>
        <LinearGradient colors={['#fbc531', '#f5d76e']} style={styles.card}>
          <MaterialCommunityIcons name="target" size={40} color="#fff" />
          <Text style={styles.title}>Total</Text>
          <Text style={styles.value}>₹{Math.round(expectedValue).toLocaleString()}</Text>
        </LinearGradient>

        <LinearGradient colors={['#ff6a6a', '#ff9a9e']} style={styles.card}>
          <MaterialCommunityIcons name="clock-alert" size={40} color="#fff" />
          <Text style={styles.title}>Pending</Text>
          <Text style={styles.value}>₹{Math.round(pendingValue).toLocaleString()}</Text>
        </LinearGradient>
      </View>

      {/* Progress Card */}
      <LinearGradient colors={['#4cd137', '#44bd32']} style={styles.largeCard}>
        <View style={styles.progressContainer}>
          <ProgressChart
            data={{ data: [progressValue] }}
            width={100}
            height={100}
            strokeWidth={8}
            radius={40}
            chartConfig={{
              backgroundGradientFromOpacity: 0,
              backgroundGradientToOpacity: 0,
              color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
              propsForBackgroundLines: { stroke: 'transparent' },
            }}
            hideLegend
            style={{ backgroundColor: 'transparent' }}
          />
          <Text style={styles.percent}>{Math.round(progressValue * 100)}%</Text>
        </View>

        <View style={styles.textContainer}>
          <MaterialCommunityIcons name="cash-check" size={40} color="#fff" />
          <Text style={styles.doneText}>{title === 'Revenue' ? 'Net Profit' : 'Paid'}</Text>
          <Text style={styles.pendingValue}>₹{Math.round(paidValue).toLocaleString()}</Text>
          <Text style={styles.subText}>of ₹{expected.toLocaleString()} total</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    width: (screenWidth - 48) / 2,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 8 },
  value: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 5 },
  largeCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: { alignItems: 'center', justifyContent: 'center' },
  percent: { position: 'absolute', color: 'white', fontSize: 18, fontWeight: '700' },
  textContainer: { marginLeft: 16 },
  doneText: { color: 'white', fontSize: 16, fontWeight: '600' },
  pendingValue: { color: 'white', fontSize: 20, fontWeight: '700' },
  subText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
});
