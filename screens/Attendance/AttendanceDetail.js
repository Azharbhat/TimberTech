import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Modal, Pressable, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { database } from '../../Firebase/FirebaseConfig';
import { set, ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, GLOBAL_STYLES } from '../../theme/theme';
import { useSelector } from 'react-redux';

export default function AttendanceDetail({ route }) {
  const { workerKey, data } = route.params;
  const { millKey } = useSelector((state) => state.mill);

  const [attendanceData, setAttendanceData] = useState({});
  const [absentCountYear, setAbsentCountYear] = useState(0);
  const [presentCountYear, setPresentCountYear] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch attendance data
  useEffect(() => {
    if (!millKey || !workerKey) return;
    const fetchAttendanceData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${millKey}/Workers/${workerKey}/attendance`));
        setAttendanceData(snapshot.exists() ? snapshot.val() : {});
      } catch (error) {
        console.error(error);
      }
    };
    fetchAttendanceData();
  }, [millKey, workerKey]);

  // Compute yearly stats
  useEffect(() => {
    let absentYear = 0, presentYear = 0;
    const currentYear = new Date().getFullYear();

    for (const date in attendanceData) {
      const [year] = date.split('-').map(Number);
      if (year === currentYear) {
        if (attendanceData[date]?.status === 'Present') presentYear++;
        else if (attendanceData[date]?.status === 'Absent') absentYear++;
      }
    }

    setPresentCountYear(presentYear);
    setAbsentCountYear(absentYear);
  }, [attendanceData]);

  const handleDateSelect = (date) => {
    if (new Date(date).getTime() <= Date.now()) {
      setSelectedDate(date);
      setShowModal(true);
    }
  };

  const updateAttendance = async (status) => {
    if (!selectedDate) return;
    try {
      const workerSnap = await get(ref(database, `Mills/${millKey}/Workers/${workerKey}`));
      const workerData = workerSnap.val() || {};
      const salaryPerDay = Number(workerData.salaryPerDay ?? 0);
      const attendanceRef = ref(database, `Mills/${millKey}/Workers/${workerKey}/attendance/${selectedDate}`);
      const selectedTimestamp = new Date(selectedDate).getTime();

      await set(attendanceRef, {
        status,
        timestamp: selectedTimestamp,
        earning: status === 'Present' ? salaryPerDay : 0,
      });

      setAttendanceData({
        ...attendanceData,
        [selectedDate]: {
          status,
          timestamp: selectedTimestamp,
          earning: status === 'Present' ? salaryPerDay : 0,
        },
      });
    } catch (error) {
      console.error(error);
    }
    setShowModal(false);
    setSelectedDate(null);
  };

  // Monthly data
  const monthData = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(2025, i, 1).toLocaleString('default', { month: 'long' }),
  presents: 0,
  absentees: 0,
}));


  for (const date in attendanceData) {
    const [year, month] = date.split('-').map(Number);
    if (year === new Date().getFullYear()) {
      const idx = month - 1;
      if (attendanceData[date]?.status === 'Present') monthData[idx].presents++;
      else if (attendanceData[date]?.status === 'Absent') monthData[idx].absentees++;
    }
  }

  // Mark calendar dates with green/red
  const getMarkedDates = (attendanceData) => {
    const markedDates = {};
    for (const date in attendanceData) {
      const status = attendanceData[date]?.status;
      if (status) {
        markedDates[date] = {
          marked: true,
          dotColor: status === 'Absent' ? 'red' : 'green',
        };
      }
    }
    return markedDates;
  };

  return (
    <View style={GLOBAL_STYLES.container}>
      {/* HEADER */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>
          {data.name?.toUpperCase() || 'WORKER'}
        </Text>
      </View>

      {/* YEARLY STATS */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done-circle-outline" size={28} color="green" />
          <Text style={styles.statLabel}>Present</Text>
          <Text style={[styles.statValue, { color: 'green' }]}>{presentCountYear}</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="close-circle-outline" size={28} color="red" />
          <Text style={styles.statLabel}>Absent</Text>
          <Text style={[styles.statValue, { color: 'red' }]}>{absentCountYear}</Text>
        </View>
      </View>

      {/* MONTHLY STATS */}
      <FlatList
        data={monthData}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingHorizontal: 12, marginVertical: 10 }}
        renderItem={({ item }) => {
          const total = item.presents + item.absentees || 1;
          const presentWidth = (item.presents / total) * 100;
          const absentWidth = (item.absentees / total) * 100;

          return (
            <View style={styles.monthContainer}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{item.month}</Text>
                <View style={styles.countRow}>
                  <Text style={[styles.countText, { color: 'green' }]}>
                     {item.presents} Present
                  </Text>
                  <Text style={[styles.countText, { color: 'red' }]}>
                     {item.absentees} Absent
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.presentBar, { width: `${presentWidth}%` }]} />
                <View style={[styles.absentBar, { width: `${absentWidth}%` }]} />
              </View>
            </View>
          );
        }}
      />

      {/* CALENDAR */}
      <Calendar
        markedDates={getMarkedDates(attendanceData)}
        markingType="dot"
        onDayPress={(day) => handleDateSelect(day.dateString)}
        theme={{
          backgroundColor: COLORS.accent,
          calendarBackground: COLORS.accent,
          textSectionTitleColor: COLORS.text,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          monthTextColor: COLORS.primary,
          arrowColor: COLORS.primary,
          textDayFontFamily: FONTS.regular,
          textMonthFontFamily: FONTS.bold,
          textDayHeaderFontFamily: FONTS.regular,
        }}
      />

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={GLOBAL_STYLES.modalOverlay}>
          <View style={GLOBAL_STYLES.modalBox}>
            <Text style={GLOBAL_STYLES.modalTitle}>Update Attendance</Text>
            <Pressable
              style={[GLOBAL_STYLES.button, { backgroundColor: 'green' }]}
              onPress={() => updateAttendance('Present')}
            >
              <Text style={GLOBAL_STYLES.buttonText}>Present</Text>
            </Pressable>
            <Pressable
              style={[GLOBAL_STYLES.button, { backgroundColor: 'red' }]}
              onPress={() => updateAttendance('Absent')}
            >
              <Text style={GLOBAL_STYLES.buttonText}>Absent</Text>
            </Pressable>
            <Pressable
              style={GLOBAL_STYLES.button}
              onPress={() => setShowModal(false)}
            >
              <Text style={GLOBAL_STYLES.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 10,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '40%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthContainer: {
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    marginTop: 6,
  },
  presentBar: {
    backgroundColor: 'green',
    height: '100%',
  },
  absentBar: {
    backgroundColor: 'red',
    height: '100%',
  },
});
