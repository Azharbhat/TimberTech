import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../theme/theme';
import {
  selectMillItemData,
  subscribeEntity,
  stopSubscribeEntity,
  addEntityData,
} from '../src/redux/slices/millSlice';
import { useSelector, useDispatch } from 'react-redux';

const DateFilter = ({
  filters = ['day', 'week', 'month', 'year', 'all'],
  onSelect,
  dataSets = [],
}) => {
  const dispatch = useDispatch();
  const { millData } = useSelector((state) => state.mill);
  const [selectedFilter, setSelectedFilter] = useState('month');
  const [customRange, setCustomRange] = useState({ type: null, from: null, to: null });
  const millKey = useSelector((state) => state.mill.millKey);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  const [pickerStep, setPickerStep] = useState(1);
  const [tempRange, setTempRange] = useState({ from: null, to: null });
  const [pickerDate, setPickerDate] = useState(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedModalValue, setSelectedModalValue] = useState(null);

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

  // subscribe/unsubscribe to mill key
  useEffect(() => {
    if (millKey) dispatch(subscribeEntity(millKey));
    return () => {
      if (millKey) dispatch(stopSubscribeEntity(millKey));
    };
  }, [millKey]);

  // auto-select active season (isCurrent: true) when seasons available
  useEffect(() => {
    if (millData?.Seasons && Object.keys(millData.Seasons).length > 0) {
      const activeEntry = Object.entries(millData.Seasons).find(([k, s]) => s.isCurrent);
      if (activeEntry) {
        const [, season] = activeEntry;
        const from = season.startDate ? new Date(season.startDate) : null;
        const to = season.endDate ? new Date(season.endDate) : null;
        if (from && to) {
          setCustomRange({ type: 'year', from, to });
          setSelectedFilter('year');
          setSelectedModalValue(season.name || String(from.getFullYear()));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [millData?.Seasons]);

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

  // 🔹 Handle filter button press
  const handlePress = (item) => {
    const now = new Date();

    switch (item) {
      case 'day':
        setPickerType('day');
        setShowPicker(true);
        return;

      case 'week':
      case 'month':
      case 'year':
        setModalType(item);
        setModalVisible(true);
        return;

      case 'all':
        setPickerType('range');
        setPickerStep(1);
        setTempRange({ from: null, to: null });
        setShowPicker(true);
        return;

      default:
        return;
    }
  };

  // 🔹 Options for modals
  const getModalOptions = () => {
    const now = new Date();

    if (modalType === 'month') {
      return [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
    }

    if (modalType === 'week') {
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

    // Use millData.Seasons when modalType === 'year'
    if (modalType === 'year') {
      if (millData?.Seasons && Object.keys(millData.Seasons).length > 0) {
        // Convert the Seasons object into a readable array of objects
        return Object.entries(millData.Seasons).map(([key, s]) => ({
          id: key,
          name: s.name || `Season ${key}`,
          startDate: s.startDate,
          endDate: s.endDate,
          isCurrent: s.isCurrent || false,
        }));
      } else {
        // fallback to normal year list if no seasons available
        const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
        return years.map((y) => ({ id: y.toString(), name: y.toString() }));
      }
    }

    return [];
  };

  // 🔹 Handle modal selection — accepts object (season) or string (month/week/year fallback)
  const handleModalSelect = (item) => {
    const now = new Date();
    let from = null;
    let to = null;

    if (modalType === 'month') {
      // item is string month name
      const monthIndex = getModalOptions().indexOf(item);
      ({ from, to } = monthBoundsForDate(new Date(now.getFullYear(), monthIndex)));
    } else if (modalType === 'week') {
      // item is "Week X"
      const weekNumber = parseInt(String(item).split(' ')[1], 10);
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      from = new Date(firstOfMonth);
      from.setDate(firstOfMonth.getDate() + (weekNumber - 1) * 7);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
    } else if (modalType === 'year') {
      if (typeof item === 'object' && item.startDate && item.endDate) {
        from = new Date(item.startDate);
        to = new Date(item.endDate);
      } else if (typeof item === 'string') {
        // fallback: treat string as year number
        ({ from, to } = yearBoundsForDate(new Date(parseInt(item, 10), 0, 1)));
      } else {
        // fallback: if seasons list contains an object matching name/id
        const selectedSeason = getModalOptions().find(
          (opt) => (typeof opt === 'object' && (opt.name === item || opt.id === item))
        );
        if (selectedSeason && selectedSeason.startDate && selectedSeason.endDate) {
          from = new Date(selectedSeason.startDate);
          to = new Date(selectedSeason.endDate);
          item = selectedSeason; // normalize item to object for selectedModalValue
        }
      }
    }

    setCustomRange({ type: modalType, from, to });
    setSelectedFilter(modalType);
    setSelectedModalValue(typeof item === 'object' ? item.name : item);
    setModalVisible(false);
  };

  // 🔹 Current week/month/year for highlighting inside modal
  const getHighlightValue = () => {
    const now = new Date();
    if (modalType === 'month') return getModalOptions()[now.getMonth()];
    if (modalType === 'year') {
      // if modal options are objects, return the name of the current season if found, else current year string
      const opts = getModalOptions();
      if (Array.isArray(opts) && opts.length > 0 && typeof opts[0] === 'object') {
        const active = opts.find((o) => o.isCurrent);
        if (active) return active.name;
      }
      return String(now.getFullYear());
    }
    if (modalType === 'week') {
      const today = now.getDate();
      return `Week ${Math.ceil(today / 7)}`;
    }
    return null;
  };

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
        setPickerStep(2);
      } else {
        const from = new Date(tempRange.from);
        const to = new Date(pickedDate);
        setCustomRange({ type: 'all', from, to });
        setSelectedFilter('all');
        setShowPicker(false);
        setPickerStep(1);
      }
    }
  };

  const getSelectedNote = () => {
    if (customRange.from && customRange.to) {
      if (selectedModalValue) {
        return `${selectedModalValue}: ${formatDate(customRange.from)} → ${formatDate(customRange.to)}`;
      }
      return `${formatDate(customRange.from)} → ${formatDate(customRange.to)}`;
    }
    return `Filter: ${selectedFilter.toUpperCase()}`;
  };

  const highlightValue = getHighlightValue();

  return (
    <>
      <View style={styles.container}>
        {filters.map((item) => {
          const isActive = selectedFilter === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => handlePress(item)}
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

      {/* 🔹 Custom modal for week/month/year */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <View style={styles.modalBox}>
            <FlatList
              data={getModalOptions()}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => {
                // item might be object (season) or string (month/week)
                const label = typeof item === 'object' ? item.name : item;
                // For display, show season with date range if object
                const displayText =
                  typeof item === 'object' && item.startDate && item.endDate
                    ? `${item.name} (${new Date(item.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })} → ${new Date(item.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })})`
                    : label;

                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleModalSelect(item)}
                  >
                    <Text
                      style={[
                        styles.modalText,
                        label === highlightValue && { color: 'green', fontWeight: 'bold' },
                      ]}
                    >
                      {displayText}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

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
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
    maxHeight: '70%',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});
