import { Slot } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </LanguageProvider>
  );
}
