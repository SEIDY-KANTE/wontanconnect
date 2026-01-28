/**
 * Messages Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MessagesStackParamList } from '../types';
import { InboxScreen } from '@/features/messages/screens/InboxScreen';
import { ChatScreen } from '@/features/messages/screens/ChatScreen';
import { colors } from '@/design/tokens/colors';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export const MessagesNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};
