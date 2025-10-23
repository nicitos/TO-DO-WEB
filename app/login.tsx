import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';

export default function AuthScreen() {
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, signUpWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Error', 'Please enter both email and password');
      return;
    }

    const result = await signInWithPassword(email.trim(), password);
    if (result.error) {
      showAlert('Login Failed', result.error);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Step 1: Send OTP for email verification
    const otpResult = await sendOTP(email.trim());
    if (otpResult.error) {
      showAlert('Registration Failed', otpResult.error);
      return;
    }

    setMode('otp');
    showAlert('OTP Sent', 'Please check your email for the verification code');
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert('Error', 'Please enter the verification code');
      return;
    }

    // Step 2: Verify OTP and set password
    const result = await verifyOTPAndLogin(email.trim(), otp.trim(), { password });
    if (result.error) {
      showAlert('Verification Failed', result.error);
      // Stay on OTP screen to allow retry
    } else {
      showAlert('Success', 'Account created successfully!');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setMode('login');
  };

  const renderLoginForm = () => (
    <>
      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={20} color="#757575" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={20} color="#757575" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="password"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={20}
            color="#757575"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, operationLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={operationLoading}
      >
        <Text style={styles.primaryButtonText}>
          {operationLoading ? 'Signing In...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchModeButton}
        onPress={() => setMode('register')}
      >
        <Text style={styles.switchModeText}>
          Do not have an account? <Text style={styles.linkText}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={20} color="#757575" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={20} color="#757575" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={20}
            color="#757575"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={20} color="#757575" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, operationLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={operationLoading}
      >
        <Text style={styles.primaryButtonText}>
          {operationLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchModeButton}
        onPress={() => setMode('login')}
      >
        <Text style={styles.switchModeText}>
          Already have an account? <Text style={styles.linkText}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderOTPForm = () => (
    <>
      <View style={styles.otpContainer}>
        <MaterialIcons name="mail-outline" size={48} color="#1976D2" />
        <Text style={styles.otpTitle}>Check Your Email</Text>
        <Text style={styles.otpSubtitle}>
          We sent a verification code to {email}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="security" size={20} color="#757575" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter verification code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, operationLoading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={operationLoading}
      >
        <Text style={styles.primaryButtonText}>
          {operationLoading ? 'Verifying...' : 'Verify & Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchModeButton}
        onPress={resetForm}
      >
        <Text style={styles.switchModeText}>
          <Text style={styles.linkText}>Back to Sign In</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <MaterialIcons name="check-circle" size={64} color="#1976D2" />
            <Text style={styles.appTitle}>TaskMaster AI</Text>
            <Text style={styles.appSubtitle}>
              {mode === 'otp' 
                ? 'Email Verification' 
                : mode === 'register' 
                  ? 'Create Your Account' 
                  : 'Welcome Back'
              }
            </Text>
          </View>

          <View style={styles.form}>
            {mode === 'login' && renderLoginForm()}
            {mode === 'register' && renderRegisterForm()}
            {mode === 'otp' && renderOTPForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1976D2',
    marginTop: 16,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  eyeIcon: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: '#1976D2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchModeText: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
  },
  linkText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});