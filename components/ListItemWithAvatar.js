import React from 'react';
import { View, Text } from 'react-native';
import { GLOBAL_STYLES ,COLORS} from '../theme/theme';

// AvatarCircle Component
const AvatarCircle = ({ name, size = 60, backgroundColor = COLORS.border, textColor = '#fff' }) => {
  const displayName = name || 'unknown';

  // Generate up to 3 letters
  const avatarLetters = displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
      }}
    >
      <Text style={{ color: textColor, fontWeight: 'bold' }}>{avatarLetters}</Text>
    </View>
  );
};

// ListItemWithAvatar Component (presentational only)
const ListItemWithAvatar = ({ item, avatarSize = 50 }) => {
  const name = item?.name || 'unknown';
  const timestamp = item?.timestamp ? new Date(item.timestamp).toLocaleString() : null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 8,
        ...GLOBAL_STYLES.itemBox,
      }}
    >
      {/* Avatar */}
      <AvatarCircle name={name} size={avatarSize} />

      {/* Name & Timestamp */}
      <View style={{ flex: 1 }}>
        <Text style={GLOBAL_STYLES.itemText}>{name}</Text>
        {timestamp && (
          <Text style={[GLOBAL_STYLES.itemText, { fontSize: 12, color: '#888', marginTop: 2 }]}>
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  );
};

export default ListItemWithAvatar;
