import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { authenticateWithBiometrics } from '../utils/biometricAuth';
// import DashboardScreen from '../screens/DashboardScreen'; // To be created
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function AppLayout() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const session = await SecureStore.getItemAsync('session');
      if (session) {
        const success = await authenticateWithBiometrics();
        setInitialRoute(success ? 'Dashboard' : 'SignIn');
      } else {
        setInitialRoute('SignIn');
      }
    };
    checkSession();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        {/* <Stack.Screen name="Dashboard" component={DashboardScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
