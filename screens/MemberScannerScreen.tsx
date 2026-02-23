import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import QRScanner from '../components/QRScanner.native';
import {
  memberScanQRCode,
  getMemberAccessHistory,
  QRScanResult
} from '../services/dailyQR';

interface AccessHistoryItem {
  id: string;
  type: 'entry' | 'exit';
  timestamp: string;
  qr_code_scanned: string;
  location: string;
}

const ScannerScreen: React.FC = () => {
  const { colors, isDark } = useThemeContext();
  const [showScanner, setShowScanner] = useState(false);
  const [accessHistory, setAccessHistory] = useState<AccessHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<QRScanResult | null>(null);

  useEffect(() => {
    loadAccessHistory();
  }, []);

  const loadAccessHistory = async () => {
    try {
      setIsLoading(true);
      const history = await getMemberAccessHistory(20);
      setAccessHistory(history);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccessHistory();
    setRefreshing(false);
  };

  const handleQRCodeScanned = async (result: {
    action: 'entry' | 'exit';
    memberName: string;
    message: string;
  }) => {
    try {
      setShowScanner(false);
      
      console.log('✅ Scan réussi:', result);
      
      setLastScanResult({
        success: true,
        action: result.action,
        memberName: result.memberName,
        message: result.message,
        timestamp: new Date().toISOString()
      });
      
      Alert.alert(
        result.action === 'entry' ? '✅ Entrée enregistrée' : '✅ Sortie enregistrée',
        result.message,
        [
          {
            text: 'OK',
            onPress: () => {
                // Rafraîchir l'historique après un scan réussi
                loadAccessHistory();
              }
            }
          ]
        );
    } catch (error) {
      console.error('Erreur scan QR:', error);
      Alert.alert('❌ Erreur', 'Une erreur est survenue lors du scan.');
    }
  };

  const openScanner = () => {
    setShowScanner(true);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentStatus = () => {
    if (accessHistory.length === 0) {
      return { status: 'unknown', message: 'Aucun historique' };
    }
    
    const lastAccess = accessHistory[0];
    if (lastAccess.type === 'entry') {
      return { 
        status: 'inside', 
        message: `À l'intérieur depuis ${formatTime(lastAccess.timestamp)}`,
        color: '#4CAF50'
      };
    } else {
      return { 
        status: 'outside', 
        message: `Sorti(e) à ${formatTime(lastAccess.timestamp)}`,
        color: '#FF5722'
      };
    }
  };

  const status = getCurrentStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            📱 Scanner QR
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Scannez les codes QR générés par l'administration
          </Text>
        </View>

        {/* Current Status */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statusHeader}>
            <Feather 
              name={status.status === 'inside' ? 'user-check' : status.status === 'outside' ? 'user-x' : 'user'} 
              size={24} 
              color={status.color || colors.textSecondary} 
            />
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              Votre statut
            </Text>
          </View>
          <Text style={[styles.statusMessage, { color: status.color || colors.textSecondary }]}>
            {String(status.message || '')}
          </Text>
          {lastScanResult && (
            <Text style={[styles.lastScanInfo, { color: colors.textSecondary }]}>
              Dernier scan: {formatDateTime(lastScanResult.timestamp)}
            </Text>
          )}
        </View>

        {/* Scanner Button */}
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={openScanner}
        >
          <Feather name="camera" size={32} color="white" />
          <Text style={styles.scanButtonText}>
            Scanner un code QR
          </Text>
          <Text style={styles.scanButtonSubtext}>
            Entrée ou sortie
          </Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            📝 Comment utiliser
          </Text>
          <View style={styles.instruction}>
            <Text style={[styles.instructionStep, { color: colors.primary }]}>1.</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Appuyez sur "Scanner un code QR"
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={[styles.instructionStep, { color: colors.primary }]}>2.</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Pointez votre caméra vers le code QR d'entrée ou de sortie
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={[styles.instructionStep, { color: colors.primary }]}>3.</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Votre entrée ou sortie sera automatiquement enregistrée
            </Text>
          </View>
        </View>

        {/* Access History */}
        <View style={[styles.historyCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>
            📜 Historique récent
          </Text>
          
          {accessHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Feather name="clock" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>
                Aucun historique d'accès
              </Text>
              <Text style={[styles.emptyHistorySubtext, { color: colors.textSecondary }]}>
                Vos entrées et sorties apparaîtront ici
              </Text>
            </View>
          ) : (
            accessHistory.slice(0, 10).map((log, index) => (
              <View 
                key={log.id} 
                style={[
                  styles.historyItem,
                  { borderBottomColor: colors.border },
                  index === accessHistory.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.historyIcon}>
                  <Feather 
                    name={log.type === 'entry' ? 'log-in' : 'log-out'} 
                    size={20} 
                    color={log.type === 'entry' ? '#4CAF50' : '#FF5722'} 
                  />
                </View>
                <View style={styles.historyContent}>
                  <Text style={[styles.historyAction, { color: colors.text }]}>
                    {log.type === 'entry' ? 'Entrée' : 'Sortie'}
                  </Text>
                  <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                    {formatDate(log.timestamp)} à {formatTime(log.timestamp)}
                  </Text>
                  {log.location && (
                    <Text style={[styles.historyLocation, { color: colors.textSecondary }]}>
                      📍 {log.location}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          visible={showScanner}
          onScanSuccess={handleQRCodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusMessage: {
    fontSize: 16,
    marginLeft: 32,
    marginBottom: 4,
  },
  lastScanInfo: {
    fontSize: 12,
    marginLeft: 32,
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  scanButtonSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  instructionsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyHistorySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 14,
    marginBottom: 2,
  },
  historyLocation: {
    fontSize: 12,
  },
  spacer: {
    height: 40,
  },
});

export default ScannerScreen;