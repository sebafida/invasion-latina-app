import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';

interface NotificationStats {
  total_users: number;
  users_with_push_tokens: number;
  coverage_percentage: number;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.get('/admin/notifications/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le titre et le message');
      return;
    }

    Alert.alert(
      'Confirmer l\'envoi',
      `Envoyer cette notification à ${stats?.users_with_push_tokens || 0} utilisateurs ?\n\n"${title}"\n${body}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.post('/admin/notifications/broadcast', {
                title: title.trim(),
                body: body.trim(),
                notification_type: notificationType,
              });
              
              Alert.alert(
                'Succès',
                response.data.message,
                [{ text: 'OK', onPress: () => {
                  setTitle('');
                  setBody('');
                  setNotificationType(null);
                }}]
              );
            } catch (error: any) {
              console.error('Failed to send notification:', error);
              Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'envoyer la notification');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const notificationTypes = [
    { key: null, label: 'Tous les utilisateurs', icon: 'people' },
    { key: 'new_events', label: 'Nouveaux événements', icon: 'calendar' },
    { key: 'promotions', label: 'Promotions', icon: 'pricetag' },
  ];

  const quickTemplates = [
    {
      title: '🎉 Nouvel événement !',
      body: 'Découvrez notre prochain événement Invasion Latina ! Réservez vos places maintenant.',
      type: 'new_events',
    },
    {
      title: '🔥 Offre spéciale',
      body: 'Profitez de -20% sur les réservations VIP ce week-end !',
      type: 'promotions',
    },
    {
      title: '🎵 Line-up annoncé',
      body: 'Le line-up complet de notre prochain événement est disponible !',
      type: 'new_events',
    },
  ];

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications Push</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Stats Card */}
          <View style={styles.statsCard}>
            {loadingStats ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : stats ? (
              <>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.total_users}</Text>
                    <Text style={styles.statLabel}>Utilisateurs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.users_with_push_tokens}</Text>
                    <Text style={styles.statLabel}>Avec notifications</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.colors.success }]}>
                      {stats.coverage_percentage}%
                    </Text>
                    <Text style={styles.statLabel}>Couverture</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.errorText}>Erreur de chargement</Text>
            )}
          </View>

          {/* Quick Templates */}
          <Text style={styles.sectionTitle}>📝 Modèles rapides</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
            {quickTemplates.map((template, index) => (
              <TouchableOpacity
                key={index}
                style={styles.templateCard}
                onPress={() => {
                  setTitle(template.title);
                  setBody(template.body);
                  setNotificationType(template.type);
                }}
              >
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateBody} numberOfLines={2}>{template.body}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Notification Form */}
          <Text style={styles.sectionTitle}>✉️ Composer une notification</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 🎉 Nouvel événement !"
              placeholderTextColor={theme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
            <Text style={styles.charCount}>{title.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Écrivez votre message ici..."
              placeholderTextColor={theme.colors.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.charCount}>{body.length}/200</Text>
          </View>

          {/* Target Selection */}
          <Text style={styles.inputLabel}>Audience cible</Text>
          <View style={styles.typeSelector}>
            {notificationTypes.map((type) => (
              <TouchableOpacity
                key={type.key || 'all'}
                style={[
                  styles.typeOption,
                  notificationType === type.key && styles.typeOptionActive
                ]}
                onPress={() => setNotificationType(type.key)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={notificationType === type.key ? 'white' : theme.colors.textMuted}
                />
                <Text style={[
                  styles.typeOptionText,
                  notificationType === type.key && styles.typeOptionTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, (!title.trim() || !body.trim()) && { opacity: 0.5 }]}
            onPress={handleSendNotification}
            disabled={loading || !title.trim() || !body.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.sendButtonText}>Envoyer la notification</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            <Text style={styles.infoText}>
              Les notifications seront envoyées uniquement aux utilisateurs qui ont activé les notifications dans leurs préférences.
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  templatesScroll: {
    marginBottom: theme.spacing.md,
  },
  templateCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    width: 200,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  templateBody: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  typeOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  typeOptionText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  typeOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
    padding: theme.spacing.md,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
