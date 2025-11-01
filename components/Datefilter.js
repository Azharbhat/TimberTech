import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../theme/theme';

const DateFilter = ({
  filters = ['day', 'week', 'month', 'year', 'all'],
  onSelect,
  dataSets = [],
}) => {
  const [selectedFilter, setSelectedFilter] = useState('month');
  const [customRange, setCustomRange] = useState({ type: null, from: null, to: null });

  // Picker control
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'day' or 'range'
  const [pickerStep, setPickerStep] = useState(1);
  const [tempRange, setTempRange] = useState({ from: null, to: null });
  const [pickerDate, setPickerDate] = useState(new Date());

  // Dropdown state
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState(null);
  const [selectedDropdownValue, setSelectedDropdownValue] = useState(null);

  // -----------------------
  // Date helpers
  // -----------------------
  const formatDate = (d) =>
    d ? d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const weekBoundsForDate = (d) => {
    const date = new Date(d);
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  };

  const monthBoundsForDate = (d) => {
    const date = new Date(d);
    const from = new Date(date.getFullYear(), date.getMonth(), 1);
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  };

  const yearBoundsForDate = (d) => {
    const date = new Date(d);
    const from = new Date(date.getFullYear(), 0, 1);
    const to = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { from, to };
  };

  // -----------------------
  // Filtering logic
  // -----------------------
  const filteredResults = useMemo(() => {
    if (!customRange.from || !customRange.to) return dataSets;
    const results = {};
    dataSets.forEach((ds) => {
      if (ds.data && ds.dateKey) {
        results[ds.name || ds.dateKey] = ds.data.filter((item) => {
          const date = new Date(item[ds.dateKey]);
          return date >= customRange.from && date <= customRange.to;
        });
      }
    });
    return results;
  }, [dataSets, customRange]);

  useEffect(() => {
    if (onSelect) onSelect(selectedFilter, filteredResults, customRange);
  }, [selectedFilter, filteredResults, customRange]);

  // -----------------------
  // Single tap selection
  // -----------------------
  const handleSelect = (item) => {
    const now = new Date();
    let from, to;

    switch (item) {
      case 'day':
        from = new Date(now.setHours(0, 0, 0, 0));
        to = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        ({ from, to } = weekBoundsForDate(now));
        break;
      case 'month':
        ({ from, to } = monthBoundsForDate(now));
        break;
      case 'year':
        ({ from, to } = yearBoundsForDate(now));
        break;
      default:
        from = null;
        to = null;
    }

    setSelectedFilter(item);
    setCustomRange({ type: item, from, to });
  };

  // -----------------------
  // Long press selection
  // -----------------------
  const handleLongPress = (item) => {
    if (item === 'week' || item === 'month' || item === 'year') {
      setDropdownType(item);
      setDropdownVisible(true);
      return;
    }

    if (item === 'day') {
      setPickerType('day');
      setShowPicker(true);
      return;
    }

    if (item === 'all') {
      setPickerType('range');
      setPickerStep(1);
      setTempRange({ from: null, to: null });
      setShowPicker(true);
    }
  };

  // -----------------------
  // Dropdown
  // -----------------------
  const getDropdownOptions = () => {
    const now = new Date();

    if (dropdownType === 'month') {
      return [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
    }

    if (dropdownType === 'week') {
      const { from } = monthBoundsForDate(now);
      const weeks = [];
      const temp = new Date(from);
      let count = 1;
      while (temp.getMonth() === now.getMonth()) {
        weeks.push(`Week ${count}`);
        temp.setDate(temp.getDate() + 7);
        count++;
      }
      return weeks;
    }

    if (dropdownType === 'year') {
      const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
      return years;
    }

    return [];
  };

  const handleDropdownSelect = (value) => {
    const now = new Date();
    let from, to;

    if (dropdownType === 'month') {
      const monthIndex = getDropdownOptions().indexOf(value);
      ({ from, to } = monthBoundsForDate(new Date(now.getFullYear(), monthIndex)));
    } else if (dropdownType === 'week') {
      const weekNumber = parseInt(value.split(' ')[1]);
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      from = new Date(firstOfMonth);
      from.setDate(firstOfMonth.getDate() + (weekNumber - 1) * 7);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
    } else if (dropdownType === 'year') {
      ({ from, to } = yearBoundsForDate(new Date(value, 0, 1)));
    }

    setCustomRange({ type: dropdownType, from, to });
    setSelectedFilter(dropdownType);
    setSelectedDropdownValue(value);
    setDropdownVisible(false);
  };

  // -----------------------
  // Picker logic (no popup header)
  // -----------------------
  const onPickerChange = (event, pickedDate) => {
    if (!pickedDate) return;

    if (pickerType === 'day') {
      const from = new Date(pickedDate);
      const to = new Date(pickedDate);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      setCustomRange({ type: 'day', from, to });
      setSelectedFilter('day');
      setShowPicker(false);
      return;
    }

    if (pickerType === 'range') {
      if (pickerStep === 1) {
        setTempRange({ from: pickedDate, to: null });
        setPickerStep(2); // go to end date selection
      } else {
        const from = new Date(tempRange.from);
        const to = new Date(pickedDate);
        setCustomRange({ type: 'all', from, to });
        setSelectedFilter('all');
        setShowPicker(false);
        setPickerStep(1); // reset for next range
      }
    }
  };

  // -----------------------
  // UI
  // -----------------------
  const getSelectedNote = () => {
    if (customRange.from && customRange.to)
      return `${formatDate(customRange.from)} → ${formatDate(customRange.to)}`;
    return `Filter: ${selectedFilter.toUpperCase()}`;
  };

  return (
    <>
      <View style={styles.container}>
        {filters.map((item) => {
          const isActive = selectedFilter === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => handleSelect(item)}
              onLongPress={() => handleLongPress(item)}
              style={[
                styles.filterButton,
                { backgroundColor: isActive ? COLORS.primary : '#ddd' },
              ]}
            >
              <Text style={[styles.filterText, { color: isActive ? '#fff' : '#000' }]}>
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.selectedNote}>{getSelectedNote()}</Text>

      {/* Dropdown */}
      {dropdownVisible && (
        <Modal transparent animationType="slide" onRequestClose={() => setDropdownVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDropdownVisible(false)}>
            <View style={styles.dropdownBox}>
              <Picker
                selectedValue={selectedDropdownValue}
                onValueChange={(value) => handleDropdownSelect(value)}
              >
                {getDropdownOptions().map((opt) => (
                  <Picker.Item key={opt} label={opt.toString()} value={opt} />
                ))}
              </Picker>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Native DateTimePicker — no custom header! */}
      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="calendar"
          onChange={onPickerChange}
        />
      )}
    </>
  );
};

export default DateFilter;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterText: {
    fontWeight: '600',
  },
  selectedNote: {
    textAlign: 'center',
    color: COLORS.primary,
    fontSize: 13,
    marginBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
  },
});
