import React from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { VictoryChart, VictoryGroup, VictoryBar, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { GLOBAL_STYLES } from '../../../theme/theme';

const screenWidth = Dimensions.get('window').width;

export default function ExpenseBarChart({ labels = [], dataSets = [], colors = ['#fbc531', '#ff6a6a', '#4cd137'], title = 'Expenses Overview' }) {

  // Filter out bars where all datasets are zero
  const nonZeroIndices = labels.map((_, i) =>
    dataSets.some(set => set[i] && set[i] !== 0)
  );

  const filteredLabels = labels.filter((_, i) => nonZeroIndices[i]);
  const filteredDataSets = dataSets.map(set =>
    set.filter((_, i) => nonZeroIndices[i]).map((y, i) => ({ x: i + 1, y }))
  );

  const chartKey = JSON.stringify({ labels, dataSets });

  return (
    <View>
      <Text style={GLOBAL_STYLES.kpiHeaderText}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <VictoryChart
          key={chartKey}
          theme={VictoryTheme.material}
          domainPadding={{ x: 60 }}
          width={Math.max(screenWidth, filteredLabels.length * 160)}
          height={320}
          animate={{ duration: 800 }}
        >
          {/* Define gradients for glass effect */}
          <Defs>
            {colors.map((color, idx) => (
              <LinearGradient key={idx} id={`grad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity={0.8} />
                <Stop offset="100%" stopColor={color} stopOpacity={0.3} />
              </LinearGradient>
            ))}
          </Defs>

          {/* X Axis */}
          <VictoryAxis
            tickValues={filteredLabels.map((_, i) => i + 1)}
            tickFormat={filteredLabels}
            style={{
              axis: { stroke: 'transparent' },
              tickLabels: { fontSize: 14, angle: 0, textAnchor: 'middle', fill: '#8B4513', fontWeight: '700' },
              grid: { stroke: 'transparent' },
            }}
          />

          {/* Y Axis hidden */}
          <VictoryAxis
            dependentAxis
            tickFormat={() => ''}
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: 'transparent' },
            }}
          />

          {/* Bars with gradient fill and rounded tops */}
          <VictoryGroup offset={45}>
            {filteredDataSets.map((set, idx) => (
              <VictoryBar
                key={idx}
                data={set}
                labels={({ datum }) => `₹${datum.y.toLocaleString()}`}
                labelComponent={<VictoryLabel dy={-12} />}
                style={{
                  data: {
                    fill: `url(#grad-${idx % colors.length})`,
                    width: 25,
                    cornerRadius: { top: 12, bottom: 0 }, // ✅ Rounded top only
                    stroke: 'rgba(255,255,255,0.4)',
                    strokeWidth: 1,
                  },
                  labels: { fontSize: 12, fill: '#000', fontWeight: '600' },
                }}
              />
            ))}
          </VictoryGroup>
        </VictoryChart>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 20, fontWeight: 'bold', color: '#8B4513', textAlign: 'center', marginBottom: 12 },
});
