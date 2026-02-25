import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';

export default function FreeEntryScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    userName?: string;
  } | null>(null);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!scanning || processing) return;
    
    setScanning(false);
    setProcessing(true);
    
    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      
      if (qrData.type !== 'free_entry') {
        setLastResult({
          success: false,
          message: 'QR code invalide. Ce n\'est pas une entrée gratuite.'
        });
        return;
      }
      
      // Validate the voucher
      const response = await api.post('/admin/free-entry/validate', {
        voucher_id: qrData.voucher_id
      });
      
      setLastResult({
        success: true,
        message: response.data.message,
        userName: response.data.user_name
      });
      
    } catch (error: any) {
      console.error('Validation error:', error);
      setLastResult({
        success: false,
        message: error.response?.data?.detail || 'Erreur lors de la validation'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualValidation = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code');
      return;
    }
    
    setProcessing(true);
    
    try {
      const response = await api.post('/admin/free-entry/validate', {
        voucher_id: manualCode.trim()
      });
      
      setLastResult({
        success: true,
        message: response.data.message,
        userName: response.data.user_name
      });
      setShowManualInput(false);
      setManualCode('');
      
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Code invalide');
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setLastResult(null);
    setScanning(true);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={theme.colors.textMuted} />
          <Text style={styles.permissionText}>
            Autorisation caméra requise pour scanner les QR codes
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner Entrée Gratuite</Text>
        <TouchableOpacity onPress={() => setShowManualInput(true)} style={styles.manualButton}>
          <Ionicons name="keypad" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {lastResult ? (
          <View style={[
            styles.resultContainer,
            lastResult.success ? styles.resultSuccess : styles.resultError
          ]}>
            <Ionicons 
              name={lastResult.success ? "checkmark-circle" : "close-circle"} 
              size={80} 
              color={lastResult.success ? theme.colors.success : theme.colors.error} 
            />
            <Text style={styles.resultTitle}>
              {lastResult.success ? 'Entrée Validée!' : 'Erreur'}
            </Text>
            {lastResult.userName && (
              <Text style={styles.resultName}>{lastResult.userName}</Text>
            )}
            <Text style={styles.resultMessage}>{lastResult.message}</Text>
            
            <TouchableOpacity style={styles.scanAgainButton} onPress={resetScanner}>
              <Ionicons name="scan" size={24} color="white" />
              <Text style={styles.scanAgainText}>Scanner un autre code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            
            {/* Overlay */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                {processing && (
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                )}
              </View>
              <Text style={styles.scanInstructions}>
                Place le QR code d'entrée gratuite dans le cadre
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Manual Input Modal */}
      <Modal visible={showManualInput} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saisie Manuelle</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Entre le code du voucher manuellement
            </Text>
            
            <TextInput
              style={styles.manualInput}
              placeholder="ID du voucher"
              placeholderTextColor={theme.colors.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="none"
            />
            
            <TouchableOpacity 
              style={styles.validateButton}
              onPress={handleManualValidation}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.validateButtonText}>Valider</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  manualButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  permissionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanInstructions: {
    color: 'white',
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  resultSuccess: {
    backgroundColor: `${theme.colors.success}20`,
  },
  resultError: {
    backgroundColor: `${theme.colors.error}20`,
  },
  resultTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  resultName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  resultMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  scanAgainText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  manualInput: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  validateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  validateButtonText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
