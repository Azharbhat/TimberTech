import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';

const LogSaved = ({ navigation, route }) => {
    const { key } = route.params;
    const [savedResults, setSavedResults] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const snapshot = await get(ref(database, `Mills/${key}/LogCalculations`));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const results = data ? Object.values(data) : [];
                    setSavedResults(results);
                } else {
                    setSavedResults([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error);
            }
        };
    
        fetchData();
    
        return () => {
            // Clean up any listeners or subscriptions
        };
    }, [key]);

    const handleItemPress = (item) => {
        navigation.navigate('LogSavedDetail', { data: item });
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
            <Text style={styles.title}>Saved Results</Text>
            <FlatList
                data={savedResults}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleItemPress(item)}>
                        <View style={styles.item}>
                            <Text style={styles.itemText}>Name: {item.name}</Text>
                            <Text style={styles.itemText}>Total: {item.total}</Text>
                            <Text style={styles.itemText}>Date: {new Date(item.timestamp).toLocaleString()}</Text>
                            {/* Add more details to display as needed */}
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#FFF8DC', // Ivory color background
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom:10,
        borderRadius:5,
        borderBottomWidth: 1,
        borderBottomColor: '#8B4513', // Wooden color border bottom
        paddingBottom: 5,
        backgroundColor:'#D2B48C',
        textAlign:'center'
    },
    item: {
        borderWidth:1,
        borderColor:'#D2B48C',
        padding: 10,
        backgroundColor: '#F5F5DC', // Beige color background
        marginBottom: 5,
        borderRadius: 5,
    },
    itemText: {
        fontSize: 16,
        color: '#8B4513', // Wooden color text
    },
});

export default LogSaved;
