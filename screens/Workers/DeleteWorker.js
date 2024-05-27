import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get, remove } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function DeleteWorker({ route, navigation }) {
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

  // Function to handle delete action
  const handleDelete = async (userId, userName) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${userName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              // Remove user from database
              await remove(ref(database, `Mills/${key}/${address}/${userId}`));

              // Update state to reflect deletion
              setUsers(users.filter((user) => user.id !== userId));
              console.log(key,address,userId)
              navigation.navigate('Home');
            } catch (error) {
              console.error('Error deleting user:', error);
              setError(error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
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
      <Text style={styles.title}>Delete Worker</Text>
      {users.map((user) => (
        <TouchableOpacity
          key={user.id}
          onPress={() => handleDelete(user.id, user.name)}
          style={styles.deleteButton}
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
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '90%',
  },

});
