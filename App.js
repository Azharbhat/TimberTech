import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from './Firebase/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreen from './screens/splash/SplashScreen';
import Costumer from './screens/Costumer/Costumer';
import Worker from './screens/Worker/Worker';
import BoxMaker from './screens/Worker/BoxMaker';
import HomeScreen from "./screens/HomeFolder/HomeScreen";
import Profile from './screens/profile/Profile';
import Login from './screens/Login/Login';
import Register from './screens/Login/Register';
import Welcome from './screens/Login/Welcome';
import Join from './screens/Login/Join';
import LogCalculator from './screens/LogCalculator/LogCalculator';
import LogSaved from './screens/LogCalculator/LogSaved';
import LogSavedDetail from './screens/LogCalculator/LogSavedDetail';
import Workers from './screens/Workers/Workers';
import WorkerDetail from './screens/Workers/WorkerDetail';
import AddWorker from './screens/Workers/AddWorker';
import DeleteWorker from './screens/Workers/DeleteWorker';
import Attendance from './screens/Attendance/Attendance';
import BoxBuyers from './screens/BoxBuyers/BoxBuyers';
import BoxMakers from './screens/BoxMakers/BoxMakers';
import Transporters from './screens/Transporters/Transporters';
import AddBoxMaker from './screens/BoxMakers/AddBoxMaker';
import AddTransporter from './screens/Transporters/AddTransporter';
import AddBoxBuyers from './screens/BoxBuyers/AddBoxBuyers';
import BoxBuyerDetails from './screens/BoxBuyers/BoxBuyerDetails';
import BoxMakerDetail from './screens/BoxMakers/BoxMakerDetail';
import TransporterDetail from './screens/Transporters/TransporterDetail';
import CostumerData from './screens/Costumer/CostumerData'
import AttendanceDetail from './screens/Attendance/AttendanceDetail';
import WoodCutter from './screens/WoodCutter/WoodCutter'
import WoodCutterDetail from './screens/WoodCutter/WoodCutterDetail';
import AddWoodCutter from './screens/WoodCutter/AddWoodCutter';
import FlatLogCalculator from './screens/LogCalculator/FlatLogCalculator';
import FlatLogSaved from './screens/LogCalculator/FlatLogSaved';
import FlatLogSavedDetail from './screens/LogCalculator/FlatLogSavedDetails';
import CopyId from './screens/Workers/CopyId';
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
    <Stack.Screen name="LogCalculator" component={LogCalculator} options={{ headerShown: false }} />
    <Stack.Screen name="LogSaved" component={LogSaved} options={{ headerShown: false }} />
    <Stack.Screen name="LogSavedDetail" component={LogSavedDetail} options={{ headerShown: false }} />
    <Stack.Screen name="Workers" component={Workers} options={{ headerShown: false }} />
    <Stack.Screen name="CopyId" component={CopyId} options={{ headerShown: false }} />
    <Stack.Screen name="WorkerDetail" component={WorkerDetail} options={{ headerShown: false }} />
    <Stack.Screen name="AddWorker" component={AddWorker} options={{ headerShown: false }} />
    <Stack.Screen name="DeleteWorker" component={DeleteWorker} options={{ headerShown: false }} />
    <Stack.Screen name="Attendance" component={Attendance} options={{ headerShown: false }} />
    <Stack.Screen name="AttendanceDetail" component={AttendanceDetail} options={{ headerShown: false }} />
    <Stack.Screen name="BoxBuyers" component={BoxBuyers} options={{ headerShown: false }} />
    <Stack.Screen name="BoxBuyerDetails" component={BoxBuyerDetails} options={{ headerShown: false }} />
    <Stack.Screen name="AddBoxBuyers" component={AddBoxBuyers} options={{ headerShown: false }} />
    <Stack.Screen name="BoxMakers" component={BoxMakers} options={{ headerShown: false }} />
    <Stack.Screen name="BoxMakerDetail" component={BoxMakerDetail} options={{ headerShown: false }} />
    <Stack.Screen name="AddBoxMaker" component={AddBoxMaker} options={{ headerShown: false }} />
    <Stack.Screen name="Transporters" component={Transporters} options={{ headerShown: false }} />
    <Stack.Screen name="TransporterDetail" component={TransporterDetail} options={{ headerShown: false }} />
    <Stack.Screen name="AddTransporter" component={AddTransporter} options={{ headerShown: false }} />
    <Stack.Screen name="WoodCutter" component={WoodCutter} options={{ headerShown: false }} />
    <Stack.Screen name="AddWoodCutter" component={AddWoodCutter} options={{ headerShown: false }} />
    <Stack.Screen name="WoodCutterDetail" component={WoodCutterDetail} options={{ headerShown: false }} />
    <Stack.Screen name="FlatLogCalculator" component={FlatLogCalculator} options={{ headerShown: false }} />
    <Stack.Screen name="FlatLogSaved" component={FlatLogSaved} options={{ headerShown: false }} />
    <Stack.Screen name="FlatLogSavedDetail" component={FlatLogSavedDetail} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
    <Stack.Screen name="Join" component={Join} options={{ headerShown: false }} />
    <Stack.Screen name="CostumerData" component={CostumerData} options={{ headerShown: false }} />
    <Stack.Screen name="Worker" component={Worker} options={{ headerShown: false }} />
    <Stack.Screen name="BoxMaker" component={BoxMaker} options={{ headerShown: false }} />
    <Stack.Screen name='Costumer' component={Costumer} options={{headerShown:false}} />

  </Stack.Navigator>
);
const BoxMakerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="BoxMaker" component={BoxMaker} options={{ headerShown: false }} />
    <Stack.Screen name='Worker' component={Worker} options={{headerShown:false}} />
    <Stack.Screen name='Costumer' component={Costumer} options={{headerShown:false}} />
  </Stack.Navigator>
);


const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCostumer, setIsCostumer] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
  const [isBoxMaker, setIsBoxMaker] = useState(false);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const userLoggedIn = await AsyncStorage.getItem('TimberTechTokken');
        setIsLoggedIn(!!userLoggedIn); // Convert stored value to boolean

        const userCostumer = await AsyncStorage.getItem('TimberTechCustomer');
        setIsCostumer(!!userCostumer); // Convert stored value to boolean
        const userWorker = await AsyncStorage.getItem('TimberTechWorker');
       
         setIsWorker(!!userWorker);
        const userBoxMaker = await AsyncStorage.getItem('TimberTechBoxmaker');
         setIsBoxMaker(!!userBoxMaker);

      } catch (error) {
        console.error('Error checking user authentication status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="skyblue" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack.Navigator>
          {isCostumer ?( <Stack.Screen name="Costumer" component={Costumer} options={{ headerShown: false }} />):(null) }
          {isWorker ?( <Stack.Screen name="Worker" component={Worker} options={{ headerShown: false }} />):(null) }
          {isBoxMaker ?(<Stack.Screen name="BoxMakerStack" component={BoxMakerStack} options={{ headerShown: false }} />):(null) }
          {isLoggedIn ? (
            <Stack.Screen name="HomeStack" component={HomeStack} options={{ headerShown: false }} />
          ) :  (
            <Stack.Screen name="AuthStack" component={AuthStack} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </GestureHandlerRootView>
    </NavigationContainer>
  );
};

export default App;
