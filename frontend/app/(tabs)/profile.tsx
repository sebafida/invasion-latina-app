import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color={theme.colors.primary} />
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        
        <View style={styles.pointsCard}>
          <Ionicons name="trophy" size={24} color={theme.colors.secondary} />
          <Text style={styles.points}>{user?.loyalty_points || 0} Points</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <MenuItem icon="ticket" title="My Tickets" onPress={() => {}} />
        <MenuItem icon="cart" title="Order History" onPress={() => {}} />
        <MenuItem icon="settings" title="Settings" onPress={() => {}} />
        <MenuItem icon="help-circle" title="Help & Support" onPress={() => {}} />
      </View>

      <View style={styles.footer}>
        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="outline"
          fullWidth
        />
      </View>
    </View>
  );
}

const MenuItem = ({ icon, title, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={theme.colors.textPrimary} />
    <Text style={styles.menuText}>{title}</Text>
    <Ionicons name="chevron-forward" size={24} color={theme.colors.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevated,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  name: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  points: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  menu: {
    flex: 1,
    paddingTop: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevated,
  },
  menuText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.elevated,
  },
});