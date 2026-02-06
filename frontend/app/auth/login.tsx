import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import api from '../../src/config/api';

// Only import Google Auth on native platforms
let useAuthRequest: any = null;
if (Platform.OS !== 'web') {
  const Google = require('expo-auth-session/providers/google');
  useAuthRequest = Google.useAuthRequest;
}

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.GOOGLE_IOS_CLIENT_ID || '';
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

export default function LoginScreen() {
  const router = useRouter();
  const { login, setUser, setToken } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);

  // Google Auth - only on native platforms
  const googleAuth = isNativePlatform && useAuthRequest ? useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID,
  }) : [null, null, () => {}];
  
  const [request, response, promptAsync] = googleAuth;

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication?.accessToken);
    }
  }, [response]);

  const handleGoogleSignIn = async (accessToken: string | undefined) => {
    if (!accessToken) return;
    
    try {
      setSocialLoading('google');
      
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();
      
      // Send to our backend
      const result = await api.post('/auth/social', {
        provider: 'google',
        id_token: accessToken,
        user_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
      });
      
      if (result.data.access_token) {
        setToken(result.data.access_token);
        setUser(result.data);
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert('Erreur', 'Connexion Google échouée');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setSocialLoading('apple');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Send to our backend
      const result = await api.post('/auth/social', {
        provider: 'apple',
        id_token: credential.identityToken,
        user_id: credential.user,
        email: credential.email,
        name: credential.fullName 
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : undefined,
      });
      
      if (result.data.access_token) {
        setToken(result.data.access_token);
        setUser(result.data);
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled
        return;
      }
      console.error('Apple sign in error:', error);
      Alert.alert('Erreur', 'Connexion Apple échouée');
    } finally {
      setSocialLoading(null);
    }
  };
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Attempting login...');
      await login(email, password);
      console.log('Login successful, navigating to home...');
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Erreur de connexion', error.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/invasion-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenue</Text>
            <Text style={styles.subtitle}>Connecte-toi pour continuer la fiesta</Text>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtons}>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.appleButton}
                onPress={handleAppleSignIn}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color="white" />
                    <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request || socialLoading !== null}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator color="#333" />
              ) : (
                <>
                  <Image 
                    source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>
          
          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ton@email.com"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Entre ton mot de passe"
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
            
            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
          
          {/* Footer */}
          <TouchableOpacity
            style={styles.footer}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.footerText}>
              Pas encore de compte ? <Text style={styles.footerLink}>Inscris-toi</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoImage: {
    width: 220,
    height: 110,
  },
  
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: '900' as any,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },

  // Social Buttons
  socialButtons: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.elevated,
  },
  appleButtonText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: '600' as any,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    gap: theme.spacing.sm,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: '#333',
    fontSize: theme.fontSize.md,
    fontWeight: '600' as any,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.elevated,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
  },
  
  form: {
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.elevated,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
  },
  
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '700' as any,
  },
});