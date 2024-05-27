import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,Image} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { useFonts } from '@expo-google-fonts/roboto';

import { decode } from 'base-64';

const decodeJwtToken = (token) => {
  try {
    if (!token) {
      console.error('Token is null or empty');
      return null;
    }

    const payload = token.split('.')[1];
    const decodedPayload = decode(payload);
    const decodedToken = JSON.parse(decodedPayload);

    if (!decodedToken || !decodedToken.sub) {
      console.error('Decoded token is null or missing "sub" property');
      return null;
    }

    return decodedToken;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};


export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState('');
  const [userr, setUserr] = useState(null);
  const [userKey, setUserKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reloadUserData = async () => {
      try {
        const userToken = await AsyncStorage.getItem('TimberTechTokken');
        if (userToken) {
          const decodedToken = decodeJwtToken(userToken);
          const userId = decodedToken.sub;
          const databaseRef = ref(database, 'Mills');
          const snapshot = await get(databaseRef);
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const user = childSnapshot.val();
              const parentKey = childSnapshot.key; // Get the parent key (ID)
              if (user.id === userId) {
                setUserr(user);
                setUserKey(parentKey); // Set the parent key (ID) state
                setIsLoading(false); // Set loading state to false when data is loaded
              }
            });
          } else {
            console.warn('No data available in the database');
          }
        }
      } catch (error) {
        console.warn('Error checking user login:', error);
      }
    };

    reloadUserData();
  }, []);

  useEffect(() => {
    if (userr && user.id) {
      const sortedUserIds = [userr.id, user.id].sort();
      const roomId = sortedUserIds.join('_');
      setRoomId(roomId);
      setCurrentUser(userr.id);
    }
  }, [userr, user.id]);

  const handleLogout = async () => {
    navigation.navigate('Profile',{data:userr})
   
  };

  const handleButtonPress = (screen) => {
    navigation.navigate(screen, { key: userKey, name: screen });
  };
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    const text = 'TimberTech';
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText((prevText) => prevText + text[index]);
        index++;
      } else {
        clearInterval(interval);
        // Navigate to the Home screen after displaying "TimberTech"
      }
    }, 100); // Adjust the delay between each letter

    return () => clearInterval(interval);
  }, [navigation]);
  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text style={styles.texttt}>{displayText}</Text>
      ) : (
        <>
        <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between' ,width:'100%',paddingHorizontal:15}}>
        <Text style={styles.millName}>{userr.millname}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>
          
          <View style={styles.row}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.workersButton]} onPress={() => handleButtonPress('Workers')}>
                <Ionicons name="people-outline" size={80} color="white" />
                <Text style={styles.buttonText}>Workers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.boxBuyersButton]} onPress={() => handleButtonPress('BoxBuyers')}>
                <Ionicons name="cart-outline" size={50} color="white" />
                <Text style={styles.buttonText}>Box Buyers</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.boxMakersButton]} onPress={() => handleButtonPress('BoxMakers')}>
                <Ionicons name="cube-outline" size={50} color="white" />
                <Text style={styles.buttonText}>Box Makers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.transportersButton]} onPress={() => handleButtonPress('Transporters')}>
                <Ionicons name="car-outline" size={50} color="white" />
                <Text style={styles.buttonText}>Transporters</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.WoodCutterButton]} onPress={() => handleButtonPress('WoodCutter')}>
              <View style={styles.iconContainer}>
              <Image  source={require('../../assets/222438.png')} style={styles.backgroundImage}>
              </Image>
                <Text style={styles.buttonTextt}>WoodCutter</Text>
              </View>
            
          </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.logCalculatorButton]} onPress={() => handleButtonPress('FlatLogCalculator')}>
              <Image source={require('../../assets/flatWood.webp') }  style={styles.image}/ >
                <Ionicons name="calculator-outline" size={50} color="white" />
                <Text style={styles.buttonTextt}>Flat Log Calculator</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.logCalculatorButton]} onPress={() => handleButtonPress('LogCalculator')}>
              <Image source={require('../../assets/roundWood.png') }  style={styles.image}/ >

              <Ionicons name="calculator-outline" size={50} color="white" />
              <Text style={styles.buttonTextt}>Round Log Calculator</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.attendanceButton]} onPress={() => handleButtonPress('Attendance')}>
              <Ionicons name="clipboard-outline" size={50} color="white" />
              <Text style={styles.buttonText}>Attendance</Text>
            </TouchableOpacity>
            
          </View>
          </View>
          
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D4037', // Wooden background color
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
    alignItems:'center',
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
    elevation: 3, // Add elevation for shadow effect
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
  buttonTextt: {
    fontSize: 12,
    color: 'white',
    marginTop: 10,
  },
  workersButton: {
    backgroundColor: '#8B4513',
    flex: 3, // Adjust flex to set width
    height: 150,
  },
  boxMakersButton: {
    backgroundColor: '#4682B4',
    flex: 1, // Adjust flex to set width
    height: 170,
  },
  boxBuyersButton: {
    backgroundColor: '#2E8B57',
    flex: 1.5, // Adjust flex to set width
    height: 150,
  },
  transportersButton: {
    backgroundColor: '#CD5C5C',
    flex: 2, // Adjust flex to set width
    height: 180,
  },
  attendanceButton: {
    backgroundColor: '#FFA500',
    flex: 1.5, // Adjust flex to set width
    height: 120,
  },
  WoodCutterButton: {
    backgroundColor: '#FFA500',
    flex: 1.5, // Adjust flex to set width
    height: 170,
  },
  logCalculatorButton: {
    backgroundColor: '#7B68EE',
    flex: 1.5, // Adjust flex to set width
    height: 170,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    
    borderRadius: 10,
  },
  logoutButtonText: {
    fontSize: 18,
    color: 'white',
    marginLeft: 10,
  },
  texttt: {
    textAlign: 'center',
    fontSize: 50,
    color: 'white',
    marginBottom: 50,
    fontFamily: 'sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  backgroundImage:{
    height:70,
    width:70
  },
  image: {
    width: 70, // Adjust width as needed
    height: 70, // Adjust height as needed
    resizeMode: 'contain', // Adjust resizeMode as needed
  },
});
