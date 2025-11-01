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
  ScrollView,
  Alert,
} from 'react-native';
import { ref, push, serverTimestamp, onValue } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import CustomPicker from '../../components/CustomPicker';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../../src/redux/slices/millSlice';

const FlatLogCalculator = ({ route, navigation }) => {
  const { millKey, millData } = useSelector((state) => state.mill);
  const dispatch = useDispatch();
  const [lengthFeet, setLengthFeet] = useState('');
  const [breadthInches, setBreadthInches] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [results, setResults] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [existingNames, setExistingNames] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [selledPrice, setSelledPrice] = useState('');
  const [payedPrice, setPayedPrice] = useState('');

  const inputRefs = {
    lengthFeet: useRef(null),
    breadthInches: useRef(null),
    heightInches: useRef(null),
    quantity: useRef(null),
    pricePerUnit: useRef(null),
  };

  const flatListRef = useRef(null);
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey, 'FlatLogCalculations'));

    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey, 'FlatLogCalculations'));
    };
  }, [millKey]);

  useEffect(() => {
    const entryRef = ref(database, `Mills/${millKey}/FlatLogCalculations`);
    onValue(entryRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setExistingNames(Object.keys(data));
      }
    });
  }, [millKey]);

  useEffect(() => {
    if (results.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [results]);

  const handleCalculate = () => {
    if (!lengthFeet) return inputRefs.lengthFeet.current.focus();
    if (!breadthInches) return inputRefs.breadthInches.current.focus();
    if (!heightInches) return inputRefs.heightInches.current.focus();
    if (!quantity) return inputRefs.quantity.current.focus();
    if (!pricePerUnit) return inputRefs.pricePerUnit.current.focus();

    const area = (parseFloat(lengthFeet) * parseFloat(breadthInches) * parseFloat(heightInches) * parseFloat(quantity)) / 144;
    const totalPrice = area * parseFloat(pricePerUnit);

    setResults([
      ...results,
      {
        lengthFeet,
        breadthInches,
        heightInches,
        quantity,
        pricePerUnit,
        area: area.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
      },
    ]);

    // Clear inputs
    setLengthFeet('');
    setBreadthInches('');
    setHeightInches('');
    setQuantity('');
    setPricePerUnit('');
  };

  const calculateTotalArea = () => results.reduce((acc, curr) => acc + parseFloat(curr.area), 0).toFixed(2);
  const calculateTotalPrice = () => results.reduce((acc, curr) => acc + parseFloat(curr.totalPrice), 0).toFixed(2);

  const handleClear = () => setResults([]);

  const confirmSave = () => {
    const finalName = saveName.trim() || selectedName;
    if (!finalName) return Alert.alert('Error', 'Please enter or select a name.');

    const entry = {
      timestamp: serverTimestamp(),
      data: results,
      totalArea: parseFloat(calculateTotalArea()),
      totalPrice: parseFloat(calculateTotalPrice()),
      payedPrice: parseFloat(payedPrice) || 0,
    };

    const entryRef = ref(database, `Mills/${millKey}/FlatLogCalculations/${finalName}/calculation`);
    push(entryRef, entry);

    setResults([]);
    setSaveName('');
    setSelectedName('');
    setSelledPrice('');
    setPayedPrice('');
    setSaveModalVisible(false);
    Alert.alert('Success', 'Saved Successfully!');
  };

  const renderItem = ({ item, index }) => (
    <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? COLORS.card : COLORS.background }]}>
      {[
        ['S/No', index + 1],
        ['Length (feet)', item.lengthFeet],
        ['Breadth (inches)', item.breadthInches],
        ['Height (inches)', item.heightInches],
        ['Quantity', item.quantity],
        ['Area', item.area],
        ['Total Price', item.totalPrice],
      ].map(([label, value], idx) => (
        <View style={styles.row} key={idx}>
          <Text style={styles.rowLabel}>{label}:</Text>
          <Text style={styles.rowValue}>{value}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* HEADER */}
      <View style={[GLOBAL_STYLES.headerContainer, { backgroundColor: COLORS.primary }]}>
        <Text style={GLOBAL_STYLES.headerText}>FlatLog</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* TOTAL BOX */}
      <View style={[styles.totalContainer]}>
        <Text style={{ color: COLORS.text, fontWeight: '600' }}>Total Area: {calculateTotalArea()}</Text>
        <Text style={{ color: COLORS.text, fontWeight: '600' }}>Total Price: {calculateTotalPrice()}</Text>
      </View>

      {/* RESULTS LIST */}
      <FlatList
        ref={flatListRef}
        data={results}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        style={{ marginHorizontal: 10, marginBottom: 220 }}
      />

      {/* INPUT ROWS */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <View style={styles.inputBox}>
            <Text style={styles.label}>Length (feet)</Text>
            <TextInput style={styles.input} value={lengthFeet} onChangeText={setLengthFeet} keyboardType="numeric" ref={inputRefs.lengthFeet} />
          </View>
          <View style={styles.inputBox}>
            <Text style={styles.label}>Breadth (inches)</Text>
            <TextInput style={styles.input} value={breadthInches} onChangeText={setBreadthInches} keyboardType="numeric" ref={inputRefs.breadthInches} />
          </View>
          <View style={styles.inputBox}>
            <Text style={styles.label}>Height (inches)</Text>
            <TextInput style={styles.input} value={heightInches} onChangeText={setHeightInches} keyboardType="numeric" ref={inputRefs.heightInches} />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputBox}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" ref={inputRefs.quantity} />
          </View>
          <View style={styles.inputBox}>
            <Text style={styles.label}>Price / Unit</Text>
            <TextInput style={styles.input} value={pricePerUnit} onChangeText={setPricePerUnit} keyboardType="numeric" ref={inputRefs.pricePerUnit} />
          </View>
          <View style={[styles.inputBox, { justifyContent: 'flex-end' }]}>
            <TouchableOpacity style={[styles.calculateButton, { backgroundColor: COLORS.primary }]} onPress={handleCalculate}>
              <Text style={styles.buttonText}>Calculate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* MENU MODAL */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity onPress={() => { setMenuVisible(false); setSaveModalVisible(true); }} style={styles.menuItem}>
              <Text style={styles.menuText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuVisible(false); navigation.navigate('FlatLogSaved', { millKey }); }} style={styles.menuItem}>
              <Text style={styles.menuText}>View Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleClear(); setMenuVisible(false); }} style={styles.menuItem}>
              <Text style={[styles.menuText, { color: 'red' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* SAVE MODAL */}
      {/* SAVE MODAL */}
      <Modal transparent visible={saveModalVisible} animationType="slide" onRequestClose={() => setSaveModalVisible(false)}>
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={GLOBAL_STYLES.modalBox}>
            <Text style={GLOBAL_STYLES.modalTitle}>Save Calculation</Text>
            <ScrollView>
              <CustomPicker
                options={['New User', ...existingNames]}
                selectedValue={selectedName || 'New User'}
                onValueChange={value => {
                  if (value === 'New User') setSelectedName('');
                  else { setSelectedName(value); setSaveName(''); }
                }}
                placeholder="Select user"
              />
              {(selectedName === '' || selectedName === 'New User') && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Enter new name"
                  value={saveName}
                  onChangeText={setSaveName}
                />
              )}
              <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 5 }]}
                  placeholder="Payed Price"
                  keyboardType="numeric"
                  value={payedPrice}
                  onChangeText={setPayedPrice}
                />
              </View>
              <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <TouchableOpacity style={[styles.calculateButton, { flex: 1, marginRight: 5 }]} onPress={confirmSave}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.calculateButton, { flex: 1, marginLeft: 5, backgroundColor: COLORS.gray }]} onPress={() => setSaveModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputContainer: { position: 'absolute', left: 10, right: 10, bottom: 0, paddingVertical: 10, backgroundColor: COLORS.card, borderRadius: 10 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  inputBox: { flex: 1, marginHorizontal: 3 },
  label: { color: COLORS.text, marginBottom: 3, fontWeight: '600' },
  input: { height: 40, borderWidth: 1, borderColor: COLORS.border, borderRadius: 5, paddingHorizontal: 5, color: COLORS.text },
  calculateButton: { height: 40, justifyContent: 'center', borderRadius: 5 },
  buttonText: { color: 'black', textAlign: 'center', fontWeight: 'bold' },
  tableRow: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 0.5, borderColor: COLORS.border, borderRadius: 5, marginVertical: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  rowLabel: { color: COLORS.gray, fontWeight: '600' },
  rowValue: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
  totalContainer: { flexDirection: 'row', padding: 10, borderRadius: 10, justifyContent: 'space-between', backgroundColor: COLORS.card },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.4)', justifyContent: 'center', alignItems: 'center' },
  menuBox: { backgroundColor: COLORS.white, borderRadius: 8, width: 180, elevation: 5, paddingVertical: 5 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 15 },
  menuText: { fontSize: 16, color: COLORS.text },
  modalBox: { width: '90%', backgroundColor: COLORS.card, borderRadius: 10, padding: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
});

export default FlatLogCalculator;
