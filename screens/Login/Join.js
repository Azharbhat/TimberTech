import React, { useState, useEffect } from 'react';
import { View, Text, Pressable,ImageBackground, FlatList, Image, StyleSheet, TextInput } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig'; // Import Firebase database reference
import { ref, onValue } from 'firebase/database'; // Import ref and onValue from 'firebase/database'

// MillItem component to represent each mill item


export default function Join({route,navigation}) {
  const {title}=route.params;


  const [mills, setMills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMills, setFilteredMills] = useState([]);
  const MillItem = ({ mill }) => {
    return (
      <View style={styles.millItem}>
        <Image source={{ uri: mill.image }} style={styles.millImage} />
        <View style={styles.millInfo}>
          <Text style={styles.millName}>{mill.millname}</Text>
          <Text style={styles.ownerName}>Owner: {mill.username}</Text>
        </View>
        <Pressable style={styles.joinButton} onPress={()=>{navigation.navigate('CostumerData',{title:title,millId:mill.key})}}>
          <Text style={styles.joinButtonText}>Join</Text>
        </Pressable>
      </View>
    );
  };
  useEffect(() => {
    // Fetch mills data from Firebase database
    const fetchMills = async () => {
      try {
        const millsRef = ref(database, 'Mills');
        onValue(millsRef, (snapshot) => {
          const millsData = snapshot.val();
          if (millsData) {
            const millsArray = Object.keys(millsData).map((key) => ({
              key: key, // Adding key to the object
              ...millsData[key], // Spread other properties from the data
            }));
            setMills(millsArray);
            setFilteredMills(millsArray); // Initially, set filteredMills to all mills
          } else {
            setMills([]);
            setFilteredMills([]);
          }
        });
      } catch (error) {
        console.error('Error fetching mills:', error);
      }
    };
    

    fetchMills();
  }, []);

  // Filtering function
  const filterMills = (query) => {
    const filtered = mills.filter((mill) => {
      return mill.username.toLowerCase().includes(query.toLowerCase()) ||
             mill.millname.toLowerCase().includes(query.toLowerCase());
    });
    setFilteredMills(filtered);
    setSearchQuery(query);
  };
  return (
    
    <ImageBackground source={require('../../images/background.jpg')} style={styles.imageBackground}>
      <View style={styles.container}>
      <Text style={{fontSize:30,fontWeight:'bold',textAlign:'center',color:'white'}}>All Mills</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Owner or millname"
        onChangeText={filterMills}
        value={searchQuery}
      />
      <FlatList
        data={filteredMills}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <MillItem mill={item} />}
      />
    
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding:10,
    flex: 1,
  
  },
  imageBackground: {
  width: '100%',        // fill width of parent
  height: '100%',       // fill height of parent
  resizeMode: 'cover',  // keep aspect ratio, cover area
  justifyContent: 'center',
  overflow: 'hidden',   // prevent image overflow
 },
  millItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  millImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10,
  },
  millInfo: {
    flex: 1,
  },
  millName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ownerName: {
    fontSize: 16,
    color: 'gray',
  },
  joinButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchInput: {
    height: 60,
    borderColor: 'white',
    color:'white',
    fontSize:20,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});
