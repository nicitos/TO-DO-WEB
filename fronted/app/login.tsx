import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { showAlert } from '@/lib/alert';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Ошибка', 'Пожалуйста, введите email и пароль');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });
    setLoading(false);
    if (error) {
      showAlert('Ошибка входа', 'Неверный email или пароль.');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Ошибка', 'Пароли не совпадают');
      return;
    }
    if (password.length < 6) {
      showAlert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    // Шаг 1: Проверяем, существует ли пользователь, ВЫЗЫВАЯ НАШУ RPC-ФУНКЦИЮ
    const { data: userExists, error: checkError } = await supabase.rpc('check_if_user_exists', {
      p_email: email.trim()
    });

    if (checkError) {
      setLoading(false);
      showAlert('Ошибка сервера', 'Не удалось проверить пользователя. Попробуйте снова.');
      console.error(checkError);
      return;
    }

    // Шаг 2: Если пользователь существует, выдаем ошибку и останавливаемся
    if (userExists) {
      setLoading(false);
      showAlert('Ошибка регистрации', 'Пользователь с таким email уже существует. Попробуйте войтицw.');
      return;
    }

    // Шаг 3: Если пользователя нет, продолжаем регистрацию
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    setLoading(false);

    if (signUpError) {
      showAlert('Ошибка регистрации', signUpError.message);
      return;
    }

    if (user) {
      setMode('otp');
      showAlert('Код отправлен', 'Мы отправили код подтверждения на вашу почту.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert('Ошибка', 'Пожалуйста, введите код подтверждения');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: 'signup',
    });
    setLoading(false);
    if (error) {
      showAlert('Ошибка верификации', 'Неверный код подтверждения.');
    } else {
      showAlert('Успех!', 'Ваш аккаунт подтвержден. Теперь, пожалуйста, войдите, используя ваш пароль.');
      resetForm();
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setMode('login');
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 48 }} />;
    }
    if (mode === 'login') return renderLoginForm();
    if (mode === 'register') return renderRegisterForm();
    if (mode === 'otp') return renderOTPForm();
    return null;
  };

  const renderLoginForm = () => (
      <>
        <View style={styles.inputContainer}><MaterialIcons name="email" size={20} color="#757575" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View>
        <View style={styles.inputContainer}><MaterialIcons name="lock" size={20} color="#757575" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="password" /><TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}><MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#757575" /></TouchableOpacity></View>
        <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? 'Вход...' : 'Войти'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.switchModeButton} onPress={() => setMode('register')}><Text style={styles.switchModeText}>Нет аккаунта? <Text style={styles.linkText}>Зарегистрироваться</Text></Text></TouchableOpacity>
      </>
  );

  const renderRegisterForm = () => (
      <>
        <View style={styles.inputContainer}><MaterialIcons name="email" size={20} color="#757575" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View>
        <View style={styles.inputContainer}><MaterialIcons name="lock" size={20} color="#757575" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="new-password" /><TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}><MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#757575" /></TouchableOpacity></View>
        <View style={styles.inputContainer}><MaterialIcons name="lock" size={20} color="#757575" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} autoComplete="new-password" /></View>
        <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? 'Создание...' : 'Создать аккаунт'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.switchModeButton} onPress={() => setMode('login')}><Text style={styles.switchModeText}>Уже есть аккаунт? <Text style={styles.linkText}>Войти</Text></Text></TouchableOpacity>
      </>
  );

  const renderOTPForm = () => (
      <>
        <View style={styles.otpContainer}><MaterialIcons name="mail-outline" size={48} color="#1976D2" /><Text style={styles.otpTitle}>Проверьте вашу почту</Text><Text style={styles.otpSubtitle}>Мы отправили код подтверждения на {email}</Text></View>
        <View style={styles.inputContainer}><MaterialIcons name="security" size={20} color="#757575" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Введите код" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} /></View>
        <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleVerifyOTP} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? 'Подтверждение...' : 'Подтвердить'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.switchModeButton} onPress={resetForm}><Text style={styles.switchModeText}><Text style={styles.linkText}>Назад ко входу</Text></Text></TouchableOpacity>
      </>
  );

  return (
      <SafeAreaView style={styles.container}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}><ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><View style={styles.header}><MaterialIcons name="check-circle" size={64} color="#1976D2" /><Text style={styles.appTitle}>TaskMaster AI</Text><Text style={styles.appSubtitle}>{mode === 'otp' ? 'Подтверждение почты' : mode === 'register' ? 'Создание аккаунта' : 'С возвращением!'}</Text></View><View style={styles.form}>{renderContent()}</View></ScrollView></KeyboardAvoidingView></SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F8F9FA' }, keyboardView: { flex: 1 }, scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }, header: { alignItems: 'center', marginBottom: 48 }, appTitle: { fontSize: 32, fontWeight: '700', color: '#1976D2', marginTop: 16, marginBottom: 8 }, appSubtitle: { fontSize: 16, color: '#616161', textAlign: 'center' }, form: { width: '100%', maxWidth: 400, alignSelf: 'center' }, inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E0E0E0' }, inputIcon: { marginRight: 12 }, input: { flex: 1, fontSize: 16, color: '#212121' }, eyeIcon: { padding: 4 }, primaryButton: { backgroundColor: '#1976D2', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 }, buttonDisabled: { backgroundColor: '#BDBDBD' }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }, switchModeButton: { alignItems: 'center', paddingVertical: 12 }, switchModeText: { fontSize: 14, color: '#616161', textAlign: 'center' }, linkText: { color: '#1976D2', fontWeight: '600' }, otpContainer: { alignItems: 'center', marginBottom: 32 }, otpTitle: { fontSize: 24, fontWeight: '600', color: '#212121', marginTop: 16, marginBottom: 8 }, otpSubtitle: { fontSize: 14, color: '#616161', textAlign: 'center', paddingHorizontal: 16 }, });