import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  generateDailyQRCodes,
  getTodayQRCodes,
  memberScanQRCode,
  DailyQRCode
} from '../services/dailyQR';

/**
 * 🧪 COMPOSANT DE TEST SYSTÈME QR
 * Pour tester rapidement la génération et le scan des codes QR
 * À utiliser pendant le développement uniquement
 */
const QRSystemTester: React.FC = () => {
  const [codes, setCodes] = useState<DailyQRCode | null>(null);
  const [testQRCode, setTestQRCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toLocaleTimeString('fr-FR')}: ${message}`, ...prev.slice(0, 9)]);
  };

  const handleGenerateQRCodes = async () => {
    try {
      setLoading(true);
      addLog('🔄 Génération des codes QR...');
      
      const newCodes = await generateDailyQRCodes();
      if (newCodes) {
        setCodes(newCodes);
        addLog('✅ Codes QR générés avec succès');
        Alert.alert('✅ Succès', 'Codes QR générés !');
      } else {
        addLog('❌ Échec génération codes QR');
        Alert.alert('❌ Erreur', 'Impossible de générer les codes QR');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error}`);
      console.error('Erreur génération:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTodayQRCodes = async () => {
    try {
      setLoading(true);
      addLog('📦 Chargement des codes QR du jour...');
      
      const todayCodes = await getTodayQRCodes();
      if (todayCodes) {
        setCodes(todayCodes);
        addLog('✅ Codes QR du jour chargés');
        
        // Auto-remplir le champ de test avec le code d'entrée
        setTestQRCode(todayCodes.entry_code);
      } else {
        addLog('⚠️ Aucun code QR pour aujourd\'hui');
        Alert.alert('⚠️ Info', 'Aucun code QR généré pour aujourd\'hui. Générez-en d\'abord !');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error}`);
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestScan = async () => {
    if (!testQRCode.trim()) {
      Alert.alert('⚠️ Attention', 'Entrez un code QR à tester');
      return;
    }

    try {
      setLoading(true);
      addLog(`🔍 Test scan: ${testQRCode.substring(0, 20)}...`);
      
      const result = await memberScanQRCode(testQRCode);
      
      if (result.success) {
        addLog(`✅ ${result.action}: ${result.message}`);
        Alert.alert(
          '✅ Scan réussi',
          `Action: ${result.action}\nMembre: ${result.memberName}\nMessage: ${result.message}`
        );
      } else {
        addLog(`❌ Échec scan: ${result.message}`);
        Alert.alert('❌ Échec scan', result.message);
      }
    } catch (error) {
      addLog(`❌ Erreur scan: ${error}`);
      console.error('Erreur scan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseEntryCode = () => {
    if (codes?.entry_code) {
      setTestQRCode(codes.entry_code);
      addLog('📝 Code ENTRÉE sélectionné pour test');
    }
  };

  const handleUseExitCode = () => {
    if (codes?.exit_code) {
      setTestQRCode(codes.exit_code);
      addLog('📝 Code SORTIE sélectionné pour test');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Test Système QR</Text>
        <Text style={styles.subtitle}>
          Composant de test pour développement
        </Text>
      </View>

      {/* Actions Admin */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍💼 Actions Admin</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleGenerateQRCodes}
          disabled={loading}
        >
          <Feather name="plus-circle" size={20} color="white" />
          <Text style={styles.buttonText}>
            {loading ? 'Génération...' : 'Générer codes QR du jour'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleLoadTodayQRCodes}
          disabled={loading}
        >
          <Feather name="download" size={20} color="#2196F3" />
          <Text style={[styles.buttonText, { color: '#2196F3' }]}>
            {loading ? 'Chargement...' : 'Charger codes du jour'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Affichage codes */}
      {codes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Codes QR générés</Text>
          
          <View style={styles.codeCard}>
            <Text style={styles.codeTitle}>🚪 Code ENTRÉE</Text>
            <Text style={styles.codeText} numberOfLines={1}>
              {String(codes.entry_code)}
            </Text>
            <TouchableOpacity
              style={[styles.smallButton, styles.successButton]}
              onPress={handleUseEntryCode}
            >
              <Text style={styles.smallButtonText}>Utiliser pour test</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.codeCard}>
            <Text style={styles.codeTitle}>🚶‍♂️ Code SORTIE</Text>
            <Text style={styles.codeText} numberOfLines={1}>
              {String(codes.exit_code)}
            </Text>
            <TouchableOpacity
              style={[styles.smallButton, styles.warningButton]}
              onPress={handleUseExitCode}
            >
              <Text style={styles.smallButtonText}>Utiliser pour test</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.codeInfo}>
            📅 Date: {codes.date} | ⏰ Valide jusqu'à: {new Date(codes.valid_until).toLocaleTimeString('fr-FR')}
          </Text>
        </View>
      )}

      {/* Test Scan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Test Scan Membre</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Code QR à tester..."
          value={testQRCode}
          onChangeText={setTestQRCode}
          multiline={true}
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestScan}
          disabled={loading || !testQRCode.trim()}
        >
          <Feather name="camera" size={20} color="white" />
          <Text style={styles.buttonText}>
            {loading ? 'Scan en cours...' : 'Tester le scan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logs */}
      <View style={styles.section}>
        <View style={styles.logsHeader}>
          <Text style={styles.sectionTitle}>📝 Logs</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
            <Feather name="trash-2" size={16} color="#FF5722" />
            <Text style={styles.clearButtonText}>Effacer</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logsContainer}>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>Aucun log pour le moment...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logItem}>
                {log}
              </Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  testButton: {
    backgroundColor: '#FF9800',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  warningButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    fontFamily: 'monospace',
  },
  codeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  codeInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  clearButtonText: {
    color: '#FF5722',
    fontSize: 14,
    marginLeft: 4,
  },
  logsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  noLogs: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logItem: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 4,
    lineHeight: 16,
  },
  spacer: {
    height: 40,
  },
});

export default QRSystemTester;