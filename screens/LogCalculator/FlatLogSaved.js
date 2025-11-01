import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Pressable, 
  TextInput, 
  StyleSheet 
} from 'react-native';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { useSelector } from 'react-redux';
const FlatLogSaved = ({ navigation, route }) => {
const { millKey, millData } = useSelector((state) => state.mill);


  const [savedResults, setSavedResults] = useState([]);
  const [uniqueNames, setUniqueNames] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${millKey}/FlatLogCalculations`));
        if (snapshot.exists()) {
          const data = snapshot.val();

          // Map data into array
          const resultsArray = Object.keys(data).map(name => ({
            name,
            calculations: Object.keys(data[name]).map(calcKey => ({
              key: calcKey,
              ...data[name][calcKey],
              data: data[name][calcKey].data || [{ num1: '-', selectedValue: '-', result: data[name][calcKey].total || 0 }],
              total: data[name][calcKey].total || 0,
              buyedPrice: data[name][calcKey].buyedPrice || 0,
              payedPrice: data[name][calcKey].payedPrice || 0,
              timestamp: data[name][calcKey].timestamp || Date.now(),
              payments: data[name][calcKey].payments || {},
            })),
          }));

          setSavedResults(resultsArray);

          // Extract unique names for listing
          setUniqueNames(resultsArray.map(r => ({ name: r.name })));
        } else {
          setSavedResults([]);
          setUniqueNames([]);
        }
      } catch (err) {
        console.error('Error fetching FlatLogCalculations:', err);
        setError(err);
      }
    };

    fetchData();
  }, [millKey]);

  // Filter names by search
  const filteredNames = uniqueNames.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleItemPress = (item) => {
    const selected = savedResults.find(r => r.name === item.name);
    if (!selected) return;
    navigation.navigate('FlatLogSavedDetail', { 
      data: selected.calculations,
      MillKey: millKey,
      name: selected.name
    });
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={GLOBAL_STYLES.container}>
          <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Flat Logs</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8B4513" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* FlatList */}
      <FlatList
        data={filteredNames}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ flex: 1, paddingHorizontal: 10 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleItemPress(item)}>
            <View style={styles.card}>
              <Ionicons name="document-text-outline" size={28} color="#8B4513" />
              <Text style={styles.cardText}>{item.name}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7' },
  headerContainer: {
    backgroundColor: '#8B4513',
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    margin: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#D2B48C',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: '#4B2E05',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0DC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardText: { fontSize: 20, fontWeight: '600', marginLeft: 12, color: '#4B2E05' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 20 },
});

export default FlatLogSaved;
