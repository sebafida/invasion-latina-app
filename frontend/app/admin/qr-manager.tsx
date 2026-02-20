import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Share,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';

const { width } = Dimensions.get('window');

interface EventQR {
  id: string;
  event_id: string;
  event_name: string;
  qr_code: string;
  points_value: number;
  is_active: boolean;
  scans_count: number;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
}

export default function QRCodeManagerScreen() {
  const router = useRouter();
  const [activeQR, setActiveQR] = useState<EventQR | null>(null);
  const [qrHistory, setQrHistory] = useState<EventQR[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [pointsValue, setPointsValue] = useState(5);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load active QR
      const activeResponse = await api.get('/admin/event-qr/active');
      setActiveQR(activeResponse.data.active_qr);
      
      // Load QR history
      const historyResponse = await api.get('/admin/event-qr/history');
      setQrHistory(historyResponse.data.qr_codes);
      
      // Load events for selection
      const eventsResponse = await api.get('/events');
      setEvents(eventsResponse.data.map((e: any) => ({ id: e.id, name: e.name })));
      
    } catch (error) {
      console.error('Error loading QR data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewQR = async () => {
    if (!selectedEvent) {
      Alert.alert('Erreur', 'Sélectionnez un événement');
      return;
    }
    
    try {
      setIsCreating(true);
      
      const response = await api.post('/admin/event-qr/create', {
        event_id: selectedEvent,
        points_value: pointsValue,
      });
      
      Alert.alert('Succès', response.data.message);
      setShowCreateModal(false);
      setSelectedEvent('');
      setPointsValue(5);
      loadData();
      
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleQR = async (qrId: string) => {
    try {
      const response = await api.put(`/admin/event-qr/${qrId}/toggle`);
      Alert.alert('Succès', response.data.message);
      loadData();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur');
    }
  };

  const shareQR = async () => {
    if (!activeQR) return;
    
    try {
      await Share.share({
        message: `QR Code pour ${activeQR.event_name}\n\nCode: ${activeQR.qr_code}\n\nLes participants scannent ce code pour gagner ${activeQR.points_value} Invasion Coins !`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <Text style={styles.headerTitle}>Gestion QR Codes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active QR Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code Actif</Text>
          
          {activeQR ? (
            <View style={styles.activeQRCard}>
              <View style={styles.activeQRHeader}>
                <View style={styles.activeIndicator}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>ACTIF</Text>
                </View>
                <TouchableOpacity onPress={() => toggleQR(activeQR.id)}>
                  <Text style={styles.deactivateText}>Désactiver</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.eventName}>{activeQR.event_name}</Text>
              
              {/* QR Code Display */}
              <TouchableOpacity 
                style={styles.qrCodeBox}
                onPress={() => setShowQRModal(true)}
              >
                <View style={styles.qrPlaceholder}>
                  <FontAwesome name="qrcode" size={120} color={theme.colors.primary} />
                </View>
                <Text style={styles.qrCodeText}>{activeQR.qr_code}</Text>
                <Text style={styles.tapToEnlarge}>Appuyez pour agrandir</Text>
              </TouchableOpacity>
              
              <View style={styles.qrStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{activeQR.points_value}</Text>
                  <Text style={styles.statLabel}>Coins / scan</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{activeQR.scans_count}</Text>
                  <Text style={styles.statLabel}>Scans</Text>
                </View>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.shareButton} onPress={shareQR}>
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.shareButtonText}>Partager</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={() => setShowQRModal(true)}
                >
                  <Ionicons name="expand-outline" size={20} color="white" />
                  <Text style={styles.fullscreenButtonText}>Plein écran</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noActiveQR}>
              <FontAwesome name="qrcode" size={50} color={theme.colors.textMuted} />
              <Text style={styles.noActiveText}>Aucun QR code actif</Text>
              <Text style={styles.noActiveSubtext}>
                Créez un QR code pour la prochaine soirée
              </Text>
            </View>
          )}
          
          {/* Create New Button */}
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.createButtonText}>
              {activeQR ? 'Créer nouveau QR Code' : 'Créer QR Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          
          {qrHistory.length === 0 ? (
            <Text style={styles.emptyHistory}>Aucun historique</Text>
          ) : (
            qrHistory.map((qr) => (
              <View key={qr.id} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyEvent}>{qr.event_name}</Text>
                  <Text style={styles.historyDate}>{formatDate(qr.created_at)}</Text>
                  <Text style={styles.historyStats}>
                    {qr.scans_count} scans • {qr.points_value} coins/scan
                  </Text>
                </View>
                <View style={styles.historyStatus}>
                  {qr.is_active ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Actif</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.reactivateButton}
                      onPress={() => toggleQR(qr.id)}
                    >
                      <Text style={styles.reactivateText}>Réactiver</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau QR Code</Text>
            
            <Text style={styles.inputLabel}>Événement</Text>
            <ScrollView style={styles.eventList} horizontal={false}>
              {events.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventOption,
                    selectedEvent === event.id && styles.eventOptionSelected,
                  ]}
                  onPress={() => setSelectedEvent(event.id)}
                >
                  <Text style={[
                    styles.eventOptionText,
                    selectedEvent === event.id && styles.eventOptionTextSelected,
                  ]}>
                    {event.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.inputLabel}>Invasion Coins par scan</Text>
            <View style={styles.pointsSelector}>
              {[3, 5, 10, 15, 20].map((points) => (
                <TouchableOpacity
                  key={points}
                  style={[
                    styles.pointsOption,
                    pointsValue === points && styles.pointsOptionSelected,
                  ]}
                  onPress={() => setPointsValue(points)}
                >
                  <Text style={[
                    styles.pointsOptionText,
                    pointsValue === points && styles.pointsOptionTextSelected,
                  ]}>
                    {points}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={createNewQR}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen QR Modal */}
      <Modal
        visible={showQRModal}
        animationType="fade"
        transparent={false}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity 
            style={styles.closeFullscreen}
            onPress={() => setShowQRModal(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          {activeQR && (
            <View style={styles.fullscreenContent}>
              <Text style={styles.fullscreenTitle}>{activeQR.event_name}</Text>
              <View style={styles.fullscreenQR}>
                <FontAwesome name="qrcode" size={width * 0.7} color={theme.colors.primary} />
              </View>
              <Text style={styles.fullscreenCode}>{activeQR.qr_code}</Text>
              <Text style={styles.fullscreenInstructions}>
                Scannez ce code pour gagner {activeQR.points_value} Invasion Coins !
              </Text>
            </View>
          )}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  activeQRCard: {
    backgroundColor: theme.colors.elevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  activeQRHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  activeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deactivateText: {
    color: '#F44336',
    fontSize: 14,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  qrCodeBox: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  qrPlaceholder: {
    marginBottom: 10,
  },
  qrCodeText: {
    fontSize: 14,
    color: theme.colors.black,
    fontFamily: 'monospace',
  },
  tapToEnlarge: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  qrStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  fullscreenButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.textMuted,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  fullscreenButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noActiveQR: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.colors.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.textMuted,
    borderStyle: 'dashed',
  },
  noActiveText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
  },
  noActiveSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHistory: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.elevated,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyEvent: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  historyDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  historyStats: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  historyStatus: {
    marginLeft: 12,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  reactivateButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reactivateText: {
    color: theme.colors.primary,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.elevated,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  eventList: {
    maxHeight: 150,
  },
  eventOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.black,
    marginBottom: 8,
  },
  eventOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  eventOptionText: {
    color: 'white',
    fontSize: 14,
  },
  eventOptionTextSelected: {
    fontWeight: 'bold',
  },
  pointsSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pointsOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.black,
  },
  pointsOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  pointsOptionText: {
    color: 'white',
    fontSize: 16,
  },
  pointsOptionTextSelected: {
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.textMuted,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullscreen: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  fullscreenContent: {
    alignItems: 'center',
    padding: 20,
  },
  fullscreenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  fullscreenQR: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    marginBottom: 30,
  },
  fullscreenCode: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  fullscreenInstructions: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
});
