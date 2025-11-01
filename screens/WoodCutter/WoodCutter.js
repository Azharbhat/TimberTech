import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, GLOBAL_STYLES } from '../../theme/theme';

export default function WoodCutter({ route, navigation }) {
  const { key, name } = route.params;
  const [savedResults, setSavedResults] = useState([]);
  const [workerKeys, setWorkerKeys] = useState([]);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const snapshot = await get(ref(database, `Mills/${key}/WoodCutter`));
      if (snapshot.exists()) {
        const results = [];
        snapshot.forEach(childSnapshot => {
          results.push({
            workerKey: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });
        setSavedResults(results);
      } else {
        setSavedResults([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error);
    }
  };

  fetchData();
}, [key]);
  

  const handleItemPress = (item, workerKey) => {
    navigation.navigate('WoodCutterDetail', { key: key, workerKey: workerKey, data: item });
  };

  if (error) {
    return (
      <View style={GLOBAL_STYLES.container}>
        <Text style={{ color: COLORS.primary }}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={GLOBAL_STYLES.container}>
      {/* Header */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>{name}</Text>
      </View>

      {/* Modal for Add/Delete Worker */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={GLOBAL_STYLES.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={GLOBAL_STYLES.modalBox}>
            <Text style={GLOBAL_STYLES.modalTitle}>Worker Actions</Text>

            <Pressable
              style={{ ...GLOBAL_STYLES.button, marginVertical: 5 }}
              onPress={() => {
                navigation.navigate('AddWoodCutter', { key: key });
                setModalVisible(false);
              }}
            >
              <Text style={GLOBAL_STYLES.buttonText}>Add Worker</Text>
            </Pressable>

            <Pressable
              style={{ ...GLOBAL_STYLES.button, marginVertical: 5 }}
              onPress={() => {
                navigation.navigate('DeleteWorker', { key: key, address: 'WoodCutter' });
                setModalVisible(false);
              }}
            >
              <Text style={GLOBAL_STYLES.buttonText}>Delete Worker</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* WoodCutter List */}
      <FlatList
        data={savedResults}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => handleItemPress(item, workerKeys[index])}>
            <View style={GLOBAL_STYLES.itemBox}>
              <Text style={GLOBAL_STYLES.itemText}>{item.name}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
