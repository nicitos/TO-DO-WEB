// frontend/app/index.tsx -- ПОЛНЫЙ КОД

import React from 'react';
import { AuthRouter } from '@/lib/auth'; // <-- ИЗМЕНЕН ИМПОРТ
import { Redirect } from 'expo-router';

export default function RootScreen() {
  // Логика внутри AuthRouter теперь сама разберется, куда перенаправить пользователя
  return (
    <AuthRouter>
      <Redirect href="/(tabs)" />
    </AuthRouter>
  );
}