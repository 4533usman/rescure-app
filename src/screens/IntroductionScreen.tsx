import React, { useState } from 'react';
import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity } from 'react-native';
import PagerView from 'react-native-pager-view';

const { width: screenWidth } = Dimensions.get('window');

const slides = [
  {
    title: "Witnessing an Accident",
    description: "In a busy street, an accident occurs. A passerby captures the moment, ready to assist the injured.",
    image: require('../images/slide1.webp'), // replace with your image path
  },
  {
    title: "Uploading the Photo",
    description: "The bystander opens the Accident Assistant app, uploads the photo of the injured person, and submits it for analysis.",
    image: require('../images/slide3.webp'), // replace with your image path
  },
  {
    title: "Analyzing the Image",
    description: "The AI processes the image to provide instant guidance for first aid treatment based on the injuries detected.",
    image: require('../images/slide2.webp'), // replace with your image path
  },
  {
    title: "Receiving Treatment Guidance",
    description: "Within moments, the app displays vital first aid instructions and video demonstrations for proper care.",
    image: require('../images/slide2.webp'), // replace with your image path
  },
];

const IntroductionScreen = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleStart = () => {
    navigation.navigate('ChatScreen')
  };

  return (
    <View style={styles.container}>
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
      >
        {slides.map((slide, index) => (
          <View style={styles.slide} key={index}>
            <Image source={slide.image} style={{ ...styles.image, height: screenWidth *0.8 , width: screenWidth * 0.8 }} />
            <Text style={styles.textTitle}>{slide.title}</Text>
            <Text style={styles.textDescription}>{slide.description}</Text>
          </View>
        ))}
      </PagerView>

      {/* Indicator */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              { opacity: index === activeIndex ? 1 : 0.3 },
            ]}
          />
        ))}
      </View>

      {/* "Let's Start" Button on Last Page */}
      {activeIndex === slides.length - 1 && (
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Let's Start</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default IntroductionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    justifyContent: 'center',
  },
  pagerView: {
    flex: 1,
    width: screenWidth,
    padding : 20
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 20,
    backgroundColor: '#f3f3f3',
  },
  image: {
    resizeMode: 'contain',
    marginBottom: 20,
   
  },
  textTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color:'#ff0000'
  },
  textDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    paddingHorizontal: 40
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff0000',
    marginHorizontal: 5,
  },
  startButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#ff0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
