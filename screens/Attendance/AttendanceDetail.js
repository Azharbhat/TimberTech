import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { database } from '../../Firebase/FirebaseConfig';
import { set, ref, get } from 'firebase/database';

export default function AttendanceDetail({ route }) {
  const { key, workerKey,data } = route.params;
  const [attendanceData, setAttendanceData] = useState({});
  const [absentCountMonth, setAbsentCountMonth] = useState(0);
  const [presentCountMonth, setPresentCountMonth] = useState(0);
  const [absentCountYear, setAbsentCountYear] = useState(0);
  const [presentCountYear, setPresentCountYear] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${key}/Workers/${workerKey}/attendance`));
        if (snapshot.exists()) {
          setAttendanceData(snapshot.val());
        } else {
          setAttendanceData({});
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
    };

    fetchAttendanceData();
  }, [key, workerKey]);

  useEffect(() => {
    let absentMonth = 0;
    let presentMonth = 0;
    let absentYear = 0;
    let presentYear = 0;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    for (const date in attendanceData) {
      if (attendanceData.hasOwnProperty(date)) {
        const [year, month] = date.split('-').map(Number);

        if (year === currentYear) {
          if (month === currentMonth) {
            if (attendanceData[date] === 'Absent') {
              absentMonth++;
            } else if (attendanceData[date] === 'Present') {
              presentMonth++;
            }
          }

          if (attendanceData[date] === 'Absent') {
            absentYear++;
          } else if (attendanceData[date] === 'Present') {
            presentYear++;
          }
        }
      }
    }

    setAbsentCountMonth(absentMonth);
    setPresentCountMonth(presentMonth);
    setAbsentCountYear(absentYear);
    setPresentCountYear(presentYear);
  }, [attendanceData]);

  const handleDateSelect = async (date) => {
    const selectedDateTime = new Date(date).getTime();
    const currentDateTime = new Date().getTime();

    if (selectedDateTime <= currentDateTime) {
      setSelectedDate(date);
      setShowModal(true);
    }
  };

  const updateAttendance = async (status) => {
    try {
      const attendanceRef = ref(database, `Mills/${key}/Workers/${workerKey}/attendance/${selectedDate}`);
      const snapshot = await get(attendanceRef);
      if (snapshot.exists()) {
        const newAttendanceStatus = snapshot.val() === status ? null : status;
        await set(attendanceRef, newAttendanceStatus);
        setAttendanceData({ ...attendanceData, [selectedDate]: newAttendanceStatus });
      } else {
        await set(attendanceRef, status);
        setAttendanceData({ ...attendanceData, [selectedDate]: status });
      }
    } catch (error) {
      console.error('Error updating attendance data:', error);
    }

    setShowModal(false);
    setSelectedDate(null);
  };

  const monthData = [
    { month: 'January', presents: 0, absentees: 0 },
    { month: 'February', presents: 0, absentees: 0 },
    { month: 'March', presents: 0, absentees: 0 },
    { month: 'April', presents: 0, absentees: 0 },
    { month: 'May', presents: 0, absentees: 0 },
    { month: 'June', presents: 0, absentees: 0 },
    { month: 'July', presents: 0, absentees: 0 },
    { month: 'August', presents: 0, absentees: 0 },
    { month: 'September', presents: 0, absentees: 0 },
    { month: 'October', presents: 0, absentees: 0 },
    { month: 'November', presents: 0, absentees: 0 },
    { month: 'December', presents: 0, absentees: 0 },
  ];

  for (const date in attendanceData) {
    if (attendanceData.hasOwnProperty(date)) {
      const [year, month] = date.split('-').map(Number);
      const monthIndex = month - 1;

      if (year === new Date().getFullYear()) {
        if (attendanceData[date] === 'Present') {
          monthData[monthIndex].presents++;
        } else if (attendanceData[date] === 'Absent') {
          monthData[monthIndex].absentees++;
        }
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.yearContainer}>
      <Text style={styles.yearText}>{(data.name).toUpperCase()}</Text>
        <Text style={styles.yearText}>This Year:- Presents:{presentCountYear}</Text>
        <Text style={styles.yearText}>Absents:{absentCountYear}</Text>
      </View>
      <FlatList
        data={monthData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.monthContainer}>
            <Text style={styles.monthText}>{item.month}</Text>
            <Text style={styles.monthDetailText}>Presents: {item.presents}</Text>
            <Text style={styles.monthDetailText}>Absentees: {item.absentees}</Text>
          </View>
        )}
      />
      <Calendar
        markedDates={getMarkedDates(attendanceData)}
        markingType={'period'}
        theme={{
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          textSectionTitleDisabledColor: '#d9e1e8',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: 'orange',
          disabledArrowColor: '#d9e1e8',
          monthTextColor: 'blue',
          indicatorColor: 'red',
          textDayFontFamily: 'monospace',
          textMonthFontFamily: 'monospace',
          textDayHeaderFontFamily: 'monospace',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16
        }}
        onDayPress={(day) => handleDateSelect(day.dateString)}
      />
      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Attendance</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => updateAttendance('Present')}>
              <Text>Present</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => updateAttendance('Absent')}>
              <Text>Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowModal(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getMarkedDates = (attendanceData) => {
  const markedDates = {};

  for (const date in attendanceData) {
    if (attendanceData.hasOwnProperty(date)) {
      markedDates[date] = { marked: true, dotColor: attendanceData[date] === 'Absent' ? 'red' : 'green' };
    }
  }

  return markedDates;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  yearContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor:'chocolate',
    padding: 10,
    paddingHorizontal:20,
    paddingTop:35
  },
  yearText: {
    fontWeight: 'bold',
    color:'white',
    fontSize: 16,
  },
  monthContainer: {
    paddingVertical: 5,
    paddingHorizontal:15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    display:'flex',
    flexDirection:'row',
    justifyContent:'space-between'
  },
  monthText: {
    fontSize: 16,
    width:90,
    fontWeight: 'bold',
  },
  monthDetailText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
});
