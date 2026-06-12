/**
 * Guard centralise pour toutes les routes /admin.
 * Seuls les utilisateurs avec role 'admin' peuvent acceder a ces ecrans.
 */

import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  // Ne rien rendre pendant le chargement de l'auth
  if (isLoading) {
    return null;
  }

  // Acces reserve aux admins
  if (user?.role !== 'admin') {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Slot />;
}
