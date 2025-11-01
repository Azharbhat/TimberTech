// components/SeasonManagerComponent.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { ref, push, set, update, onValue, serverTimestamp } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { COLORS, GLOBAL_STYLES, SIZE } from '../../theme/theme';

export default function SeasonManagerComponent({ millKey }) {
  const [items, setItems] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isCurrent, setIsCurrent] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    const dbRef = ref(database, `Mills/${millKey}/Seasons`);
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setItems(list);
    });
  }, [millKey]);

  const handleAddOrUpdate = async () => {
    if (!name) return Alert.alert('Error', 'Season name is required');
    setLoading(true);
    const data = {
      name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isCurrent,
      timestamp: serverTimestamp(),
    };
    const path = `Mills/${millKey}/Seasons`;
    try {
      if (currentId) await update(ref(database, `${path}/${currentId}`), data);
      else await set(push(ref(database, path)), data);
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
    setIsCurrent(false);
    setStartDate(new Date());
    setEndDate(new Date());
    setFormVisible(false);
  };

  const handleEdit = (item) => {
    setFormVisible(true);
    setName(item.name);
    setStartDate(new Date(item.startDate));
    setEndDate(new Date(item.endDate));
    setIsCurrent(item.isCurrent);
    setEditMode(true);
    setCurrentId(item.id);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => set(ref(database, `Mills/${millKey}/Seasons/${id}`), null) },
    ]);
  };

  return (
    <View style={GLOBAL_STYLES.container}>
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Manage Seasons</Text>
        <TouchableOpacity onPress={() => setFormVisible(!formVisible)}>
          <Feather name={formVisible ? 'x' : 'plus'} size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {formVisible && (
        <>
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

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
            <Text style={{ fontSize: SIZE.sizes.md, marginRight: 10 }}>Current Season</Text>
            <Switch value={isCurrent} onValueChange={setIsCurrent} />
          </View>

          <TouchableOpacity
            style={GLOBAL_STYLES.button}
            onPress={handleAddOrUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={GLOBAL_STYLES.buttonText}>{editMode ? 'Update' : 'Add'}</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={{ marginTop: 20 }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={GLOBAL_STYLES.listItem}
          >
            <View style={GLOBAL_STYLES.row}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text style={{ color: COLORS.gray }}>
                {new Date(item.startDate).toDateString()} - {new Date(item.endDate).toDateString()}
              </Text>
            </View>

            <View style={GLOBAL_STYLES.row}>
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
