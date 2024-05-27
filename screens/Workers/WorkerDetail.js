import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { ref, push, serverTimestamp, set, get, onValue, off } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';

export default function WorkerDetail({ route }) {
  const { key, workerKey, data } = route.params;
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [savedData, setSavedData] = useState([]);
  const [savedDataa, setSavedDataa] = useState([]);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [attendanceData, setAttendanceData] = useState({});
  const [absentCountMonth, setAbsentCountMonth] = useState(0);
  const [presentCountMonth, setPresentCountMonth] = useState(0);
  const [absentCountYear, setAbsentCountYear] = useState(0);
  const [presentCountYear, setPresentCountYear] = useState(0);
  const [fullBoxTotal, setFullBoxTotal] = useState(0);
  const [halfBoxTotal, setHalfBoxTotal] = useState(0);
  const [oneSideTotal, setOneSideTotal] = useState(0);

  // Function to calculate the total amount
  const calculateTotal = (data) => {
    let totalAmount = 0;
    data.forEach(item => {
      totalAmount += parseInt(item.amount);
    });
    setTotal(totalAmount);
  };

  useEffect(() => {
    let fullTotal = 0;
    let halfTotal = 0;
    let oneSideTotal = 0;

    savedDataa.forEach(item => {
      switch (item.type) {
        case 'full':
          fullTotal += parseInt(item.amount);
          break;
        case 'half':
          halfTotal += parseInt(item.amount);
          break;
        case 'side':
          oneSideTotal += parseInt(item.amount);
          break;
        default:
          break;
      }
    });

    setFullBoxTotal(fullTotal);
    setHalfBoxTotal(halfTotal);
    setOneSideTotal(oneSideTotal);
  }, [savedDataa]);

  useEffect(() => {
    const dataRef = ref(database, `Mills/${key}/BoxMakers/${workerKey}/Data`);
    const onDataChange = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setSavedDataa(dataArray);
      } else {
        setSavedDataa([]);
      }
    });

    return () => {
      // Unsubscribe from data changes when component unmounts
      off(dataRef, onDataChange);
    };
  }, [key, workerKey]);

  // Function to calculate earnings based on worker type
  const calculateEarnings = () => {
    if (data.type === 'Normal') {
      // For normal workers, calculate earnings based on salary per day
      return parseInt(presentCountYear) * data.salaryPerDay;
    } else if (data.type === 'Boxmaker') {
      // For box makers, calculate earnings based on the number of boxes produced
      const fullEarned = fullBoxTotal * parseInt(data.salaryFullBox);
      const halfEarned = halfBoxTotal * parseInt(data.salaryHalfBox);
      const oneSideEarned = oneSideTotal * parseInt(data.salaryOneSide);
      return fullEarned + halfEarned + oneSideEarned;
    } else {
      return 0; // Default case
    }
  };

 
  useEffect(() => {
    const dataRef = ref(database, `Mills/${key}/Workers/${workerKey}/Data`);
    const onDataChange = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const results = data ? Object.values(data).reverse() : [];
        setSavedData(results);
        calculateTotal(results); // Calculate total after data fetching
      } else {
        setSavedData([]);
        setTotal(0); // Reset total if no data exists
      }
    });

    return () => {
      // Unsubscribe from data changes when component unmounts
      off(dataRef, onDataChange);
    };
  }, [addDataToDatabase]);

  const addDataToDatabase = async () => {
    try {
      // Validate input fields
      if (!note || !amount) {
        alert('Please enter both note and amount');
        return;
      }
  
      // Push data to Firebase database
      const dataRef = ref(database, `Mills/${key}/Workers/${workerKey}/Data`);
      const newDataRef = push(dataRef);
      const timestamp = serverTimestamp();
      await set(newDataRef, {
        note: note,
        amount: amount,
        timestamp: timestamp
      });
  
      // Data added successfully
      console.log('Data added to database');
    
      setNote('');
      setAmount('');
    } catch (error) {
      console.error('Error adding data to database: ', error);
      setError(error);
    }
  };

  const handleAmountChange = (text) => {
    // Regular expression to allow only numeric characters
    const numericRegex = /^[0-9]*$/;
    if (numericRegex.test(text)) {
      // If the input is valid numeric, update the state
      setAmount(text);
    }
    // If the input is not numeric, do not update the state
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${key}/Workers/${workerKey}/attendance`));
        if (snapshot.exists()) {
          setAttendanceData(snapshot.val());
        } else {
          setAttendanceData({});
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
    };

    fetchAttendanceData();
  }, [key, workerKey]);

  useEffect(() => {
    // Calculate total absent and present counts for month and year
    let absentMonth = 0;
    let presentMonth = 0;
    let absentYear = 0;
    let presentYear = 0;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Month starts from 0
    const currentYear = currentDate.getFullYear();

    for (const date in attendanceData) {
      if (attendanceData.hasOwnProperty(date)) {
        const [year, month] = date.split('-').map(Number);

        if (year === currentYear) {
          if (month === currentMonth) {
            if (attendanceData[date] === 'Absent') {
              absentMonth++;
            } else if (attendanceData[date] === 'Present') {
              presentMonth++;
            }
          }

          if (attendanceData[date] === 'Absent') {
            absentYear++;
          } else if (attendanceData[date] === 'Present') {
            presentYear++;
          }
        }
      }
    }

    setAbsentCountMonth(absentMonth);
    setPresentCountMonth(presentMonth);
    setAbsentCountYear(absentYear);
    setPresentCountYear(presentYear);
  }, [attendanceData]);

  return (
    <View style={styles.container}>
    <View style={styles.header}>
    <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
    <Text style={styles.title}>{(data.name).toUpperCase()}</Text>
    <Text style={styles.title}>Earned: {calculateEarnings()}</Text></View>
    <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
    <Text style={styles.title}>Paid: {total}</Text>
    {data.type=='Boxmaker'&&(<>
      <Text style={styles.title}>Balance: {calculateEarnings() - parseInt(total)}</Text>
      </>)}
      {data.type=='Normal'&&(<>
        <Text style={styles.title}>Balance: {(parseInt(presentCountYear) * data.salaryPerDay - parseInt(total))}</Text>
        </>)}
    </View>
    
    </View>
      <FlatList
        data={savedData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.Item} >
            
            <View style={styles.item}>
            <Text style={styles.itemText}>{item.note}</Text>
            <Text style={styles.itemText}>{item.amount}</Text>
            <View>
            <Text style={{}}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
            <Text style={{}}>{new Date(item.timestamp).toLocaleDateString()}</Text>
          </View>
            </View>
           

          </View>
        )}
      />

     

      <View>
        <TextInput
          style={styles.input}
          placeholder="Note"
          value={note}
          onChangeText={text => setNote(text)}
        />
        <View style={{display:'flex',flexDirection:'row',width:'100%',justifyContent:'space-between',paddingHorizontal:10}}>
        <TextInput
      style={{ width: "70%", borderBottomWidth: 1 }}
      placeholder="Amount"
      value={amount}
      onChangeText={handleAmountChange}
      keyboardType="numeric" // To show numeric keyboard
    />
        <TouchableOpacity style={styles.button} onPress={addDataToDatabase}>
          <Text style={styles.buttonText}>Add Data</Text>
        </TouchableOpacity>
        </View>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingBottom:15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color:'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Shadow color
    textShadowOffset: { width: 2, height: 2 }, // Shadow offset
    textShadowRadius: 10, 
    
  },
  header: {
    paddingTop:30,
    paddingVertical:10,
    display:'flex',
    
    justifyContent:'space-between',
    paddingHorizontal:10,
    borderRadius:5,
    borderBottomWidth: 1,
    borderBottomColor: '#8B4513', // Wooden color border bottom
    backgroundColor:'#D2B48C',
    textAlign:'center'
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderTopColor: '#ccc',
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#8B4513',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F5F5DC',
    borderRadius: 5,
    
  },
  Item: {
    backgroundColor: '#F5F5DC',
    marginBottom: 5,
    borderRadius: 5,
    height: 'auto'
  },
  itemText: {
    fontSize: 20,
    color: '#8B4513',
    width:150,
  },
  ItemText: {
    textAlign:'center',
    fontSize: 15,
    color:  'black',
  
  },
});
