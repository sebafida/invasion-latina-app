import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Share,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../src/config/theme';
import api from '../src/config/api';

export default function ReferralScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState<{
    referral_code: string;
    referral_count: number;
    coins_per_referral: number;
    share_message: string;
  } | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [inputCode, setInputCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [showApplySection, setShowApplySection] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [codeRes, referralsRes] = await Promise.all([
        api.get('/referral/my-code'),
        api.get('/referral/my-referrals'),
      ]);
      
      setReferralData(codeRes.data);
      setReferrals(referralsRes.data.referrals);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (referralData?.referral_code) {
      await Clipboard.setStringAsync(referralData.referral_code);
      Alert.alert('Copié !', 'Code de parrainage copié dans le presse-papier');
    }
  };

  const shareCode = async () => {
    if (referralData?.share_message) {
      try {
        await Share.share({
          message: referralData.share_message,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const applyCode = async () => {
    if (!inputCode.trim()) {
      Alert.alert('Erreur', 'Entre un code de parrainage');
      return;
    }
    
    try {
      setIsApplying(true);
      const response = await api.post('/referral/apply', { referral_code: inputCode.trim() });
      Alert.alert('Félicitations !', response.data.message);
      setInputCode('');
      setShowApplySection(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Code invalide');
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parrainage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <FontAwesome name="gift" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Invite tes amis !</Text>
          <Text style={styles.heroSubtitle}>
            Gagnez tous les deux 3 Invasion Coins quand ton ami s'inscrit avec ton code
          </Text>
        </View>

        {/* My Code Section */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionLabel}>TON CODE DE PARRAINAGE</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralData?.referral_code}</Text>
            <TouchableOpacity onPress={copyCode} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.shareButton} onPress={shareCode}>
            <Ionicons name="share-social" size={20} color="white" />
            <Text style={styles.shareButtonText}>Partager avec mes amis</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{referralData?.referral_count || 0}</Text>
            <Text style={styles.statLabel}>Amis invités</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{(referralData?.referral_count || 0) * 3}</Text>
            <Text style={styles.statLabel}>Coins gagnés</Text>
          </View>
        </View>

        {/* Apply Code Section */}
        <TouchableOpacity 
          style={styles.applyToggle}
          onPress={() => setShowApplySection(!showApplySection)}
        >
          <Text style={styles.applyToggleText}>
            Tu as un code de parrainage ?
          </Text>
          <Ionicons 
            name={showApplySection ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>

        {showApplySection && (
          <View style={styles.applySection}>
            <TextInput
              style={styles.applyInput}
              placeholder="Entre le code de ton ami"
              placeholderTextColor={theme.colors.textMuted}
              value={inputCode}
              onChangeText={setInputCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={applyCode}
              disabled={isApplying}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.applyButtonText}>Appliquer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Referrals History */}
        {referrals.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Mes parrainages</Text>
            {referrals.map((ref, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyAvatar}>
                  <Text style={styles.historyAvatarText}>
                    {ref.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{ref.name}</Text>
                  <Text style={styles.historyDate}>{formatDate(ref.date)}</Text>
                </View>
                <View style={styles.historyCoins}>
                  <Text style={styles.historyCoinsText}>+{ref.coins_earned}</Text>
                  <FontAwesome name="star" size={12} color={theme.colors.primary} />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevated,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  codeSection: {
    backgroundColor: theme.colors.elevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 12,
    letterSpacing: 1,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.black,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeText: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: theme.colors.elevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.textMuted,
    marginHorizontal: 20,
  },
  applyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  applyToggleText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  applySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  applyInput: {
    flex: 1,
    backgroundColor: theme.colors.elevated,
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  historyCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyCoinsText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
