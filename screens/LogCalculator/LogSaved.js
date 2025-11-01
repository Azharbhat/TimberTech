import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import { useSelector } from 'react-redux';
const LogSaved = ({ navigation, route }) => {
  const { millKey, millData } = useSelector((state) => state.mill);
  const [savedResults, setSavedResults] = useState([]);
  const [uniqueNames, setUniqueNames] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${millKey}/LogCalculations`));

        if (snapshot.exists()) {
          const data = snapshot.val();

          const resultsArray = Object.entries(data).map(([name, value]) => ({
            name,
            calculations: Object.entries(value).map(([calcKey, calcValue]) => ({
              key: calcKey,
              ...calcValue,
            })),
          }));

          setSavedResults(resultsArray);
          setUniqueNames(resultsArray.map(r => ({ name: r.name })));
        } else {
          setSavedResults([]);
          setUniqueNames([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
      }
    };

    fetchData();
  }, [millKey]);

  const filteredNames = uniqueNames.filter(item =>
    (item?.name ?? '').toLowerCase().includes(searchText.toLowerCase())
  );

  const handleItemPress = (item) => {
    const selected = savedResults.find(r => r.name === item.name);
    if (!selected) return;

    navigation.navigate('LogSavedDetail', {
      data: selected.calculations,
      MillKey: millKey,
      name: selected.name,
    });
  };

  if (error) {
    return (
      <View style={GLOBAL_STYLES.container}>
        <Text style={{ color: 'red' }}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={GLOBAL_STYLES.container}>
      {/* HEADER */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Round Logs</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={GLOBAL_STYLES.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={COLORS.primary}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={GLOBAL_STYLES.searchInput}
          placeholder="Search by name..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      {/* LIST */}
      <FlatList
        data={filteredNames}
        keyExtractor={(item, index) => item.name || index.toString()}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleItemPress(item)}>
            <View style={GLOBAL_STYLES.card}>
              <Ionicons
                name="document-text-outline"
                size={28}
                color="#8B4513"
                style={{ marginRight: 8 }}
              />
              <Text style={GLOBAL_STYLES.itemText}>{item.name}</Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
      />
    </View>
  );
};

export default LogSaved;
