// src/components/CustomPicker.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZE } from '../theme/theme';

const CustomPicker = ({ options = [], selectedValue, onValueChange, placeholder }) => {
  const [visible, setVisible] = useState(false);

  const handleSelect = (opt) => {
    const value = opt && typeof opt === 'object' ? opt.value : opt;
    onValueChange(value);
    setVisible(false);
  };

  const renderLabel = (opt) => (opt && typeof opt === 'object' ? opt.label : String(opt));

  return (
    <View>
      <TouchableOpacity style={styles.pickerContainer} onPress={() => setVisible(true)}>
        <Text style={styles.pickerText}>{selectedValue ? renderLabel(selectedValue) : (placeholder || 'Select')}</Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.text} />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={styles.optionBox}>
            <FlatList
              data={options}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.optionText}>{renderLabel(item)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: SIZE?.sizes?.medium || 14,
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBox: {
    width: '85%',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    maxHeight: 500,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  optionText: {
    fontSize: SIZE?.sizes?.medium || 14,
    color: COLORS.text,
  },
});

export default CustomPicker;
