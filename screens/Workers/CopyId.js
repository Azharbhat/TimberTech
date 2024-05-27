import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Clipboard } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function CopyId({ route, navigation }) {
  const { key, address } = route.params;
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${key}/${address}`));
        if (snapshot.exists()) {
          const userList = [];
          snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            user.id = childSnapshot.key; // Add ID to user object
            userList.push(user);
          });
          setUsers(userList);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error);
      }
    };

    fetchUsers();
  }, [key]);

  // Function to handle copy action
  const handleCopy = (userId) => {
    Clipboard.setString(userId);
    Alert.alert('ID Copied', 'User ID has been copied to clipboard.');
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Copy {address} ID</Text>
      {users.map((user) => (
        <TouchableOpacity
          key={user.id}
          onPress={() => handleCopy(user.id)}
          style={styles.copyButton}
        >
        <View style={{display:'flex',flexDirection:'row',justifyContent:"flex-start",width:'100%'}}>
        <View style={styles.iconContainer}>
            {user.type === 'Boxmaker' ? (
              <Ionicons name="cube" size={50} color="white" /> // Box icon
            ) : (
              <Ionicons name="person" size={50} color="white" /> // Person icon
            )}
            
          </View>

        <View>
        <Text style={styles.buttonText}>{user.name}</Text>
        <Text style={styles.buttonTextt}>{user.id}</Text>
        </View>
        </View>
      
         
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:30,
    alignItems: 'center',
    backgroundColor: '#FFF8DC', // Ivory color background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8B4513', // Wooden color text
  },
  copyButton: {
    backgroundColor: '#6495ED', // Cornflower blue
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '90%',
    flexDirection: 'column', // Adjust to align icon and text horizontally
    alignItems: 'center', // Align items in the center vertically
  },
  buttonText: {
    fontSize: 30,
    color: 'white',
    marginRight: 10, // Add spacing between icon and text
  },
  buttonTextt: {
    fontSize: 10,
    color: 'white',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
