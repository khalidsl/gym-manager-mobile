import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Vibration,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { scanQRCode } from '../services/access';
import { memberScanQRCode } from '../services/dailyQR';

const COLORS = {
  primary: '#FF6B35',
  success: '#06D6A0',
  warning: '#FFD23F',
  danger: '#EF476F',
  background: '#0A0E27',
  surface: '#1A1F3A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C1EC',
};

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess?: (result: {
    action: 'entry' | 'exit';
    memberName: string;
    message: string;
  }) => void;
}

export default function QRScanner({ visible, onClose, onScanSuccess }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setProcessing(false);
      startScanAnimation();
    }
  }, [visible]);

  const startScanAnimation = () => {
    scanAnimation.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);

    try {
      console.log('🔍 Code QR scanné:', data);
      
      let result: any;
      
      // Détecter le type de code QR
      if (data.startsWith('GYM_ENTRY') || data.startsWith('GYM_EXIT')) {
        // Code QR quotidien généré par l'admin
        console.log('🎯 Code QR quotidien détecté');
        result = await memberScanQRCode(data);
      } else {
        // Code QR personnel d'un membre
        console.log('🎯 Code QR membre détecté');
        result = await scanQRCode(data);
      }
      
      if (result.success && result.memberName) {
        // Succès - faire vibrer le téléphone
        Vibration.vibrate([0, 200, 100, 200]);
        
        // Callback de succès avec action déterminée
        onScanSuccess?.({
          action: result.action || 'entry',
          memberName: result.memberName,
          message: result.message
        });
        
        // Afficher un message de succès
        Alert.alert(
          '✅ Accès Autorisé',
          result.message,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        // Échec - vibration d'erreur
        Vibration.vibrate([0, 100, 50, 100, 50, 100]);
        
        Alert.alert(
          '⛔ Accès Refusé',
          result.message,
          [
            { text: 'Réessayer', onPress: () => setScanned(false) },
            { text: 'Fermer', onPress: onClose },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur lors du scan:', error);
      Vibration.vibrate([0, 500]);
      
      Alert.alert(
        '❌ Erreur',
        'Erreur technique lors du scan. Veuillez réessayer.',
        [
          { text: 'Réessayer', onPress: () => setScanned(false) },
          { text: 'Fermer', onPress: onClose },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
          <View style={styles.centerContent}>
            <MaterialIcons name="camera-alt" size={64} color={COLORS.textSecondary} />
            <Text style={styles.permissionTitle}>Permission Caméra Requise</Text>
            <Text style={styles.permissionText}>
              L'accès à la caméra est nécessaire pour scanner les codes QR
            </Text>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>
    );
  }

  const scanLinePosition = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250],
  });

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <BlurView intensity={80} tint="dark" style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scanner Code QR</Text>
            <View style={styles.placeholder} />
          </BlurView>

          {/* Scanner Area */}
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              {/* Coins du cadre */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Ligne de scan animée */}
              {!scanned && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{ translateY: scanLinePosition }],
                    },
                  ]}
                />
              )}
            </View>
          </View>

          {/* Instructions */}
          <BlurView intensity={80} tint="dark" style={styles.instructions}>
            <MaterialIcons 
              name={processing ? "hourglass-empty" : "qr-code-scanner"} 
              size={32} 
              color={processing ? COLORS.warning : COLORS.primary} 
            />
            <Text style={styles.instructionText}>
              {processing 
                ? 'Traitement en cours...' 
                : 'Placez le code QR dans le cadre'
              }
            </Text>
            <Text style={styles.instructionSubtext}>
              {processing 
                ? 'Vérification de l\'accès membre'
                : 'Le scan se fera automatiquement'
              }
            </Text>
          </BlurView>

          {/* Reset Button */}
          {scanned && !processing && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setScanned(false)}
            >
              <LinearGradient
                colors={[COLORS.primary, '#F77F00']}
                style={styles.resetGradient}
              >
                <MaterialIcons name="refresh" size={24} color="#fff" />
                <Text style={styles.resetText}>Scanner à nouveau</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  instructions: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resetButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  resetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});