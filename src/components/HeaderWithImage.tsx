import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const HeaderWithImage = ({ title }) => {
    return (
        <View style={styles.headerContainer}>
            <Image
                source={require('../images/lg.jpg')} // Update this with the path to your image
                style={styles.logo}
            />
            <Text style={styles.headerTitle}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 30,
        height: 30,
        marginRight: 10,
        borderRadius: 360
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color:'white'
    },
});

export default HeaderWithImage;