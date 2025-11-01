  // components/ThemeManager.js
  import React, { useEffect, useState } from 'react';
  import { View, Text, TextInput, Pressable, ScrollView, Modal, Alert } from 'react-native';
  import { ref, get, push, update, remove } from 'firebase/database';
  import { database } from '../Firebase/FirebaseConfig';
  import { FONTS, getColors } from '../theme/theme';

  export default function ThemeManager({ millKey, colors, setColors }) {
    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const [themes, setThemes] = useState({});
    const [selectedThemeId, setSelectedThemeId] = useState(null);
    const [form, setForm] = useState({
      name: '',
      colors: {},
      fonts: {},
      sizes: {},
    });

    useEffect(() => {
      fetchThemes();
    }, []);

    const fetchThemes = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${millKey}/theme/customThemes`));
        if (snapshot.exists()) {
          setThemes(snapshot.val());
        }
      } catch (err) {
        console.error(err.message);
      }
    };

    const handleChange = (section, keyName, value) => {
      setForm({ ...form, [section]: { ...form[section], [keyName]: value } });
    };

    const handleSaveTheme = async () => {
      if (!form.name) return Alert.alert('Error', 'Theme name is required');
      try {
        const themeRef = selectedThemeId
          ? ref(database, `Mills/${millKey}/theme/customThemes/${selectedThemeId}`)
          : push(ref(database, `Mills/${millKey}/theme/customThemes`));

        await update(themeRef, form);
        Alert.alert('Success', 'Theme saved!');
        setForm({ name: '', colors: {}, fonts: {}, sizes: {} });
        setSelectedThemeId(null);
        fetchThemes();
      } catch (err) {
        console.error(err.message);
      }
    };

    const handleDeleteTheme = async (themeId) => {
      try {
        await remove(ref(database, `Mills/${millKey}/theme/customThemes/${themeId}`));
        Alert.alert('Deleted', 'Theme removed');
        fetchThemes();
      } catch (err) {
        console.error(err.message);
      }
    };

    const handleEditTheme = (themeId) => {
      const theme = themes[themeId];
      setSelectedThemeId(themeId);
      setForm(theme);
    };

    const handleApplyTheme = (themeId) => {
      const theme = themes[themeId];
      if (theme && theme.colors) {
        const mergedColors = getColors(theme.colors);
        setColors(mergedColors);
        Alert.alert('Theme Applied', `Applied theme: ${theme.name}`);
      }
    };
    return (
      <View style={{ width: '100%' }}>
        <Pressable
          style={{ backgroundColor: colors.primary, padding: 12, marginVertical: 10 }}
          onPress={() => setThemeModalVisible(true)}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Theme Manager</Text>
        </Pressable>

        <Modal visible={themeModalVisible} animationType="slide">
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 24, fontFamily: FONTS.extraBold, marginBottom: 15 }}>
              Manage Themes
            </Text>

            {/* Theme Form */}
            <TextInput
              placeholder="Theme Name"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              style={{ marginBottom: 10, borderWidth: 1, padding: 10 }}
            />
            {['primary', 'secondary', 'accent', 'text', 'border', 'cardBg'].map((c) => (
              <TextInput
                key={c}
                placeholder={`Color ${c}`}
                value={form.colors[c] || ''}
                onChangeText={(val) => handleChange('colors', c, val)}
                style={{ marginBottom: 10, borderWidth: 1, padding: 10 }}
              />
            ))}

            <Pressable
              style={{ backgroundColor: '#4CAF50', padding: 12, marginVertical: 10 }}
              onPress={handleSaveTheme}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>
                {selectedThemeId ? 'Update Theme' : 'Add Theme'}
              </Text>
            </Pressable>

            {/* List of Themes */}
            {Object.keys(themes).map((id) => (
              <View
                key={id}
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}
              >
                <Text style={{ fontSize: 16 }}>{themes[id].name}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <Pressable onPress={() => handleApplyTheme(id)} style={{ marginRight: 10 }}>
                    <Text style={{ color: 'green' }}>Apply</Text>
                  </Pressable>
                  <Pressable onPress={() => handleEditTheme(id)} style={{ marginRight: 10 }}>
                    <Text style={{ color: 'blue' }}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteTheme(id)}>
                    <Text style={{ color: 'red' }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable
              style={{ backgroundColor: '#888', padding: 12, marginTop: 20 }}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
            </Pressable>
          </ScrollView>
        </Modal>
      </View>
    );
  }
