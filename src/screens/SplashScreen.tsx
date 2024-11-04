import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ImageBackground, Image } from 'react-native';
import * as Progress from 'react-native-progress';

const SplashScreen = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start the fade-in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
        }).start();

        // Simulate progress loading
        const interval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 1, 100)); // Increment progress
        }, 30); // Adjust the interval duration as needed

        // Cleanup the interval on unmount
        return () => clearInterval(interval);
    }, [fadeAnim]);

    // Trigger onFinish when progress reaches 100
    useEffect(() => {
        if (progress >= 100) {
            onFinish();
        }
    }, [progress, onFinish]);

    return (
        <ImageBackground
            source={require('../images/sp1.jpg')} // Add your image path here
            style={styles.background}
        >
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
                {/* Uncomment and update the line below to include a logo */}
                {/* <Image source={require('../assets/icon.png')} style={styles.logo} /> */}
                {/* <Text style={styles.appName}>My App</Text> */}
            </Animated.View>
            <View style={styles.progressContainer}>
                <Progress.Bar 
                    progress={progress / 100} 
                    width={200} 
                    color="white" // Customize color as needed
                    unfilledColor="#D3D3D3" 
                    borderWidth={0}
                    animationType="spring"
                />
                <Text style={styles.loaderText}>{`Loading ${progress}%`}</Text>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF', // Adjust color for better contrast with background
        marginTop: 10,
    },
    progressContainer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    loaderText: {
        fontSize: 18,
        color: '#FFFFFF', // Adjust color for better contrast with background
        marginTop: 10,
        fontWeight: 'bold',
    },
});

export default SplashScreen;
