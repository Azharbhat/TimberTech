import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ImageBackground, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../Firebase/FirebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ route, setIsLoggedIn }) => {
  const { title } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();

  const handleAuthentication = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Store token
      await AsyncStorage.setItem('TimberTechTokken', user.stsTokenManager.accessToken);

      // Notify AppContent to render AppStack
      setIsLoggedIn(true);

    } catch (error) {
      console.log('Login error:', error);
      setErrorMessage('Email or Password is incorrect');
    }
  };

  const navigateToRegister = () => navigation.navigate('Register', { title });

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../../images/background.jpg')} style={styles.imageBackground}>
        <BlurView intensity={50} style={StyleSheet.absoluteFill}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.glassContainer}>
              <Text style={styles.title}>TimberTech</Text>
              <Text style={styles.title}>{title} LogIn</Text>
              <Feather name="user" size={60} color="#CD853F" style={styles.icon} />

              <View style={styles.inputContainer}>
                <Feather name="mail" size={24} color="#CD853F" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Feather name="lock" size={24} color="#CD853F" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry
                />
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={20} color="red" style={styles.errorIcon} />
                  <Text style={styles.errorMessageText}>{errorMessage}</Text>
                </View>
              ) : null}

              <Pressable style={styles.button} onPress={handleAuthentication}>
                <Text style={styles.buttonText}>Login</Text>
              </Pressable>

              <View style={styles.buttonContainer}>
                <Pressable onPress={navigateToRegister}>
                  <Text style={{ color: 'green' }}>Go to Register</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </BlurView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageBackground: { width: '100%', height: '100%', justifyContent: 'center', overflow: 'hidden' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  glassContainer: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 20, alignItems: 'center' },
  title: { fontSize: 32, marginBottom: 16, fontWeight: 'bold', color: '#8B4513' },
  icon: { margin: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#8B4513' },
  input: { flex: 1, height: 40, fontSize: 20, color: 'black', backgroundColor: 'transparent' },
  buttonContainer: { marginTop: 16 },
  button: { backgroundColor: '#8B4513', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 5, marginBottom: 10, width: '100%', alignItems: 'center' },
  buttonText: { fontSize: 16, color: '#fff' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  errorIcon: { marginRight: 10 },
  errorMessageText: { color: 'red', fontSize: 16 },
});

export default LoginScreen;
