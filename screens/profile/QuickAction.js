import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Switch, Alert, ActivityIndicator, TextInput, StyleSheet, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ref, push, set, update, onValue } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, GLOBAL_STYLES } from '../../theme/theme';
import { Feather } from '@expo/vector-icons';
const menuItems = [
  { icon: 'account-group', label: 'Workers', screen: 'ListScreen', params: { name: 'Workers', dataType: 'Workers', detailScreen: 'WorkerDetail' } },
  { icon: 'account-box', label: 'Box Buyers', screen: 'ListScreen', params: { name: 'Box Buyers', dataType: 'BoxBuyers', detailScreen: 'BoxBuyerDetails' } },
  { icon: 'hammer', label: 'Box Makers', screen: 'ListScreen', params: { name: 'Box Makers', dataType: 'BoxMakers', detailScreen: 'BoxMakerDetail' } },
  { icon: 'truck', label: 'Transporters', screen: 'ListScreen', params: { name: 'Transporters', dataType: 'Transporters', detailScreen: 'TransporterDetail' } },
  { icon: 'tree', label: 'Wood Cutters', screen: 'ListScreen', params: { name: 'Wood Cutters', dataType: 'WoodCutter', detailScreen: 'WoodCutterDetail' } },
  { icon: 'tree', label: 'Flat Logs', screen: 'FlatLogSaved' },
  { icon: 'pine-tree', label: 'Round Logs', screen: 'LogSaved' },
  { icon: 'calculator', label: 'Calculators', screen: 'Calculators' },
  { icon: 'calendar-check', label: 'Attendance', screen: 'Attendance' },
  { icon: 'cash-minus', label: 'Other Expenses', screen: 'ListScreen', params: { name: 'Other Expenses', dataType: 'OtherExpenses', detailScreen: 'OtherExpenses' } },
  { icon: 'cash-plus', label: 'Other Income', screen: 'ListScreen', params: { name: 'Other Income', dataType: 'OtherIncome', detailScreen: 'OtherIncome' } },
  { icon: 'bell-outline', label: 'Notifications', screen: 'Notifications' },
];

export default function QuickAction({ millKey }) {
  const [actions, setActions] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch QuickActions
  useEffect(() => {
    const dbRef = ref(database, `Mills/${millKey}/QuickActions`);
    return onValue(dbRef, snapshot => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      list.sort((a, b) => a.position - b.position);
      setActions(list);
    });
  }, []);

  const resetForm = () => {
    setSelectedMenu('');
    setVisible(true);
    setPosition('');
    setEditId(null);
    setModalVisible(false);
  };

  const handleAddOrUpdate = async () => {
    if (!selectedMenu) return Alert.alert('Error', 'Please select a menu item');
    if (!position) return Alert.alert('Error', 'Position is required');

    const positionConflict = actions.find(a => a.position === Number(position) && a.id !== editId);
    if (positionConflict) {
      Alert.alert(
        'Position Conflict',
        `Another action (${positionConflict.label}) is already at this position. Do you want to shift it down?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              const updates = {};
              actions.forEach(a => {
                if (a.position >= Number(position)) {
                  updates[`${a.id}/position`] = a.position + 1;
                }
              });
              await update(ref(database, `Mills/${millKey}/QuickActions`), updates);
              saveAction();
            }
          }
        ]
      );
      return;
    }

    saveAction();
  };

  const saveAction = async () => {
    setLoading(true);
    try {
      const menuItem = menuItems.find(m => m.label === selectedMenu);
      const data = { ...menuItem, visible, position: Number(position) };
      const path = `Mills/${millKey}/QuickActions`;

      if (editId) {
        await update(ref(database, `${path}/${editId}`), data);
      } else {
        const newRef = push(ref(database, path));
        await set(newRef, data);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save quick action');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedMenu(item.label);
    setVisible(item.visible);
    setPosition(String(item.position));
    setEditId(item.id);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => { await set(ref(database, `Mills/${millKey}/QuickActions/${id}`), null); } },
    ]);
  };

  const availableMenuItems = menuItems.filter(m => !actions.some(a => a.label === m.label && a.id !== editId));

  return (
    <View style={GLOBAL_STYLES.container}>
          <View style={GLOBAL_STYLES.headerContainer}>
            <Text style={GLOBAL_STYLES.headerText}>Quick Actions</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Feather name={modalVisible ? 'x' : 'plus'} size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
      <FlatList
        data={actions}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection:'row', alignItems:'center' }}>
              <MaterialCommunityIcons name={item.icon || 'checkbox-blank-circle-outline'} size={28} color={COLORS.primary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontWeight:'bold', fontSize:16 }}>{item.label}</Text>
                <Text style={{ color:'#555' }}>Pos: {item.position}, Visible: {item.visible ? <Switch value={true} />:<Switch value={false} />}</Text>
              </View>
            </View>
            <View style={{ flexDirection:'row' }}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight:10 }}>
                <AntDesign name="edit" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <AntDesign name="delete" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add Button Bottom Right */}


      {/* Modal */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize:18, fontWeight:'bold', marginBottom:10 }}>{editId ? 'Edit Quick Action' : 'New Quick Action'}</Text>

            <Text style={{ marginBottom:5 }}>Select Menu Item</Text>
            <View style={{ borderWidth:1, borderColor:'#ccc', borderRadius:6, marginBottom:15 }}>
              <Picker selectedValue={selectedMenu} onValueChange={setSelectedMenu}>
                {availableMenuItems.map(m => <Picker.Item key={m.label} label={m.label} value={m.label} />)}
              </Picker>
            </View>

            <Text style={{ marginBottom:5 }}>Position</Text>
            <TextInput
              style={GLOBAL_STYLES.input}
              placeholder="Position"
              value={position}
              onChangeText={setPosition}
              keyboardType="numeric"
            />

            <View style={{ flexDirection:'row', alignItems:'center', marginVertical:10 }}>
              <Text>Visible</Text>
              <Switch value={visible} onValueChange={setVisible} />
            </View>

            <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
              <TouchableOpacity style={GLOBAL_STYLES.button} onPress={handleAddOrUpdate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={GLOBAL_STYLES.buttonText}>{editId ? 'Update' : 'Add'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[GLOBAL_STYLES.button,{backgroundColor:'#999'}]} onPress={resetForm}>
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
  card: {
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    padding:15,
    backgroundColor:'#f9f9f9',
    marginBottom:10,
    borderRadius:12,
    elevation:2
  },
  addButton: {
    position:'absolute',
    bottom:30,
    right:30,
    zIndex:10,
  },
  modalBackground: {
    flex:1,
    backgroundColor:'rgba(0,0,0,0.5)',
    justifyContent:'center',
    alignItems:'center'
  },
  modalContent: {
    width:'90%',
    backgroundColor:'#fff',
    borderRadius:12,
    padding:20,
    elevation:5
  }
});
