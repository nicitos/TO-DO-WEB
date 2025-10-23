import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, AlertProvider } from '@/template';
import { TaskProvider } from '@/contexts/TaskContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <AuthProvider>
        <TaskProvider>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </TaskProvider>
      </AuthProvider>
    </AlertProvider>
  );
}