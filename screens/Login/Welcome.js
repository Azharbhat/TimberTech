import React from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground } from 'react-native';
import { jsx } from 'react/jsx-runtime';

export default function Welcome({ navigation }) {
  return (
    <View style={styles.container}>
      <ImageBackground source={require('../../images/background.jpg')} style={styles.imageBackground}>
        {/* Content Diagonal */}
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Welcome to the TimberTech</Text>
            <Text style={styles.description}>Experience the beauty of woodworking and craftsmanship.</Text>
          </View>
          <View style={styles.buttonRow}>
            
            <Pressable style={[styles.button, styles.workerButton]}  onPress={() => navigation.navigate('Join',{title:'Worker'})}>
              <Text style={styles.buttonText}>Employee/BoxBuyers</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.managerButton]} onPress={() => navigation.navigate('Login',{title:'Manager'})}>
              <Text style={styles.buttonText}>Manager</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between'
  },
  imageBackground: {
  width: '100%',        // fill width of parent
  height: '100%',       // fill height of parent
  resizeMode: 'cover',  // keep aspect ratio, cover area
  justifyContent: 'center',
  overflow: 'hidden',   // prevent image overflow
 },
  contentContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingVertical: 30,
    paddingHorizontal: 10,
    borderStyle: 'solid',
    borderColor: 'transparent',
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    flexWrap: 'wrap',
    maxWidth: '80%', // Limiting the maximum width of the description
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    padding:10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  workerButton: {
    backgroundColor: '#8B4513', // Worker button color
    borderColor: '#8B4513', // Worker button border color
  },
  managerButton: {
    backgroundColor: '#CD853F', // Manager button color
    borderColor: '#CD853F', // Manager button border color
  },
});
