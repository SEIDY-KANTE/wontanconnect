/**
 * FX Exchange Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FXStackParamList } from '../types';
import { FXListScreen } from '@/features/fx/screens/FXListScreen';
import { FXDetailScreen } from '@/features/fx/screens/FXDetailScreen';
import { FXCreateScreen } from '@/features/fx/screens/FXCreateScreen';
import { colors } from '@/design/tokens/colors';

const Stack = createNativeStackNavigator<FXStackParamList>();

export const FXNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="FXList" component={FXListScreen} />
      <Stack.Screen name="FXDetail" component={FXDetailScreen} />
      <Stack.Screen 
        name="FXCreate" 
        component={FXCreateScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }}
      />
    </Stack.Navigator>
  );
};
