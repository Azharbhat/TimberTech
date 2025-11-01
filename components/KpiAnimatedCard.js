import React, { useRef, useEffect, useState, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

function KpiAnimatedCard({ title = 'Overview', kpis = [], progressData = null }) {
  const [numbers, setNumbers] = useState(kpis.map(() => 0));

  useEffect(() => {
    const animatedNumbers = kpis.map((item, index) => {
      let start = 0;
      const interval = setInterval(() => {
        start += Math.ceil(item.value / 20);
        if (start >= item.value) start = item.value;
        setNumbers(prev => {
          const copy = [...prev];
          copy[index] = start;
          return copy;
        });
      }, 60);
      return interval;
    });

    return () => {
      animatedNumbers.forEach(i => clearInterval(i));
    };
  }, [kpis]);

  const rawProgress = progressData ? progressData.value / (progressData.total || 1) : 0;
  const actualPercent = Math.round(rawProgress * 100);
  const isOverpaid = actualPercent > 100;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>{title}</Text>
        </View>

        {/* KPI Grid */}
        <View style={styles.row}>
          {kpis.map((item, index) => (
            <LinearGradient key={index} colors={item.gradient || ['#4facfe', '#00f2fe']} style={styles.card}>
              {item.icon && <MaterialCommunityIcons name={item.icon} size={36} color="#fff" />}
              <Text style={styles.title}>{item.label}</Text>
              <Text style={styles.value}>
                {item.isPayment !== 0 && '₹'}
                {numbers[index]?.toLocaleString() ?? 0}
              </Text>
            </LinearGradient>
          ))}
        </View>

        {/* Progress Section */}
        {progressData && (
          <LinearGradient
            colors={
              isOverpaid
                ? ['#ff4e50', '#f9d423']
                : progressData.gradient || ['#4cd137', '#44bd32']
            }
            style={styles.largeCard}
          >
            <AnimatedCircularProgress
              size={100}
              width={8}
              fill={Math.min(actualPercent, 100)}
              tintColor="#fff"
              backgroundColor="rgba(255,255,255,0.2)"
              rotation={0}
              lineCap="round"
            >
              {fill => <Text style={[styles.percent, isOverpaid && { color: '#ffeb3b', fontWeight: '800' }]}>{actualPercent}%</Text>}
            </AnimatedCircularProgress>

            <View style={styles.textContainer}>
              {progressData.icon && <MaterialCommunityIcons name={progressData.icon} size={40} color="#fff" />}
              <Text style={styles.doneText}>{progressData.label}</Text>
              <Text style={styles.pendingValue}>₹{Math.round(progressData.value).toLocaleString()}</Text>
              <Text style={styles.subText}>of ₹{Math.round(progressData.total).toLocaleString()} total</Text>
            </View>

            {isOverpaid && (
              <View style={[styles.textContainer, { marginLeft: 20 }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#ffeb3b" />
                <Text style={[styles.doneText, { marginTop: 4 }]}>Advance</Text>
                <Text style={styles.pendingValue}>
                  ₹{Math.round(progressData.value - progressData.total).toLocaleString()}
                </Text>
              </View>
            )}
          </LinearGradient>
        )}
      </View>
    </ScrollView>
  );
}

export default memo(KpiAnimatedCard);

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 10, marginBottom: 12 },
  headerText: { fontSize: 18, fontWeight: '700', color: '#333' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: (screenWidth - 48) / 2, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4, alignItems: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 8 },
  value: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 5 },
  largeCard: { marginTop: 20, padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  progressContainer: { alignItems: 'center', justifyContent: 'center' },
  percent: { position: 'absolute', color: 'white', fontSize: 18, fontWeight: '700' },
  textContainer: { marginLeft: 16 },
  doneText: { color: 'white', fontSize: 16, fontWeight: '600' },
  pendingValue: { color: 'white', fontSize: 20, fontWeight: '700' },
  subText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
});
