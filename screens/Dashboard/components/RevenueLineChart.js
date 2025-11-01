import React from 'react';
import { Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width - 32;

export default function RevenueLineChart({ data }) {
  return (
    <>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8B4513', marginVertical: 10, textAlign: 'center' }}>
        Monthly Revenue
      </Text>
      <LineChart
        data={data}
        width={screenWidth}
        height={220}
        yAxisLabel="$"
        fromZero
        bezier
        chartConfig={{
          backgroundColor: '#FFF8DC',
          backgroundGradientFrom: '#FFF8DC',
          backgroundGradientTo: '#FFF8DC',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255,165,0,${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </>
  );
}
