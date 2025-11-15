import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { t } from '../utils/helpers';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import DonorsScreen from '../screens/donors/DonorsScreen';
import AddDonorScreen from '../screens/donors/AddDonorScreen';
import DonorProfileScreen from '../screens/donors/DonorProfileScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import AddProjectScreen from '../screens/projects/AddProjectScreen';
import ProjectProfileScreen from '../screens/projects/ProjectProfileScreen';
import DonationsScreen from '../screens/donations/DonationsScreen';
import AddDonationScreen from '../screens/donations/AddDonationScreen';
import DropboxSettingsScreen from '../screens/settings/DropboxSettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('dashboard'),
          title: t('charityManager'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Donations"
        component={DonationsScreen}
        options={{
          tabBarLabel: t('donations'),
          title: t('donations'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Donors"
        component={DonorsScreen}
        options={{
          tabBarLabel: t('donors'),
          title: t('donors'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarLabel: t('projects'),
          title: t('projects'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" size={size} color={color} />
          ),
        }}
      /> 
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddDonor"
          component={AddDonorScreen}
          options={{ title: t('addDonor') }}
        />
        <Stack.Screen
          name="EditDonor"
          component={AddDonorScreen}
          options={{ title: t('editDonor') }}
        />
        <Stack.Screen
          name="DonorProfile"
          component={DonorProfileScreen}
          options={{ title: t('donorProfile') }}
        />
        <Stack.Screen
          name="AddProject"
          component={AddProjectScreen}
          options={{ title: t('addProject') }}
        />
        <Stack.Screen
          name="EditProject"
          component={AddProjectScreen}
          options={{ title: t('editProject') }}
        />
        <Stack.Screen
          name="ProjectProfile"
          component={ProjectProfileScreen}
          options={{ title: t('projectDetails') }}
        />
        <Stack.Screen
          name="AddDonation"
          component={AddDonationScreen}
          options={{ title: t('newDonation') }}
        />
        <Stack.Screen
          name="DropboxSettings"
          component={DropboxSettingsScreen}
          options={{ title: t('dropboxSettings') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
