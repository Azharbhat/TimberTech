import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  ScrollView,
  Clipboard,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { ref, push, set, update, onValue, serverTimestamp } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { COLORS, GLOBAL_STYLES, SIZE } from '../../theme/theme';
import CustomPicker from '../../components/CustomPicker';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';
import { useSelector, useDispatch } from 'react-redux';
export default function StaffComponent({ millKey }) {
  const dispatch = useDispatch();
  const staffTypes = [
    'Normal',
    'Boxmaker',
    'BoxBuyer',
    'Transporter',
    'WoodCutter',
    'OtherExpenses',
    'OtherIncome',
  ];

  const [selectedType, setSelectedType] = useState('Normal');
  const [name, setName] = useState('');
  const [password, setPassword] = useState(''); // new password field
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [salaryPerDay, setSalaryPerDay] = useState('');
  const [salaryFullBox, setSalaryFullBox] = useState('');
  const [salaryHalfBox, setSalaryHalfBox] = useState('');
  const [salaryOneSide, setSalaryOneSide] = useState('');

  const dbPath = (staffType) => {
    switch (staffType) {
      case 'Normal': return `Mills/${millKey}/Workers`;
      case 'Boxmaker': return `Mills/${millKey}/BoxMakers`;
      case 'BoxBuyer': return `Mills/${millKey}/BoxBuyers`;
      case 'Transporter': return `Mills/${millKey}/Transporters`;
      case 'WoodCutter': return `Mills/${millKey}/WoodCutter`;
      case 'OtherExpenses': return `Mills/${millKey}/OtherExpenses`;
      case 'OtherIncome': return `Mills/${millKey}/OtherIncome`;
      default: return `Mills/${millKey}/Workers`;
    }
  };
 useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey));
    };
  }, [millKey]);
  useEffect(() => {
    if (!millKey) return;
    const path = dbPath(selectedType);
    const dbRef = ref(database, path);
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setItems(list);
    });
  }, [selectedType, millKey]);

  const generateRandomPassword = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleAddOrUpdate = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');

    // Check for duplicates
    const duplicate = items.find(
      (item) =>
        item.name?.toLowerCase() === name.trim().toLowerCase() &&
        item.id !== currentId
    );
    if (duplicate) {
      return Alert.alert('Duplicate Entry', `A ${selectedType} named "${name}" already exists.`);
    }

    if (selectedType === 'Normal' && !salaryPerDay)
      return Alert.alert('Error', 'Salary per day is required');
    if (
      selectedType === 'Boxmaker' &&
      (!salaryFullBox || !salaryHalfBox || !salaryOneSide)
    )
      return Alert.alert('Error', 'All Boxmaker salaries are required');

    setLoading(true);
    try {
      const path = dbPath(selectedType);
      const dbRef = ref(database, path);
      const data = { name, type: selectedType, timestamp: serverTimestamp() };

      if (!password && !editMode) {
        data.password = generateRandomPassword(); // add random password on new entry
      } else if (password) {
        data.password = password; // use edited password if changed
      }

      if (selectedType === 'Normal') data.salaryPerDay = salaryPerDay;
      if (selectedType === 'Boxmaker') {
        data.salaryFullBox = salaryFullBox;
        data.salaryHalfBox = salaryHalfBox;
        data.salaryOneSide = salaryOneSide;
      }

      if (currentId) {
        await update(ref(database, `${path}/${currentId}`), data);
      } else {
        await set(push(dbRef), data);
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
    setPassword('');
    setEditMode(false);
    setCurrentId(null);
    setSalaryPerDay('');
    setSalaryFullBox('');
    setSalaryHalfBox('');
    setSalaryOneSide('');
    setModalVisible(false);
  };

  const handleEdit = (item) => {
    setName(item.name);
    setPassword(item.password || '');
    setEditMode(true);
    setCurrentId(item.id);
    if (item.salaryPerDay) setSalaryPerDay(item.salaryPerDay);
    if (item.salaryFullBox) setSalaryFullBox(item.salaryFullBox);
    if (item.salaryHalfBox) setSalaryHalfBox(item.salaryHalfBox);
    if (item.salaryOneSide) setSalaryOneSide(item.salaryOneSide);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await set(ref(database, `${dbPath(selectedType)}/${id}`), null);
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  const handleCopyId = (id) => {
    Clipboard.setString(id);
    Alert.alert('Copied', 'Staff ID copied to clipboard');
  };

  return (
    <View style={GLOBAL_STYLES.container}>
      {/* Header */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Staff Management</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Staff Type Picker */}
      <View style={styles.pickerContainer}>
        <CustomPicker
          options={staffTypes}
          selectedValue={selectedType}
          onValueChange={setSelectedType}
          placeholder="Select staff type"
        />
      </View>

      {/* Staff List */}
      <ScrollView style={{ marginTop: 15 }}>
        {items.map((item) => (
          <View key={item.id} style={GLOBAL_STYLES.listItem}>
            <View style={GLOBAL_STYLES.row}>
              <Text style={styles.name}>{item.name}</Text>
              {item.salaryPerDay && (
                <Text style={styles.subText}>Salary/day: ₹{item.salaryPerDay}</Text>
              )}
              {item.salaryFullBox && (
                <Text style={styles.subText}>
                  Full: ₹{item.salaryFullBox} | Half: ₹{item.salaryHalfBox} | Side: ₹{item.salaryOneSide}
                </Text>
              )}
            </View>

            <View style={GLOBAL_STYLES.row}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 15 }}>
                <Feather name="edit-3" size={22} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleCopyId(item.id)} style={{ marginRight: 15 }}>
                <MaterialIcons name="content-copy" size={22} color={COLORS.secondary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Feather name="trash-2" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal for Add/Edit */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit' : 'Add'}
            </Text>

            <TextInput
              style={GLOBAL_STYLES.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={GLOBAL_STYLES.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
            />

            {selectedType === 'Normal' && (
              <TextInput
                style={GLOBAL_STYLES.input}
                placeholder="Salary per day"
                value={salaryPerDay}
                onChangeText={setSalaryPerDay}
                keyboardType="numeric"
              />
            )}

            {selectedType === 'Boxmaker' && (
              <>
                <TextInput
                  style={GLOBAL_STYLES.input}
                  placeholder="Full Box Salary"
                  value={salaryFullBox}
                  onChangeText={setSalaryFullBox}
                  keyboardType="numeric"
                />
                <TextInput
                  style={GLOBAL_STYLES.input}
                  placeholder="Half Box Salary"
                  value={salaryHalfBox}
                  onChangeText={setSalaryHalfBox}
                  keyboardType="numeric"
                />
                <TextInput
                  style={GLOBAL_STYLES.input}
                  placeholder="One Side Salary"
                  value={salaryOneSide}
                  onChangeText={setSalaryOneSide}
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[GLOBAL_STYLES.button, { flex: 1, marginRight: 8 }]}
                onPress={handleAddOrUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={GLOBAL_STYLES.buttonText}>
                    {editMode ? 'Update' : 'Add'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[GLOBAL_STYLES.button, { backgroundColor: '#999', flex: 1 }]}
                onPress={resetForm}
              >
                <Text style={GLOBAL_STYLES.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: { margin: 10 },
  name: { fontSize: SIZE.sizes.md, fontWeight: 'bold' },
  subText: { color: COLORS.gray, marginTop: 3 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
});
