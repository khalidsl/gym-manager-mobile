import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, ImageBackground } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Colors, Spacing, FontSize, FontWeight } from '../constants/Colors'
import { useAccessStore } from '../store/accessStore'

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [scanType, setScanType] = useState<'entry' | 'exit'>('entry')
  const { validateAndLogEntry, validateAndLogExit, loading } = useAccessStore()

  if (!permission) {
    return <View style={styles.container} />
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Card style={styles.permissionCard}>
          <Text style={styles.permissionText}>
            Nous avons besoin de votre permission pour utiliser la caméra
          </Text>
          <Button
            title="Autoriser la caméra"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </Card>
      </View>
    )
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return
    
    setScanned(true)

    try {
      const result = scanType === 'entry'
        ? await validateAndLogEntry(data)
        : await validateAndLogExit(data)

      Alert.alert(
        result.success ? 'Succès' : 'Erreur',
        result.message,
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      )
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue',
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      )
    }
  }

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.15 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
      <View style={styles.typeSelector}>
        <Button
          title="Entrée"
          onPress={() => setScanType('entry')}
          variant={scanType === 'entry' ? 'primary' : 'outline'}
          style={styles.typeButton}
        />
        <Button
          title="Sortie"
          onPress={() => setScanType('exit')}
          variant={scanType === 'exit' ? 'primary' : 'outline'}
          style={styles.typeButton}
        />
      </View>

      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.instructionText}>
            {scanType === 'entry' 
              ? 'Scannez votre QR code pour entrer'
              : 'Scannez votre QR code pour sortir'}
          </Text>
        </View>
      </CameraView>

      {scanned && (
        <View style={styles.resetContainer}>
          <Button
            title="Scanner à nouveau"
            onPress={() => setScanned(false)}
            variant="secondary"
          />
        </View>
      )}
    </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  permissionCard: {
    margin: Spacing.lg,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  permissionButton: {
    width: '100%',
  },
  typeSelector: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xl,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  resetContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.background,
  },
})
