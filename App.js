// App.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './src/redux/store';
import { fetchMillData } from './src/redux/slices/millSlice';

// --- Screens ---
import Splash from './screens/splash/SplashScreen';
import Welcome from './screens/Login/Welcome';
import Login from './screens/Login/Login';
import Register from './screens/Login/Register';
import Join from './screens/Login/Join';
import Costumer from './screens/Costumer/Costumer';
import CostumerData from './screens/Costumer/CostumerData';
import Worker from './screens/Worker/Worker';
import ManageEntry from './screens/ManageEntry';
import WorkerDetail from './screens/Workers/WorkerDetail';
import BoxMaker from './screens/Worker/BoxMaker';
import BoxMakerDetail from './screens/BoxMakers/BoxMakerDetail';
import BoxBuyerDetails from './screens/BoxBuyers/BoxBuyerDetails';
import TransporterDetail from './screens/Transporters/TransporterDetail';
import AttendanceDetail from './screens/Attendance/AttendanceDetail';
import WoodCutterDetail from './screens/WoodCutter/WoodCutterDetail';
import LogCalculator from './screens/LogCalculator/LogCalculator';
import LogSaved from './screens/LogCalculator/LogSaved';
import LogSavedDetail from './screens/LogCalculator/LogSavedDetail';
import FlatLogCalculator from './screens/LogCalculator/FlatLogCalculator';
import FlatLogSaved from './screens/LogCalculator/FlatLogSaved';
import FlatLogSavedDetail from './screens/LogCalculator/FlatLogSavedDetails';
import ListScreen from './screens/ListScreen';
import Profile from './screens/profile/Profile';
import Attendance from './screens/Attendance/Attendance';
import Dashboard from './screens/Dashboard/Dashboard';
import Calculators from './screens/LogCalculator/Calculators';
import Staff from './screens/Staff/StaffScreen';
import OtherExpenses from './screens/OtherExpenses/OtherExpenses';
import OtherIncome from './screens/OtherIncome/OtherIncome';

const Stack = createStackNavigator();
SplashScreen.preventAutoHideAsync();

/* ---------------- Hook: Load Fonts ---------------- */
const useLoadFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
        'Montserrat-Regular': require('./assets/fonts/Montserrat-Regular.ttf'),
        'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
      });
      setFontsLoaded(true);
      await SplashScreen.hideAsync();
    }
    loadFonts();
  }, []);

  return fontsLoaded;
};

/* ---------------- AuthStack ---------------- */
const AuthStack = ({ setIsLoggedIn }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={Splash} />
    <Stack.Screen name="Welcome" component={Welcome} />
    <Stack.Screen name="Login">
      {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
    </Stack.Screen>
    <Stack.Screen name="Register">
      {(props) => <Register {...props} setIsLoggedIn={setIsLoggedIn} />}
    </Stack.Screen>
    <Stack.Screen name="Join" component={Join} />
    <Stack.Screen name="CostumerData" component={CostumerData} />
    <Stack.Screen name="Worker" component={Worker} />
    <Stack.Screen name="BoxMaker" component={BoxMaker} />
    <Stack.Screen name="Costumer" component={Costumer} />
  </Stack.Navigator>
);

/* ---------------- AppStack ---------------- */
const AppStack = ({ setIsLoggedIn }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard">
      {(props) => <Dashboard {...props} setIsLoggedIn={setIsLoggedIn} />}
    </Stack.Screen>
    <Stack.Screen name="Profile">
      {(props) => <Profile {...props} setIsLoggedIn={setIsLoggedIn} />}
    </Stack.Screen>
    <Stack.Screen name="Staff" component={Staff} />
    <Stack.Screen name="Calculators" component={Calculators} />
    <Stack.Screen name="Attendance" component={Attendance} />
    <Stack.Screen name="ManageEntry" component={ManageEntry} />
    <Stack.Screen name="WorkerDetail" component={WorkerDetail} />
    <Stack.Screen name="BoxMakerDetail" component={BoxMakerDetail} />
    <Stack.Screen name="BoxBuyerDetails" component={BoxBuyerDetails} />
    <Stack.Screen name="TransporterDetail" component={TransporterDetail} />
    <Stack.Screen name="AttendanceDetail" component={AttendanceDetail} />
    <Stack.Screen name="WoodCutterDetail" component={WoodCutterDetail} />
    <Stack.Screen name="LogCalculator" component={LogCalculator} />
    <Stack.Screen name="LogSaved" component={LogSaved} />
    <Stack.Screen name="LogSavedDetail" component={LogSavedDetail} />
    <Stack.Screen name="FlatLogCalculator" component={FlatLogCalculator} />
    <Stack.Screen name="FlatLogSaved" component={FlatLogSaved} />
    <Stack.Screen name="FlatLogSavedDetail" component={FlatLogSavedDetail} />
    <Stack.Screen name="ListScreen" component={ListScreen} />
    <Stack.Screen name="OtherExpenses" component={OtherExpenses} />
    <Stack.Screen name="OtherIncome" component={OtherIncome} />
  </Stack.Navigator>
);

/* ---------------- AppContent ---------------- */
const AppContent = () => {
  const fontsLoaded = useLoadFonts();
  const dispatch = useDispatch();
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { loading: millLoading, error: millError } = useSelector((s) => s.mill);

  // Check AsyncStorage token
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('TimberTechTokken');
        setIsLoggedIn(!!token);
      } catch (err) {
        console.error('checkUserStatus error:', err);
      } finally {
        setIsLoadingLocal(false);
      }
    };
    checkUserStatus();
  }, []);

  // Fetch mill data if logged in
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchMillData());
    }
  }, [dispatch, isLoggedIn]);

  const stillLoading = !fontsLoaded || isLoadingLocal || millLoading;

  if (stillLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#5D4037' }}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  if (millError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#5D4037' }}>
        <Text style={{ color: 'white' }}>{millError}</Text>
      </View>
    );
  }

  return isLoggedIn ? <AppStack setIsLoggedIn={setIsLoggedIn} /> : <AuthStack setIsLoggedIn={setIsLoggedIn} />;
};

/* ---------------- Main App ---------------- */
export default function App() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </GestureHandlerRootView>
    </Provider>
  );
}
