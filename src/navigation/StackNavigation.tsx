import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IntroductionScreen from '../screens/IntroductionScreen';
import HeaderWithImage from '../components/HeaderWithImage';
import ChatScreen from '../screens/ChatScreen';
const StackNavigation = () => {

    const Stack = createNativeStackNavigator();


    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Introduction">
                <Stack.Screen
                    name="Introduction"
                    component={IntroductionScreen}
                    options={
                        {
                            headerTitle: () => <HeaderWithImage title="Rescure" />,
                            headerTitleAlign: "center",
                            headerStyle: {
                                backgroundColor: '#ff0000', // Set the background color of the header
                            },
                        }
                    }
                />
                {/* <Stack.Screen
                    name="Home"
                    component={Home}
                    options={
                        {
                            headerTitle: () => <HeaderWithImage title="ConfigPilot" />,
                            headerTitleAlign: "center"
                        }
                    }
                /> */}
                <Stack.Screen
                    name="ChatScreen"
                    component={ChatScreen}
                    options={
                        {
                            headerTitle: () => <HeaderWithImage title="Rescure" />,
                            headerTitleAlign: "center",
                            headerStyle: {
                                backgroundColor: '#ff0000', // Set the background color of the header
                            },
                            headerTintColor: '#FFFFFF',
                        }
                    }
                />
            </Stack.Navigator>

        </NavigationContainer>
    )
}

export default StackNavigation