import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { GLOBAL_STYLES, COLORS, FONTS } from '../../theme/theme';

export default function Transporters({ route, navigation }) {
  const { key, name } = route.params;
  const [savedResults, setSavedResults] = useState([]);
  const [workerKeys, setWorkerKeys] = useState([]);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${key}/Transporters`));
        if (snapshot.exists()) {
          const keys = [];
          snapshot.forEach(childSnapshot => {
            const workerKey = childSnapshot.key;
            keys.push(workerKey);
          });
          setWorkerKeys(keys);

          const data = snapshot.val();
          const results = data ? Object.values(data) : [];
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
    navigation.navigate('TransporterDetail', { key: key, workerKey: workerKey, data: item });
  };

  return (
     <View style={GLOBAL_STYLES.container}>
      {error && (
        <View style={{ padding: 10 }}>
          <Text>Error: {error.message}</Text>
        </View>
      )}

     
            {/* HEADER */}
            <View style={GLOBAL_STYLES.headerContainer}>
              <Text style={[GLOBAL_STYLES.headerText, { flex: 1, backgroundColor: 'transparent', textAlign: 'left' }]}>
                {name}
              </Text>
      </View>

      {/* Workers List */}
      <FlatList
        data={savedResults}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => handleItemPress(item, workerKeys[index])}>
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.name}</Text>
            </View>
          </Pressable>
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 10 }}
      />

      {/* Modal for Add/Delete Worker */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Actions</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                navigation.navigate('AddTransporter', { key });
                setModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Add Worker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                navigation.navigate('DeleteWorker', { key, address: 'Transporters' });
                setModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Delete Worker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#A0522D' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC', // Ivory color
  },
  header: {
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#8B4513',
    backgroundColor: '#D2B48C', // Wood tone
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  item: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F5F5DC',
    marginBottom: 6,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 20,
    color: '#8B4513',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#D2B48C',
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8B4513',
  },
  modalButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
