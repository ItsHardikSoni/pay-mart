import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { Tabs, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminLayout() {
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    const beforeRemoveListener = (e: any) => {
      // Prevent default action
      e.preventDefault();

      // Show confirmation alert
      Alert.alert(
        'Logout Confirmation',
        'Are you sure you want to log out from the admin panel?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              // To prevent a loop, we must remove the listener before navigating away.
              navigation.removeListener('beforeRemove', beforeRemoveListener);

              // Perform logout
              await AsyncStorage.removeItem('paymart:adminLoggedIn');
              
              // Navigate to login screen
              router.replace('/admin-login');
            },
          },
        ]
      );
    };

    // Add the listener
    navigation.addListener('beforeRemove', beforeRemoveListener);

    // Return a cleanup function to remove the listener when the component unmounts
    return () => {
      navigation.removeListener('beforeRemove', beforeRemoveListener);
    };
  }, [navigation, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="edit"
        options={{
          title: 'Edit',
          tabBarIcon: ({ color, size }) => <Ionicons name="create" size={size} color={color} />,
          href: null,
        }}
      />
       <Tabs.Screen
        name="delete"
        options={{
          title: 'Delete',
          tabBarIcon: ({ color, size }) => <Ionicons name="trash" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
