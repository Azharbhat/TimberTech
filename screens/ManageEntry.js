// screens/ManageEntry.js
import React from 'react';
import { View } from 'react-native';
import StaffComponent from './profile/StaffComponent';
import SeasonManagerComponent from './profile/SeasonManagerComponent';
import QuickAction from './profile/QuickAction';
import { GLOBAL_STYLES } from '../theme/theme';

export default function ManageEntry({ route }) {
  const { millKey, type } = route.params;

  return (
    <View style={GLOBAL_STYLES.container}>
      {type === 'staff' && <StaffComponent millKey={millKey} />}
      {type === 'season' && <SeasonManagerComponent millKey={millKey} />}
      {type === 'quickAction' && <QuickAction millKey={millKey} />}
    </View>
  );
}
