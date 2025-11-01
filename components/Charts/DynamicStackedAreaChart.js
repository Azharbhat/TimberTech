import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AreaChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';

const DynamicStackedAreaChart = ({ dataSets = [], xLabels = [], title = 'Stacked Area Chart' }) => {
  if (!dataSets.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={{ textAlign: 'center', color: '#888' }}>No data available</Text>
      </View>
    );
  }

  const stackedData = dataSets.map((set) => ({
    data: set.data,
    svg: { fill: set.color, stroke: set.color, strokeWidth: 2, fillOpacity: 0.8 },
    key: set.label,
  }));

  const allValues = dataSets.flatMap((set) => set.data);
  const yMax = Math.max(...allValues, 10);
  const yValues = Array.from({ length: 6 }, (_, i) => (i * yMax) / 5);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={{ flexDirection: 'row', height: 250, paddingVertical: 10 }}>
        <YAxis
          data={yValues}
          contentInset={{ top: 20, bottom: 20 }}
          svg={{ fontSize: 12, fill: '#555' }}
          numberOfTicks={6}
          formatLabel={(value) => `${Math.round(value)}`}
        />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <AreaChart
            style={{ flex: 1 }}
            data={stackedData.map(d => d.data)}
            yAccessor={({ item }) => item}
            contentInset={{ top: 20, bottom: 20 }}
            curve={shape.curveNatural}
            numberOfTicks={6}
          >
            <Grid />
          </AreaChart>

          <XAxis
            style={{ marginHorizontal: -10, marginTop: 5 }}
            data={xLabels}
            formatLabel={(value, index) => xLabels[index]}
            contentInset={{ left: 25, right: 25 }}
            svg={{ fontSize: 12, fill: '#555' }}
          />
        </View>
      </View>

      <View style={styles.legendContainer}>
        {dataSets.map((set, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: set.color }]} />
            <Text style={styles.legendText}>{set.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default DynamicStackedAreaChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 12 },
});
