import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get, update } from 'firebase/database';
import { GLOBAL_STYLES, COLORS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import ListItemWithAvatar from '../../components/ListItemWithAvatar';

export default function Attendance({ navigation }) {
  const { millKey } = useSelector((state) => state.mill);
  const [savedResults, setSavedResults] = useState([]);
  const [workerKeys, setWorkerKeys] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState({});
  const dotAnimations = useRef({}).current;

  // Fetch workers
  useEffect(() => {
    if (!millKey) return;

    const fetchData = async () => {
      const snapshot = await get(ref(database, `Mills/${millKey}/Workers`));
      if (snapshot.exists()) {
        const keys = [];
        const filteredResults = [];
        snapshot.forEach(childSnapshot => {
          const workerKey = childSnapshot.key;
          const workerData = childSnapshot.val();
          if (workerData.type === 'Normal') {
            keys.push(workerKey);
            filteredResults.push(workerData);
          }
        });
        setWorkerKeys(keys);
        setSavedResults(filteredResults);
      }
    };
    fetchData();
  }, [millKey]);

  // Mark attendance and store earnings
  const markAttendance = async (workerKey, status) => {
    try {
      setLoadingStatus(prev => ({ ...prev, [workerKey]: status }));
      startDotAnimation(workerKey);

      const date = new Date().toISOString().split('T')[0];

      // Fetch existing attendance for the worker
      const workerSnap = await get(ref(database, `Mills/${millKey}/Workers/${workerKey}`));
      const workerData = workerSnap.val() || {};
      const salaryPerDay = Number(workerData.salaryPerDay ?? 0);
      const previousAttendance = workerData.attendance || {};

      // Update attendance for current date
      const newAttendance = {
        ...previousAttendance,
        [date]: {
          status,
          timestamp: Date.now(),
          earning: status === 'Present' ? salaryPerDay : 0,
        },
      };

      // Push updates to Firebase
      await update(ref(database, `Mills/${millKey}/Workers/${workerKey}`), { attendance: newAttendance });

      // Update local state
      setSavedResults(prev =>
        prev.map((w, i) =>
          workerKeys[i] === workerKey
            ? { ...w, attendance: newAttendance }
            : w
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(prev => ({ ...prev, [workerKey]: false }));
    }
  };


  // Dot animation
  const startDotAnimation = (workerKey) => {
    if (!dotAnimations[workerKey]) {
      dotAnimations[workerKey] = [0, 1, 2].map(() => new Animated.Value(0));
    }
    dotAnimations[workerKey].forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    });
  };

  const renderLoadingDots = (workerKey) => {
    if (!dotAnimations[workerKey]) return null;
    return (
      <View style={styles.dotContainer}>
        {dotAnimations[workerKey].map((anim, index) => (
          <Animated.View
            key={index}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#fff',
              marginHorizontal: 1,
              transform: [{ scale: anim }],
            }}
          />
        ))}
      </View>
    );
  };

  const getButtonColor = (worker, status) => {
    const date = new Date().toISOString().split('T')[0];
    const currentStatus = worker.attendance?.[date]?.status;
    if (loadingStatus[worker.key] === status) return '#8B4513';
    if (currentStatus === 'Present') return status === 'Present' ? 'green' : '#ccc';
    if (currentStatus === 'Absent') return status === 'Absent' ? 'red' : '#ccc';
    return '#FFD700';
  };

  const handleItemPress = (item, workerKey) => {
    navigation.navigate('AttendanceDetail', { workerKey, data: item });
  };

  if (!millKey) {
    return (
      <View style={[GLOBAL_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.text, fontSize: 20 }}>Loading Mill Data...</Text>
      </View>
    );
  }

  return (
    <View style={GLOBAL_STYLES.container}>
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Attendance</Text>
      </View>

      <FlatList
        data={savedResults.map((item, index) => ({ ...item, key: workerKeys[index] }))}
        renderItem={({ item }) => {
          const date = new Date().toISOString().split('T')[0];
          const earning = item.attendance?.[date]?.earning ?? 0;

          return (
            <Pressable onPress={() => handleItemPress(item, item.key)}>
              <View style={styles.item}>
                <Text style={styles.itemText}>

                  <ListItemWithAvatar item={item} />
                </Text>

                <View>
                  <Pressable onPress={() => markAttendance(item.key, 'Present')}>
                    <View style={[styles.attendanceButtonWrapper, { backgroundColor: getButtonColor(item, 'Present') }]}>
                      {loadingStatus[item.key] === 'Present' ? renderLoadingDots(item.key) : <Text style={styles.attendanceButtonText}>P</Text>}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => markAttendance(item.key, 'Absent')}>
                    <View style={[styles.attendanceButtonWrapper, { backgroundColor: getButtonColor(item, 'Absent') }]}>
                      {loadingStatus[item.key] === 'Absent' ? renderLoadingDots(item.key) : <Text style={styles.attendanceButtonText}>A</Text>}
                    </View>
                  </Pressable>


                </View>
              </View>
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.key}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F5F5DC',
    marginBottom: 5,
    borderRadius: 5,
  },
  itemText: { flex: 1, fontSize: 30, color: '#8B4513' },
  attendanceButtonWrapper: {
    width: 50,
    height: 40,
    borderRadius: 5,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  attendanceButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
