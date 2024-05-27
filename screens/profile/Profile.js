import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile({ route, navigation }) {
  const { data } = route.params;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => backHandler.remove();
  }, []);

  const handleLogout = async () => {
    try {
      // Remove token from AsyncStorage
      await AsyncStorage.removeItem('TimberTechTokken');
      console.log('Token removed successfully');
      // Exit the app
      BackHandler.exitApp();
    } catch (error) {
      console.error('Error removing token:', error.message);
    }
  };

  const handleBackPress = () => {
    // Navigate to the Home screen when back button is pressed
    navigation.navigate('Home');
    return true; // Prevent default back button behavior
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.millName}>{data.millname}</Text>
      <Image source={{ uri: data.image }} style={styles.image} />
      <Text style={styles.username}>Username: {data.username}</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  millName: {
    fontSize: 20,
    marginBottom: 10,
    color: '#333',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  username: {
    fontSize: 18,
    marginBottom: 20,
    color: '#555',
  },
  button: {
    backgroundColor: '#DDDDDD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    color: 'black',
  },
});
