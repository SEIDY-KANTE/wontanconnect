/**
 * App Navigator
 * 
 * Root navigation setup with React Navigation.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthNavigator } from './stacks/AuthNavigator';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { BrandIntroScreen } from '@/features/auth/screens/BrandIntroScreen';
import { colors } from '@/design/tokens/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  initialRoute: keyof RootStackParamList;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ initialRoute }) => {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="BrandIntro" 
          component={BrandIntroScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator}
          options={{ animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
