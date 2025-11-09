import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Keyboard,
} from 'react-native';
import { ref, push, serverTimestamp, onValue } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { GLOBAL_STYLES, COLORS, SIZE } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import CustomPicker from '../../components/CustomPicker';
import { useSelector, useDispatch } from 'react-redux';

import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';
const LogCalculator = ({ route, navigation }) => {
  const inputRef = useRef(null);

  const dispatch = useDispatch();
  const { millKey, millData } = useSelector((state) => state.mill);
  const [num1, setNum1] = useState('');
  const [selectedValue, setSelectedValue] = useState('3.6');
  const [results, setResults] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [existingNames, setExistingNames] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [buyedPrice, setBuyedPrice] = useState('');

  const flatListRef = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleEditChange = (index, key, value) => {
    const updated = [...results];
    if (key === 'num1' && !/^\d*\.?\d*$/.test(value)) return; // numeric only

    updated[index] = {
      ...updated[index],
      [key]: value,
    };

    // Recalculate result dynamically
    const num1Val = parseFloat(updated[index].num1) || 0;
    const selectedVal = parseFloat(updated[index].selectedValue) || 0;
    const newResult = ((num1Val ** 2) * selectedVal) / 2304 - 0.01;
    updated[index].result = Math.floor(newResult * 100) / 100;

    setResults(updated);
  };

  const handleSaveEdit = (index) => {
    setEditingIndex(null);
  };


  const pickerValues = ['3.6', '5.25', '1.9', '2.6', '6', '7', '8', '9', '10', '11', '12'];
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'LogCalculations'));

    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'LogCalculations'));
    };
  }, [millKey]);

  useEffect(() => {
    const entryRef = ref(database, `Mills/${millKey}/LogCalculations`);
    onValue(entryRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setExistingNames(Object.keys(data));
      }
    });
  }, [millKey]);

  // Scroll to bottom whenever results change
  useEffect(() => {
    if (results.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [results]);

  const handleCalculate = () => {
    if (!num1) return Alert.alert('Error', 'Please enter a number');
    const sum = ((parseFloat(num1) ** 2) * parseFloat(selectedValue)) / 2304 - 0.01;
    const roundedResult = Math.floor(sum * 100) / 100;
    setResults([...results, { num1: parseFloat(num1), selectedValue: parseFloat(selectedValue), result: roundedResult.toFixed(2) }]);
    setNum1('');
  };

  const calculateTotal = () => results.reduce((acc, curr) => acc + parseFloat(curr.result), 0).toFixed(2);

  const confirmSave = () => {
    const finalName = saveName.trim() || selectedName;
    if (!finalName) return Alert.alert('Error', 'Please enter or select a name.');
    const entry = {
      timestamp: serverTimestamp(),
      data: results,
      total: results.reduce((acc, curr) => acc + parseFloat(curr.result), 0),
      buyedPrice: parseFloat(buyedPrice) || 0,
    };
    const entryRef = ref(database, `Mills/${millKey}/LogCalculations/${finalName}/Calculations`);
    push(entryRef, entry);
    setResults([]);
    setSaveName('');
    setSelectedName('');
    setBuyedPrice('');
    setSaveModalVisible(false);
    Alert.alert('Success', 'Saved Successfully!');
  };

  const handleClear = () => setResults([]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* HEADER */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Log Calculator</Text>

        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* RESULTS TABLE HEADER */}

      <View style={styles.tableHeader}>
        <Text style={[styles.rowHeader, { flex: 0.5 }]}>S/No</Text>
        <Text style={styles.rowHeader}>Length</Text>
        <Text style={styles.rowHeader}>Thickness</Text>
        <Text style={styles.rowHeader}>Result</Text>
      </View>
      <View style={{ justifyContent: 'center', alignItems: "center" }}>
        <Text style={GLOBAL_STYLES.listItemText}>Total: {calculateTotal()}</Text>
      </View>

      {/* RESULTS LIST */}
      <FlatList
        ref={flatListRef}
        data={results}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => {
          const isEditing = editingIndex === index;
          return (
            <TouchableOpacity
              onLongPress={() => setEditingIndex(isEditing ? null : index)}
              style={styles.tableRow}
            >
              <Text style={[styles.rowText, { flex: 0.5 }]}>{index + 1}</Text>

              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.rowText, { borderBottomWidth: 1, flex: 1 }]}
                    keyboardType="numeric"
                    value={item.num1.toString()}
                    onChangeText={(text) => handleEditChange(index, 'num1', text)}
                  />
                  <CustomPicker
                    options={pickerValues}
                    selectedValue={item.selectedValue.toString()}
                    onValueChange={(value) => handleEditChange(index, 'selectedValue', value)}
                  />
                  <Text style={[styles.rowText, { flex: 1 }]}>
                    {item.result}
                  </Text>
                  <TouchableOpacity onPress={() => handleSaveEdit(index)}>
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.rowText}>{item.num1}</Text>
                  <Text style={styles.rowText}>{item.selectedValue}</Text>
                  <Text style={styles.rowText}>{item.result}</Text>
                </>
              )}
            </TouchableOpacity>
          );
        }}
        style={{ marginHorizontal: 10, marginTop: 5, marginBottom: 140 }}
      />


      {/* INPUT ROW */}
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <CustomPicker
            options={pickerValues}
            selectedValue={selectedValue}
            onValueChange={(value) => {
              setSelectedValue(value);

              // Force keyboard to open after picker closes
              setTimeout(() => {
                inputRef.current?.focus();
                Keyboard.dismiss(); // reset any pending keyboard states
                setTimeout(() => inputRef.current?.focus(), 150); // second focus to ensure keyboard opens
              }, 250);
            }}
            placeholder="Select Thickness"
          />

        </View>

        <TextInput
          style={[GLOBAL_STYLES.searchInput, { flex: 1, marginLeft: 5 }]}
          placeholder="Value"
          ref={inputRef}
          keyboardType="numeric"
          value={num1}
          onChangeText={text => /^\d*\.?\d*$/.test(text) && setNum1(text)}
        />

        <TouchableOpacity style={[GLOBAL_STYLES.button, { flex: 1, marginLeft: 5 }]} onPress={handleCalculate}>
          <Text style={GLOBAL_STYLES.buttonText}>Calculate</Text>
        </TouchableOpacity>
      </View>

      {/* MENU MODAL */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={GLOBAL_STYLES.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={GLOBAL_STYLES.modalBox}>
            <TouchableOpacity onPress={() => { setMenuVisible(false); setSaveModalVisible(true); }} style={styles.menuItem}>
              <Text style={GLOBAL_STYLES.modalTitle}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuVisible(false); navigation.navigate('LogSaved', { millKey }); }} style={styles.menuItem}>
              <Text style={GLOBAL_STYLES.modalTitle}>View Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleClear(); setMenuVisible(false); }} style={styles.menuItem}>
              <Text style={[GLOBAL_STYLES.modalTitle, { color: 'red' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* SAVE MODAL */}
      <Modal transparent visible={saveModalVisible} animationType="slide" onRequestClose={() => setSaveModalVisible(false)}>
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={GLOBAL_STYLES.modalBox}>
            <Text style={GLOBAL_STYLES.modalTitle}>Save Calculation</Text>

            <View style={{ flex: 1 }}>
              <CustomPicker
                options={pickerValues}
                selectedValue={selectedValue}
                onValueChange={(value) => {
                  setSelectedValue(value);
                  setTimeout(() => {
                    inputRef.current?.focus();
                    Keyboard.dismiss();
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }, 150);
                }}
                placeholder="Select Thickness"
              />
            </View>


            {(selectedName === '' || selectedName === 'New User') && (
              <TextInput
                style={{ borderBottomColor: COLORS.border, borderBottomWidth: 1, marginVertical: 8 }}
                placeholder="Enter new name"
                value={saveName}
                onChangeText={text => setSaveName(text)}
              />
            )}

            <View style={{ flexDirection: 'row', marginTop: 30, justifyContent: 'space-between' }}>
              <TextInput
                style={{ flex: 1, borderBottomColor: COLORS.border, borderBottomWidth: 1, marginVertical: 8, marginRight: 5 }}
                placeholder="Buyed Price"
                keyboardType="numeric"
                value={buyedPrice}
                onChangeText={setBuyedPrice}
              />
            </View>

            <View style={{ flexDirection: 'row', marginTop: 15 }}>
              <TouchableOpacity
                style={[GLOBAL_STYLES.button, { flex: 1, marginRight: 5 }]}
                onPress={confirmSave}
              >
                <Text style={GLOBAL_STYLES.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[GLOBAL_STYLES.button, { flex: 1, marginLeft: 5, backgroundColor: 'gray' }]}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={GLOBAL_STYLES.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },
  rowHeader: { flex: 1, textAlign: 'center', color: 'white' },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  rowText: { flex: 1, textAlign: 'center', color: COLORS.text },
  inputRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    // marginHorizontal: 10,
    backgroundColor: '#fff',
    elevation: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },

  menuBox: { backgroundColor: COLORS.white, borderRadius: 8, width: 180, elevation: 5, paddingVertical: 5 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 15 },
  menuText: { color: COLORS.text },
});

export default LogCalculator;
