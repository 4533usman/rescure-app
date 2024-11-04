
import React, { useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import StackNavigation from './src/navigation/StackNavigation';
const App = () => {
    const [isLoading, setIsLoading] = useState(true);

    const handleFinishLoading = () => {
        setIsLoading(false);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {isLoading ? (
                <SplashScreen onFinish={handleFinishLoading} />
            ) : (
                <StackNavigation />
            )}
        </SafeAreaView>
    );
};

export default App;
