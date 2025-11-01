import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, Pressable, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, GLOBAL_STYLES } from '../../theme/theme';
import { useSelector, useDispatch } from 'react-redux';
import { ref, set } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { setMillDataRealtime } from '../../src/redux/slices/millSlice';

export default function Profile({ navigation, setIsLoggedIn }) {
  const dispatch = useDispatch();
  const { millData, millKey } = useSelector(state => state.mill);

  const [millName, setMillName] = useState(millData?.millname || '');
  const [username, setUsername] = useState(millData?.username || '');
  const [profileImage, setProfileImage] = useState(millData?.image || '');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setMillName(millData?.millname || '');
    setUsername(millData?.username || '');
    setProfileImage(millData?.image || '');
  }, [millData]);

  const pickImage = async () => {
    if (!editMode) return;

    const confirm = await new Promise(resolve => {
      Alert.alert('Change Profile Image?', 'Do you want to select a new image?', [
        { text: 'Cancel', onPress: () => resolve(false) },
        { text: 'Yes', onPress: () => resolve(true) },
      ]);
    });

    if (!confirm) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) setProfileImage(result.assets[0].base64);
  };

  const handleUpdate = async () => {
    if (!millKey) return Alert.alert('Error', 'Mill key not found');

    try {
      const updates = {
        ...millData,
        millname: millName,
        username,
        image: profileImage ? `data:image/jpeg;base64,${profileImage}` : '',
      };
      await set(ref(database, `Mills/${millKey}`), updates);
      dispatch(setMillDataRealtime({ millData: updates, millKey }));
      Alert.alert('Updated!', 'Mill info has been updated.');
      setEditMode(false);
    } catch (err) {
      console.error('Update Error:', err);
      Alert.alert('Error', 'Failed to update mill info.');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('TimberTechTokken'); // remove token
      setIsLoggedIn(false); // notify AppContent to show AuthStack
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isUpdated = millName !== millData?.millname || username !== millData?.username || profileImage !== millData?.image;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={GLOBAL_STYLES.container}
    >
      {/* Header */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Profile</Text>
        <Pressable onPress={() => setEditMode(!editMode)}>
          <MaterialIcons name={editMode ? 'cancel' : 'edit'} size={28} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        {/* Profile Image */}
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Pressable onPress={pickImage}>
            <Image
              source={{ uri: profileImage || 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }}
              style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: COLORS.primary }}
            />
            {editMode && (
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 15, padding: 6 }}>
                <Feather name="camera" size={16} color="#fff" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Mill Name */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[FONTS.bodySmall, { marginBottom: 5 }]}>Mill Name</Text>
          {editMode ? (
            <TextInput value={millName} onChangeText={setMillName} style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff' }} />
          ) : (
            <Text style={[FONTS.bodyMedium, { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 }]}>{millName || '-'}</Text>
          )}
        </View>

        {/* Username */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[FONTS.bodySmall, { marginBottom: 5 }]}>Username</Text>
          {editMode ? (
            <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff' }} />
          ) : (
            <Text style={[FONTS.bodyMedium, { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 }]}>{username || '-'}</Text>
          )}
        </View>

        {/* Update Button */}
        {editMode && (
          <Pressable onPress={handleUpdate} disabled={!isUpdated} style={{ backgroundColor: isUpdated ? COLORS.secondary : '#ccc', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Update</Text>
          </Pressable>
        )}

        {/* Menu: Workers & Season Manager */}
        <View style={{ marginBottom: 20 }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }} onPress={() => navigation.navigate('ManageEntry', { millKey, type: 'staff' })}>
            <AntDesign name="usergroup-add" size={22} color={COLORS.primary} />
            <Text style={{ marginLeft: 15, fontSize: 16, color: COLORS.text }}>Your Staff</Text>
          </Pressable>

          <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }} onPress={() => navigation.navigate('ManageEntry', { millKey, type: 'season' })}>
            <Feather name="calendar" size={22} color={COLORS.primary} />
            <Text style={{ marginLeft: 15, fontSize: 16, color: COLORS.text }}>Manage Seasons</Text>
          </Pressable>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }} onPress={() => navigation.navigate('ManageEntry', { millKey, type: 'quickAction' })}>
            <Feather name="calendar" size={22} color={COLORS.primary} />
            <Text style={{ marginLeft: 15, fontSize: 16, color: COLORS.text }}>QuickActions</Text>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginTop: 40 }}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          <Text style={{ marginLeft: 15, fontSize: 16, color: COLORS.danger }}>Logout</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
