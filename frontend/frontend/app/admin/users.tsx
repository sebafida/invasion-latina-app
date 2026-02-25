import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  loyalty_points: number;
  referral_code: string;
  created_at: string;
}

interface Stats {
  total_users: number;
  new_users_this_month: number;
  total_events: number;
  total_bookings: number;
  total_song_requests: number;
  total_referrals: number;
  total_loyalty_points: number;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadUsers(), loadStats()]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { search: searchQuery, page, limit: 50 }
      });
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
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
        <Text style={styles.headerTitle}>Utilisateurs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <FontAwesome name="users" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{stats.total_users}</Text>
              <Text style={styles.statLabel}>Utilisateurs</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome name="user-plus" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.new_users_this_month}</Text>
              <Text style={styles.statLabel}>Ce mois</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome name="star" size={24} color="#FFC107" />
              <Text style={styles.statValue}>{stats.total_loyalty_points}</Text>
              <Text style={styles.statLabel}>Coins total</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome name="gift" size={24} color="#E91E63" />
              <Text style={styles.statValue}>{stats.total_referrals}</Text>
              <Text style={styles.statLabel}>Parrainages</Text>
            </View>
          </View>
        )}

        {/* More Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statRowItem}>
              <Text style={styles.statRowValue}>{stats.total_events}</Text>
              <Text style={styles.statRowLabel}>Événements</Text>
            </View>
            <View style={styles.statRowItem}>
              <Text style={styles.statRowValue}>{stats.total_bookings}</Text>
              <Text style={styles.statRowLabel}>Réservations</Text>
            </View>
            <View style={styles.statRowItem}>
              <Text style={styles.statRowValue}>{stats.total_song_requests}</Text>
              <Text style={styles.statRowLabel}>Requêtes DJ</Text>
            </View>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Users List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Tous les utilisateurs ({users.length})</Text>
        </View>

        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{user.name || 'Sans nom'}</Text>
                {user.role === 'admin' && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}>
                <Text style={styles.userMetaText}>
                  <FontAwesome name="star" size={12} color={theme.colors.primary} /> {user.loyalty_points} coins
                </Text>
                <Text style={styles.userMetaText}>
                  • Inscrit le {formatDate(user.created_at)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity 
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.pageText}>Page {page} / {totalPages}</Text>
            <TouchableOpacity 
              style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: theme.colors.elevated,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.elevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statRowItem: {
    flex: 1,
    alignItems: 'center',
  },
  statRowValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statRowLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 14,
    marginLeft: 10,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  adminBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  userMetaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    color: 'white',
    fontSize: 14,
  },
});
