import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, FlatList } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { COLORS, GLOBAL_STYLES } from '../../theme/theme';

const screenWidth = Dimensions.get('window').width;

const WorkAnalysisScreen = () => {
  const [filter, setFilter] = useState('All');
  const [data, setData] = useState([]);

  // Define consistent colors (same as Pie chart)
  const colors = {
    Full: '#4CAF50', // green
    Half: '#FFC107', // yellow
    Side: '#2196F3', // blue
  };

  // Fetch all works from Firebase
  useEffect(() => {
    const fetchData = async () => {
      const dataRef = ref(database, 'works');
      const snapshot = await get(dataRef);
      if (snapshot.exists()) {
        const items = Object.values(snapshot.val());
        setData(items);
      }
    };
    fetchData();
  }, []);

  // Filter logic
  const filterData = (items) => {
    const now = new Date();
    let filtered = items;

    if (filter === 'Day') {
      filtered = items.filter((i) => {
        const d = new Date(i.timestamp);
        return d.toDateString() === now.toDateString();
      });
    } else if (filter === 'Week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      filtered = items.filter((i) => new Date(i.timestamp) >= weekAgo);
    } else if (filter === 'Month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = items.filter((i) => new Date(i.timestamp) >= monthAgo);
    } else if (filter === 'Year') {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      filtered = items.filter((i) => new Date(i.timestamp) >= yearAgo);
    }

    return filtered;
  };

  // Aggregate data per date and type
  const aggregateData = () => {
    const filtered = filterData(data);
    const grouped = {};

    filtered.forEach((item) => {
      const date = new Date(item.timestamp).toLocaleDateString();
      const type = item.workType; // 'Full', 'Half', or 'Side'
      const amount = Number(item.amount) || 0;

      if (!grouped[date]) grouped[date] = { Full: 0, Half: 0, Side: 0 };
      grouped[date][type] += amount;
    });

    const labels = Object.keys(grouped);
    const fullData = labels.map((d) => grouped[d].Full);
    const halfData = labels.map((d) => grouped[d].Half);
    const sideData = labels.map((d) => grouped[d].Side);

    return { labels, fullData, halfData, sideData };
  };

  const chartData = aggregateData();

  const dataSets = [
    { data: chartData.fullData, color: () => colors.Full },
    { data: chartData.halfData, color: () => colors.Half },
    { data: chartData.sideData, color: () => colors.Side },
  ];

  const filters = ['Day', 'Week', 'Month', 'Year', 'All'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Work Analysis</Text>

      {/* 🔹 Filter Buttons */}
      <FlatList
        data={filters}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFilter(item)}
            style={[styles.filterButton, filter === item && styles.activeFilter]}
          >
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>
              {item}
            </Text>
          </Pressable>
        )}
        style={{ marginBottom: 10 }}
      />

      {/* 🔹 Labels */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.Full }]} />
          <Text style={styles.legendText}>Full</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.Half }]} />
          <Text style={styles.legendText}>Half</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.Side }]} />
          <Text style={styles.legendText}>Side</Text>
        </View>
      </View>

      {/* 🔹 Grouped Bar Chart */}
      {chartData.labels.length > 0 ? (
        <BarChart
          data={{
            labels: chartData.labels,
            datasets: dataSets,
          }}
          width={screenWidth - 16}
          height={300}
          yAxisLabel=""
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            barPercentage: 0.7,
            style: { borderRadius: 12 },
          }}
          withInnerLines={false}
          showBarTops={false}
          fromZero
          verticalLabelRotation={20}
          style={styles.chart}
        />
      ) : (
        <Text style={styles.noData}>No Data Found for {filter}</Text>
      )}
    </View>
  );
};

export default WorkAnalysisScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 10,
  },
  chart: {
    marginVertical: 10,
    borderRadius: 12,
    alignSelf: 'center',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
  },
  activeFilter: {
    backgroundColor: COLORS.primary || '#4CAF50',
    borderColor: COLORS.primary || '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#333',
  },
  noData: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
});
