import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SplashScreen = ({ navigation }) => {
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
        navigation.navigate('Welcome'); // Navigate to the Home screen after displaying "TimberTech"
      }
    }, 100); // Adjust the delay between each letter

    return () => clearInterval(interval);
  }, [navigation]); // Include navigation in the dependency array to prevent unnecessary re-renders

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
    backgroundColor: '#FFF', // Set your splash screen background color here
  },
  text: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#000', // Set your text color here
  },
});

export default SplashScreen;
