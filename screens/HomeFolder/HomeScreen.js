import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMillData } from '../../src/redux/slices/millSlice';
import { Ionicons } from '@expo/vector-icons'; // ✅ Expo Ionicons
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { millData, millKey, loading, error } = useSelector((state) => state.mill);
  const [displayText, setDisplayText] = useState('');

  // Fetch mill data on load
  useEffect(() => {
    dispatch(fetchMillData());
  }, [dispatch]);

  // TimberTech animated text
  useEffect(() => {
    const text = 'TimberTech';
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    navigation.navigate('Profile', { key: millKey, data: millData });
  };
  const navigateWoodLogs = (type) => {
    navigation.navigate(type, { key: millKey, data: millData });
  };

  const handleButtonPress = (type) => {
    let dataType = '';
    let detailScreen = '';
    switch (type) {
      case 'Workers':
        dataType = 'Workers';
        detailScreen = 'WorkerDetail';
        break;
      case 'BoxMakers':
        dataType = 'BoxMakers';
        detailScreen = 'BoxMakerDetail';
        break;
      case 'BoxBuyers':
        dataType = 'BoxBuyers';
        detailScreen = 'BoxBuyerDetails';
        break;
      case 'Transporters':
        dataType = 'Transporters';
        detailScreen = 'TransporterDetail';
        break;
      case 'WoodCutter':
        dataType = 'WoodCutter';
        detailScreen = 'WoodCutterDetail';
        break;
      default:
        return; // If unknown type, do nothing
    }

    navigation.navigate('ListScreen', {
      key: millKey,
      name: type,
      dataType,
      detailScreen,
    });
  };


  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.texttt}>{displayText}</Text>
      </View>
    );
  }

  // Error state
  if (error || !millData) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', fontSize: 20 }}>
          {error || 'No Mill Data Found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          paddingHorizontal: 15,
        }}>
        <Text style={styles.millName}>{millData.millname}</Text>

      </View>

      {/* ==== Main Button Layout ==== */}
      <View style={styles.row}>
        {/* Row 1 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.workersButton]}
            onPress={() => handleButtonPress('Workers')}>
            <Ionicons name="people-outline" size={80} color="white" />
            <Text style={styles.buttonText}>Workers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.boxBuyersButton]}
            onPress={() => handleButtonPress('BoxBuyers')}>
            <Ionicons name="cart-outline" size={50} color="white" />
            <Text style={styles.buttonText}>Box Buyers</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.boxMakersButton]}
            onPress={() => handleButtonPress('BoxMakers')}>
            <Ionicons name="cube-outline" size={50} color="white" />
            <Text style={styles.buttonText}>Box Makers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.transportersButton]}
            onPress={() => handleButtonPress('Transporters')}>
            <Ionicons name="car-outline" size={50} color="white" />
            <Text style={styles.buttonText}>Transporters</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.WoodCutterButton]}
            onPress={() => handleButtonPress('WoodCutter')}>
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/222438.png')}
                style={styles.backgroundImage}
              />
              <Text style={styles.buttonTextt}>WoodCutter</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.button, styles.logCalculatorButton]}>
            {/* Calculator Button */}
            <TouchableOpacity onPress={() => navigateWoodLogs('FlatLogCalculator')}>
              <Ionicons name="calculator-outline" size={50} color="white" />
            </TouchableOpacity>

            {/* Flat Log Button */}
            <TouchableOpacity
              onPress={() => navigateWoodLogs('FlatLogSaved')}
              style={{ alignItems: 'center', marginTop: 5 }}
            >
              <MaterialCommunityIcons name="cube-outline" size={50} color="white" />
              <Text style={styles.buttonTextt}>Flat Log</Text>
            </TouchableOpacity>
          </View>


          <View style={[styles.button, styles.logCalculatorButton]}>
            <TouchableOpacity onPress={() => navigateWoodLogs('LogCalculator')}>
              <Ionicons name="calculator-outline" size={50} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigateWoodLogs('LogSaved')} style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="tree-outline" size={50} color="white" />
              <Text style={styles.buttonTextt}>Round Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 4 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.otherExpenses]}
            onPress={() => navigateWoodLogs('Attendance')}>
            <Ionicons name="clipboard-outline" size={50} color="white" />
            <Text style={styles.buttonText}>Other Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.otherExpenses]}
            onPress={() => navigateWoodLogs('Attendance')}>
            <Ionicons name="clipboard-outline" size={50} color="white" />
            <Text style={styles.buttonText}>Other Expenses</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D4037', // Wooden theme
  },
  millName: {
    textAlign: 'center',
    fontSize: 40,
    color: 'white',
    marginVertical: 25,
    fontFamily: 'sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  row: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    width: '100%',
  },
  button: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    marginVertical: 2,
    borderRadius: 10,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
  buttonTextt: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  workersButton: {
    backgroundColor: '#8B4513',
    flex: 3,
    height: 150,
  },
  boxMakersButton: {
    backgroundColor: '#4682B4',
    flex: 1,
    height: 170,
  },
  boxBuyersButton: {
    backgroundColor: '#2E8B57',
    flex: 1.5,
    height: 150,
  },
  transportersButton: {
    backgroundColor: '#CD5C5C',
    flex: 2,
    height: 180,
  },
  otherExpenses: {
    backgroundColor: '#FFA500',
    flex: 1,
    height: 120,
  },
  WoodCutterButton: {
    backgroundColor: '#FFA500',
    flex: 1.5,
    height: 170,
  },
  logCalculatorButton: {
    backgroundColor: '#7B68EE',
    flex: 1.5,
    height: 170,
  },
  logoutButton: {
    borderRadius: 10,
  },
  texttt: {
    textAlign: 'center',
    fontSize: 50,
    color: 'white',
    marginBottom: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  backgroundImage: {
    height: 70,
    width: 70,
  },
  image: {
    width: 90,
    height: 80,
    resizeMode: 'contain',
  },
});
