import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { GLOBAL_STYLES ,COLORS} from '../../../theme/theme';

export default function DashboardHeader({ millName, navigation, onMenuPress }) {
  return (
    <View >
      <View style ={GLOBAL_STYLES.headerContainer}>
      <Text style={GLOBAL_STYLES.headerText}>Dashboard</Text>
      <TouchableOpacity onPress={onMenuPress}>
        <Icon name="menu" size={32} color={COLORS.white}/>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#FFF',
    elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#8B4513' },
});
