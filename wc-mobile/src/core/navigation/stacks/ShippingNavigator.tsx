/**
 * Shipping Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ShippingStackParamList } from '../types';
import { ShippingListScreen } from '@/features/shipping/screens/ShippingListScreen';
import { ShippingDetailScreen } from '@/features/shipping/screens/ShippingDetailScreen';
import { ShippingCreateScreen } from '@/features/shipping/screens/ShippingCreateScreen';
import { colors } from '@/design/tokens/colors';

const Stack = createNativeStackNavigator<ShippingStackParamList>();

export const ShippingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="ShippingList" component={ShippingListScreen} />
      <Stack.Screen name="ShippingDetail" component={ShippingDetailScreen} />
      <Stack.Screen 
        name="ShippingCreate" 
        component={ShippingCreateScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }}
      />
    </Stack.Navigator>
  );
};
