import React, { useEffect, useRef, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
} from 'react-native'
import { Button } from '../components/Button'
import { Colors, Spacing, FontSize, FontWeight } from '../constants/Colors'

const { width, height } = Dimensions.get('window')

const BACKGROUND_IMAGES = [
    require('../assets/gym-bg.jpg'),
    { uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop' },
    { uri: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop' },
    { uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop' },
]

export default function WelcomeScreen({ navigation }: any) {
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= BACKGROUND_IMAGES.length) {
                nextIndex = 0;
            }
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        }, 4000);

        return () => clearInterval(timer);
    }, [currentIndex]);

    return (
        <View style={styles.container}>
            {/* Background Image Carousel */}
            <FlatList
                ref={flatListRef}
                data={BACKGROUND_IMAGES}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false} // Disable manual scrolling if you want purely auto-scroll
                renderItem={({ item }) => (
                    <Image
                        source={item}
                        style={[styles.backgroundImage, { width, height }]}
                        resizeMode="cover"
                    />
                )}
            />

            {/* Content Overlay */}
            <View style={styles.overlay}>
                {/* Header - Logo */}
                <View style={styles.header}>
                    <Text style={styles.logoText}>GYM MANAGER</Text>
                </View>

                {/* Bottom Content */}
                <View style={styles.bottomContent}>
                    <Text style={styles.heroText}>Dépassez vos limites.</Text>
                    <Text style={styles.subHeroText}>
                        Rejoignez la salle de sport connectée et suivez vos progrès en temps réel.
                    </Text>

                    {/* Pagination Dots */}
                    <View style={styles.pagination}>
                        {BACKGROUND_IMAGES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    currentIndex === index && styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button
                            title="S'INSCRIRE GRATUITEMENT"
                            onPress={() => navigation.navigate('Register')}
                            fullWidth
                            style={styles.registerButton}
                            textStyle={styles.registerButtonText}
                        />

                        <Button
                            title="SE CONNECTER"
                            onPress={() => navigation.navigate('Login')}
                            variant="outline"
                            fullWidth
                            style={styles.loginButton}
                            textStyle={styles.loginButtonText}
                        />
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    backgroundImage: {
        opacity: 0.8,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 14, 39, 0.5)', // Effet assombri très léger pour lire le texte
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: 80,
        paddingBottom: 50,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    // logo 
    logoText: {
        fontSize: FontSize.xl,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    bottomContent: {
        width: '100%',
        alignItems: 'center',
    },
    heroText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    subHeroText: {
        fontSize: FontSize.md,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
        paddingHorizontal: Spacing.md,
    },
    pagination: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    activeDot: {
        backgroundColor: '#FFFFFF',
    },
    buttonContainer: {
        width: '100%',
        gap: Spacing.md,
    },
    registerButton: {
        height: 54,
        borderRadius: 27, // Forme très arrondie comme Spotify
        backgroundColor: '#06D6A0', // Un vert "Spotify-like" ou on peut utiliser le primary
        borderWidth: 0,
    },
    registerButtonText: {
        fontWeight: 'bold',
        fontSize: FontSize.md,
        color: '#000000', // Texte noir sur le vert clair pour le contraste
        letterSpacing: 1,
    },
    loginButton: {
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Légèrement visible
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    loginButtonText: {
        fontWeight: 'bold',
        fontSize: FontSize.md,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
})
