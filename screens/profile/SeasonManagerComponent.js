import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { ref, push, set, update, onValue, serverTimestamp } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { COLORS, GLOBAL_STYLES, SIZE } from '../../theme/theme';
export default function SeasonManagerComponent({ millKey }) {
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ✅ Fetch all seasons
  useEffect(() => {
    const dbRef = ref(database, `Mills/${millKey}/Seasons`);
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setItems(list);
    });
  }, [millKey]);

  // ✅ Add or update season
  const handleAddOrUpdate = async () => {
    if (!name) return Alert.alert('Error', 'Season name is required');
    setLoading(true);

    const path = `Mills/${millKey}/Seasons`;
    const dbRef = ref(database, path);

    try {
      // 1️⃣ Set all to false
      const resetUpdates = {};
      items.forEach((item) => {
        resetUpdates[`${item.id}/isCurrent`] = false;
      });
      if (Object.keys(resetUpdates).length > 0) {
        await update(dbRef, resetUpdates);
      }

      // 2️⃣ New/updated season data
      const data = {
        name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isCurrent: true,
        timestamp: serverTimestamp(),
      };

      // 3️⃣ Add or update
      if (currentId) {
        await update(ref(database, `${path}/${currentId}`), data);
      } else {
        await set(push(ref(database, path)), data);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCurrentId(null);
    setEditMode(false);
    setStartDate(new Date());
    setEndDate(new Date());
    setModalVisible(false);
  };

  const handleEdit = (item) => {
    setModalVisible(true);
    setEditMode(true);
    setCurrentId(item.id);
    setName(item.name);
    setStartDate(new Date(item.startDate));
    setEndDate(new Date(item.endDate));
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => set(ref(database, `Mills/${millKey}/Seasons/${id}`), null) },
    ]);
  };

  // ✅ Make one season current
  const handleSetCurrent = async (selectedId) => {
    const path = `Mills/${millKey}/Seasons`;
    const dbRef = ref(database, path);

    try {
      const updates = {};
      items.forEach((item) => {
        updates[`${item.id}/isCurrent`] = item.id === selectedId;
      });
      await update(dbRef, updates);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update current season');
    }
  };

  return (
    <View style={GLOBAL_STYLES.container}>
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Manage Seasons</Text>
        <TouchableOpacity
          onPress={() => {
            setModalVisible(true);
            setEditMode(false);
            setCurrentId(null);
            setName('');
          }}
        >
          <Feather name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* ✅ Modal for Add/Edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={GLOBAL_STYLES.modalOverlay}
        >
          <View
            style={GLOBAL_STYLES.modalBox}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 15,
                }}
              >
                <Text style={{ fontSize: SIZE.sizes.lg, fontWeight: 'bold', color: COLORS.text }}>
                  {editMode ? 'Edit Season' : 'Add New Season'}
                </Text>
                <Pressable onPress={resetForm}>
                  <Feather name="x" size={24} color={COLORS.text} />
                </Pressable>
              </View>

              <TextInput
                style={GLOBAL_STYLES.input}
                placeholder="Season Name"
                value={name}
                onChangeText={setName}
              />

              <TouchableOpacity onPress={() => setShowStartPicker(true)} style={GLOBAL_STYLES.input}>
                <Text>Start Date: {startDate.toDateString()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEndPicker(true)} style={GLOBAL_STYLES.input}>
                <Text>End Date: {endDate.toDateString()}</Text>
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  onChange={(e, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  onChange={(e, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}

              <TouchableOpacity
                style={[GLOBAL_STYLES.button, { marginTop: 20 }]}
                onPress={handleAddOrUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={GLOBAL_STYLES.buttonText}>{editMode ? 'Update' : 'Add'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ✅ List of seasons */}
      <View style={{ marginTop: 20 }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              GLOBAL_STYLES.listItem,
              {
                backgroundColor: item.isCurrent ? COLORS.primary + '15' : COLORS.background,
                borderColor: item.isCurrent ? COLORS.primary : COLORS.border,
                borderWidth: 1,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 10,
              },
            ]}
          >
            <View style={[GLOBAL_STYLES.row, { justifyContent: 'space-between' }]}>
              <View>
                <Text style={{ fontWeight: 'bold', color: COLORS.text }}>
                  {item.name}
                  {item.isCurrent && (
                    <Text style={{ color: COLORS.primary }}>  • Active</Text>
                  )}
                </Text>
                <Text style={{ color: COLORS.gray }}>
                  {new Date(item.startDate).toDateString()} - {new Date(item.endDate).toDateString()}
                </Text>
              </View>

              {/* ✅ Switch for setting current season */}
              <View style={{ alignItems: 'center' }}>
                <Switch
                  value={item.isCurrent}
                  onValueChange={() => handleSetCurrent(item.id)}
                />
              </View>
            </View>

            <View style={[GLOBAL_STYLES.row, { marginTop: 10 }]}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 15 }}>
                <Feather name="edit-3" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Feather name="trash-2" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
