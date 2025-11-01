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
  const [payedPrice, setPayedPrice] = useState('');

  const flatListRef = useRef(null);

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
      payedPrice: parseFloat(payedPrice) || 0,
    };
    const entryRef = ref(database, `Mills/${millKey}/LogCalculations/${finalName}`);
    push(entryRef, entry);
    setResults([]);
    setSaveName('');
    setSelectedName('');
    setBuyedPrice('');
    setPayedPrice('');
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
      <Text style={GLOBAL_STYLES.itemText}>Total: {calculateTotal()}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.rowHeader, { flex: 0.5 }]}>S/No</Text>
        <Text style={styles.rowHeader}>Length</Text>
        <Text style={styles.rowHeader}>Thickness</Text>
        <Text style={styles.rowHeader}>Result</Text>
      </View>

      {/* RESULTS LIST */}
      <FlatList
        ref={flatListRef}
        data={results}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.rowText, { flex: 0.5 }]}>{index + 1}</Text>
            <Text style={styles.rowText}>{item.num1}</Text>
            <Text style={styles.rowText}>{item.selectedValue}</Text>
            <Text style={styles.rowText}>{item.result}</Text>
          </View>
        )}
        style={{ marginHorizontal: 10, marginTop: 5, marginBottom: 140 }}
      />

      {/* INPUT ROW */}
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <CustomPicker
            options={pickerValues}
            selectedValue={selectedValue}
            onValueChange={setSelectedValue}
            placeholder="Select Thickness"
          />
        </View>

        <TextInput
          style={[GLOBAL_STYLES.searchInput, { flex: 1, marginLeft: 5 }]}
          placeholder="Enter number"
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
          <View style={styles.menuBox}>
            <TouchableOpacity onPress={() => { setMenuVisible(false); setSaveModalVisible(true); }} style={styles.menuItem}>
              <Text style={styles.menuText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuVisible(false); navigation.navigate('LogSaved', { millKey }); }} style={styles.menuItem}>
              <Text style={styles.menuText}>View Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleClear(); setMenuVisible(false); }} style={styles.menuItem}>
              <Text style={[styles.menuText, { color: 'red' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* SAVE MODAL */}
      <Modal transparent visible={saveModalVisible} animationType="slide" onRequestClose={() => setSaveModalVisible(false)}>
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={GLOBAL_STYLES.modalBox}>
            <Text style={GLOBAL_STYLES.modalTitle}>Save Calculation</Text>

            <CustomPicker
              options={['New User', ...existingNames]}
              selectedValue={selectedName || 'New User'}
              onValueChange={value => {
                if (value === 'New User') {
                  setSelectedName('');
                } else {
                  setSelectedName(value);
                  setSaveName('');
                }
              }}
              placeholder="Select user"
            />

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
              <TextInput
                style={{ flex: 1, borderBottomColor: COLORS.border, borderBottomWidth: 1, marginVertical: 8, marginLeft: 5 }}
                placeholder="Payed Price"
                keyboardType="numeric"
                value={payedPrice}
                onChangeText={setPayedPrice}
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
    marginHorizontal: 10,
    backgroundColor: '#fff',
    elevation: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  totalContainer: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 70,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBox: { backgroundColor: COLORS.white, borderRadius: 8, width: 180, elevation: 5, paddingVertical: 5 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 15 },
  menuText: { color: COLORS.text },
});

export default LogCalculator;
