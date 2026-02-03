import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Erreur', 'Vous devez accepter les conditions générales');
      return;
    }
    
    try {
      setLoading(true);
      await register(name, email, password, phone, acceptMarketing);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Inscription échouée', error.message);
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
            <Text style={styles.title}>Rejoins Invasion Latina</Text>
            <Text style={styles.subtitle}>Crée ton compte et prépare-toi à faire la fête</Text>
          </View>
          
          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom complet *</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean Dupont"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="ton@email.com"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Numéro de téléphone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+32 470 12 34 56"
                placeholderTextColor={theme.colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe *</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 caractères"
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmer le mot de passe *</Text>
              <TextInput
                style={styles.input}
                placeholder="Répète ton mot de passe"
                placeholderTextColor={theme.colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Consent Checkboxes */}
            <View style={styles.consentSection}>
              {/* Terms and Conditions - Required */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  J'accepte les{' '}
                  <Text style={styles.linkText}>conditions générales d'utilisation</Text>
                  {' '}et la{' '}
                  <Text style={styles.linkText}>politique de confidentialité</Text>
                  {' '}*
                </Text>
              </TouchableOpacity>

              {/* Marketing Consent - Optional */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcceptMarketing(!acceptMarketing)}
              >
                <View style={[styles.checkbox, acceptMarketing && styles.checkboxChecked]}>
                  {acceptMarketing && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  J'accepte de recevoir des informations sur les événements, promotions et actualités d'Invasion Latina par email et/ou SMS
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.requiredNote}>* Champs obligatoires</Text>
            
            <Button
              title="Créer mon compte"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          {/* Footer - Back to Login */}
          <TouchableOpacity
            style={styles.footer}
            onPress={() => router.back()}
          >
            <Text style={styles.footerText}>
              Déjà un compte ? <Text style={styles.footerLink}>Se connecter</Text>
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
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoImage: {
    width: 200,
    height: 100,
  },

  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '900' as any,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  form: {
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
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

  // Consent Section
  consentSection: {
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  requiredNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '600' as any,
  },
});
