import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SplashScreen = ({ navigation }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    const text = 'TimberTech';
    let index = 0;

    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index)); // safer way, no "undefined"
        index++;
      } else {
        clearInterval(interval);
        navigation.replace('Welcome'); // replace instead of navigate to avoid back button going to splash
      }
    }, 150);

    return () => clearInterval(interval);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  text: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default SplashScreen;
