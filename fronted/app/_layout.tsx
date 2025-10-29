// frontend/app/_layout.tsx -- ПОЛНЫЙ КОД

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/auth'; // <-- ИЗМЕНЕН ИМПОРТ
import { TaskProvider } from '@/contexts/TaskContext';

export default function RootLayout() {
  return (
    // <AlertProvider> удален
    <AuthProvider>
      <TaskProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </TaskProvider>
    </AuthProvider>
  );
}