import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Share,
  ActivityIndicator
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateDailyQRCodes, getTodayQRCodes, DailyQRCode } from '../../services/dailyQR';
import { useThemeContext } from '../../contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const QRGeneratorScreen: React.FC = () => {
  const { theme, colors } = useThemeContext();
  const [todayQRCodes, setTodayQRCodes] = useState<DailyQRCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTodayQRCodes();
  }, []);

  const loadTodayQRCodes = async () => {
    try {
      setIsLoading(true);
      const codes = await getTodayQRCodes();
      setTodayQRCodes(codes);
    } catch (error) {
      console.error('Erreur chargement codes QR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQRCodes = async () => {
    try {
      setIsGenerating(true);
      
      Alert.alert(
        '🔄 Générer les codes QR du jour',
        'Créer de nouveaux codes QR pour aujourd\'hui ?',
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Générer',
            style: 'default',
            onPress: async () => {
              const newCodes = await generateDailyQRCodes();
              if (newCodes) {
                setTodayQRCodes(newCodes);
                Alert.alert(
                  '✅ Succès',
                  'Codes QR générés avec succès !',
                  [
                    {
                      text: 'OK',
                      style: 'default'
                    }
                  ]
                );
              } else {
                Alert.alert(
                  '❌ Erreur',
                  'Impossible de générer les codes QR. Vérifiez votre connexion.',
                  [
                    {
                      text: 'OK',
                      style: 'default'
                    }
                  ]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur génération:', error);
      Alert.alert('❌ Erreur', 'Une erreur est survenue lors de la génération.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareQRCode = async (codeType: 'entry' | 'exit', qrCode: string) => {
    try {
      const message = codeType === 'entry' 
        ? `🚪 Code QR ENTRÉE - ${new Date().toLocaleDateString('fr-FR')}\n\n${qrCode}`
        : `🚶‍♂️ Code QR SORTIE - ${new Date().toLocaleDateString('fr-FR')}\n\n${qrCode}`;
        
      await Share.share({
        message,
        title: `Code QR ${codeType === 'entry' ? 'Entrée' : 'Sortie'}`
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement des codes QR...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          🔄 Générateur de Codes QR
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {formatDate(new Date().toISOString())}
        </Text>
      </View>

      {/* Status */}
      {todayQRCodes ? (
        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statusHeader}>
            <Feather name="check-circle" size={24} color="#4CAF50" />
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>
              Codes QR actifs
            </Text>
          </View>
          <Text style={[styles.statusDetail, { color: colors.textSecondary }]}>
            Générés le {formatDate(todayQRCodes.created_at)} à {formatTime(todayQRCodes.created_at)}
          </Text>
          <Text style={[styles.statusDetail, { color: colors.textSecondary }]}>
            Valides jusqu'à {formatTime(todayQRCodes.valid_until)}
          </Text>
        </View>
      ) : (
        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statusHeader}>
            <Feather name="alert-circle" size={24} color="#FF9800" />
            <Text style={[styles.statusText, { color: '#FF9800' }]}>
              Aucun code QR généré
            </Text>
          </View>
          <Text style={[styles.statusDetail, { color: colors.textSecondary }]}>
            Générez les codes QR pour permettre l'accès des membres
          </Text>
        </View>
      )}

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateButton, { backgroundColor: colors.primary }]}
        onPress={handleGenerateQRCodes}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Feather name="refresh-cw" size={24} color="white" />
            <Text style={styles.generateButtonText}>
              {todayQRCodes ? 'Régénérer les codes QR' : 'Générer les codes QR'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* QR Codes Display */}
      {todayQRCodes && (
        <>
          {/* Entry QR Code */}
          <View style={[styles.qrContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.qrHeader}>
              <View style={styles.qrTitleContainer}>
                <Feather name="log-in" size={24} color="#4CAF50" />
                <Text style={[styles.qrTitle, { color: colors.text }]}>
                  🚪 CODE QR ENTRÉE
                </Text>
              </View>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShareQRCode('entry', todayQRCodes.entry_code)}
              >
                <Feather name="share" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={todayQRCodes.entry_code}
                size={width * 0.6}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            <View style={styles.qrInfo}>
              <Text style={[styles.qrInfoText, { color: colors.textSecondary }]}>
                Les membres scannent ce code pour ENTRER dans la salle
              </Text>
              <Text style={[styles.qrCode, { color: colors.textSecondary }]}>
                {String(todayQRCodes.entry_code)}
              </Text>
            </View>
          </View>

          {/* Exit QR Code */}
          <View style={[styles.qrContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.qrHeader}>
              <View style={styles.qrTitleContainer}>
                <Feather name="log-out" size={24} color="#FF5722" />
                <Text style={[styles.qrTitle, { color: colors.text }]}>
                  🚶‍♂️ CODE QR SORTIE
                </Text>
              </View>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShareQRCode('exit', todayQRCodes.exit_code)}
              >
                <Feather name="share" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={todayQRCodes.exit_code}
                size={width * 0.6}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            <View style={styles.qrInfo}>
              <Text style={[styles.qrInfoText, { color: colors.textSecondary }]}>
                Les membres scannent ce code pour SORTIR de la salle
              </Text>
              <Text style={[styles.qrCode, { color: colors.textSecondary }]}>
                {String(todayQRCodes.exit_code)}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Instructions */}
      <View style={[styles.instructionsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.instructionsTitle, { color: colors.text }]}>
          📝 Instructions d'utilisation
        </Text>
        <View style={styles.instruction}>
          <Text style={[styles.instructionStep, { color: colors.primary }]}>1.</Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Générez les codes QR quotidiens en cliquant sur le bouton
          </Text>
        </View>
        <View style={styles.instruction}>
          <Text style={[styles.instructionStep, { color: colors.primary }]}>2.</Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Affichez ou partagez les codes QR aux emplacements d'entrée/sortie
          </Text>
        </View>
        <View style={styles.instruction}>
          <Text style={[styles.instructionStep, { color: colors.primary }]}>3.</Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Les membres scannent avec leur téléphone pour s'enregistrer
          </Text>
        </View>
        <View style={styles.instruction}>
          <Text style={[styles.instructionStep, { color: colors.primary }]}>4.</Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Les accès sont automatiquement enregistrés dans le système
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
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
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusDetail: {
    fontSize: 14,
    marginLeft: 32,
    marginBottom: 4,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  qrContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  shareButton: {
    padding: 8,
  },
  qrCodeWrapper: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  qrInfo: {
    alignItems: 'center',
    width: '100%',
  },
  qrInfoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  qrCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    paddingHorizontal: 10,
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
  spacer: {
    height: 40,
  },
});

export default QRGeneratorScreen;
