import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../types';

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
          tabBarLabel: 'Dashboard',
          title: 'Charity Manager',
        }}
      />
      <Tab.Screen
        name="Donations"
        component={DonationsScreen}
        options={{
          tabBarLabel: 'Donations',
          title: 'Donations',
        }}
      />
      <Tab.Screen
        name="Donors"
        component={DonorsScreen}
        options={{
          tabBarLabel: 'Donors',
          title: 'Donors',
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarLabel: 'Projects',
          title: 'Projects',
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
          options={{ title: 'Add Donor' }}
        />
        <Stack.Screen
          name="EditDonor"
          component={AddDonorScreen}
          options={{ title: 'Edit Donor' }}
        />
        <Stack.Screen
          name="DonorProfile"
          component={DonorProfileScreen}
          options={{ title: 'Donor Profile' }}
        />
        <Stack.Screen
          name="AddProject"
          component={AddProjectScreen}
          options={{ title: 'Add Project' }}
        />
        <Stack.Screen
          name="EditProject"
          component={AddProjectScreen}
          options={{ title: 'Edit Project' }}
        />
        <Stack.Screen
          name="ProjectProfile"
          component={ProjectProfileScreen}
          options={{ title: 'Project Details' }}
        />
        <Stack.Screen
          name="AddDonation"
          component={AddDonationScreen}
          options={{ title: 'New Donation' }}
        />
        <Stack.Screen
          name="DropboxSettings"
          component={DropboxSettingsScreen}
          options={{ title: 'Dropbox Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
