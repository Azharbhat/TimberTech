// src/navigation/BottomTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../../screens/HomeFolder/HomeScreen'
import Profile from '../../screens/profile/Profile';
import Attendance from '../../screens/Attendance/Attendance';
import Dashboard from '../../screens/Dashboard/Dashboard';
import StaffScreen from '../../screens/Staff/StaffScreen';
import Calculators from '../../screens/LogCalculator/Calculators';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#5D4037', height: 65 },
        tabBarActiveTintColor: '#FFA500',
        tabBarInactiveTintColor: 'white',
        tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'stats-chart-outline';
              break;
            case 'Home':
              iconName = 'home-outline';
              break;
            case 'Attendance':
              iconName = 'clipboard-outline';
              break;
            case 'Profile':
              iconName = 'person-outline';
              break;
            case 'Staff':
              iconName = 'people-outline';
              break;
            case 'Calculators':
              iconName = 'calculator-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Staff" component={StaffScreen} />
      <Tab.Screen name="Calculators" component={Calculators} />
      <Tab.Screen name="Attendance" component={Attendance} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
