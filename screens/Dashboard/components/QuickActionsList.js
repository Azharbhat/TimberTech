import React, { useState, useEffect } from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../Firebase/FirebaseConfig';
import { COLORS, GLOBAL_STYLES } from '../../../theme/theme';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

export default function QuickActionsList({ navigation }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const millKey = useSelector((state) => state.mill.millKey);

  useEffect(() => {
    if (!millKey) return;

    const dbRef = ref(database, `Mills/${millKey}/QuickActions`);
    const unsubscribe = onValue(dbRef, snapshot => {
      const data = snapshot.val() || {};
      const list = Object.keys(data)
        .map(key => ({ id: key, ...data[key] }))
        .sort((a, b) => a.position - b.position);
      setActions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [millKey]);

  if (!millKey || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (actions.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No Quick Actions available</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={GLOBAL_STYLES.kpiHeaderText}>Quick Actions</Text>
      <FlatList
        horizontal
        data={actions.filter(a => a.visible)}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0 }}
        renderItem={({ item }) => (
          <LinearGradient
            colors={['#bb6701ff', '#ddad00ff']} // you can customize per item
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            <TouchableOpacity
              style={styles.flatListButton}
              onPress={() => {
                if (!item.screen) return;
                navigation.navigate(item.screen, item.params || {});
              }}
            >
              <Icon name={item.icon || 'checkbox-blank-circle-outline'} size={40} color="white" />
              <Text style={styles.flatListText}>{item.label}</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom:16
  },
  gradientCard: {
    borderRadius: 12,
    marginHorizontal: 8,
  },
  flatListButton: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  flatListText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  header: {
    color: '#2f3640',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
});
