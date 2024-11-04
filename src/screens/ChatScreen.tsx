import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ScrollView, Dimensions, ToastAndroid, ImageBackground } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Markdown from 'react-native-markdown-display';
import OpenAI from 'openai';

const API_KEY = "93ed253bc7234ec9804c2cdcd6facbcc";
const { width, height } = Dimensions.get('window');
const client = new OpenAI({
    baseURL: 'https://api.rhymes.ai/v1',
    apiKey: API_KEY
});

const ChatScreen = () => {
    const [prompt, setPrompt] = useState('');
    const [images, setImages] = useState([]);
    const [aiResponse, setAiResponse] = useState([]);
    const [loading, setLoading] = useState(false);
    const [encodeImages, setEncodeImages] = useState([]);
    const scrollViewRef = useRef(null);

    const handleAttachImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            alert('Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true });
        if (!result.canceled) {
            const selectedImages = result.assets.map(asset => asset.uri);
            const base64Images = await Promise.all(selectedImages.map(async uri => {
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                return `data:image/jpeg;base64,${base64}`;
            }));
            setEncodeImages(prevImages => [...prevImages, ...base64Images]);
            setImages(prevImages => [...prevImages, ...selectedImages]);
            ToastAndroid.showWithGravity('Images Uploaded', ToastAndroid.SHORT, ToastAndroid.CENTER);
        }
    };

    const handleCaptureImage = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            alert('Permission to access the camera is required!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync();
        if (!result.canceled) {
            const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            setEncodeImages(prev => [...prev, `data:image/jpeg;base64,${base64}`]);
            setImages(prevImages => [...prevImages, result.assets[0].uri]);
            ToastAndroid.showWithGravity('Image Captured', ToastAndroid.SHORT, ToastAndroid.CENTER);
        }
    };
   
        const parseResponse = (response) => {
            try {
                // Check if the response is in a JSON-like string format
                const responseObject = JSON.parse(response);
                
                if (responseObject.instructions && responseObject.video_prompt) {
                    // Extract instructions and video prompt
                    const instructionsPart = responseObject.instructions.trim();
                    const videoPromptPart = responseObject.video_prompt.trim();
        
                    console.log("Instructions:", instructionsPart);
                    console.log("Video Prompt:", videoPromptPart);
        
                    return { instructions: instructionsPart, video_prompt: videoPromptPart };
                }
                
                return { error: "Expected format not found in the response." };
            } catch (error) {
                return { error: `Failed to parse response: ${error.message}` };
            }
        };
        
    const handleSend = async () => {
        if (!prompt && encodeImages.length === 0) {
            ToastAndroid.showWithGravity('Please enter a prompt or attach an image.', ToastAndroid.SHORT, ToastAndroid.CENTER);
            return;
        }

        setLoading(true);

        try {
            const systemPrompt = `You are a helpful AI agent specializing in first aid guidance. When given images of accident scenes, generate clear, step-by-step first aid instructions. If only a text prompt is provided, offer general guidance relevant to the accident scenario. Always create a separate prompt for video demonstration of the first aid steps, regardless of whether images are provided.`;

            const messages: any = [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ];

            if (encodeImages.length && images) {
                console.log(encodeImages.length);
                const imageContents = encodeImages.map(encode => {
                    return {
                        type: "image_url",
                        image_url: {
                            url: `${encode}`
                        }
                    }
                })
                const imageTags = "<image>".repeat(images.length);

                messages.push({
                    role: "user",
                    content: [
                        ...imageContents,
                        {
                            type: "text",
                            text: `${imageTags} ${prompt}`
                        }
                    ]
                });
            }
            console.log(messages)
            const response = await client.chat.completions.create({
                model: "aria",
                messages: messages,
                stop: ["<|im_end|>"],
                stream: false,
                temperature: 0.6,
                max_tokens: 1024,
                top_p: 1
            });
            console.log(response.choices[0].message.content)

            const re = parseResponse(response.choices[0].message.content);
            console.log("lll", re)
            setAiResponse(prev => [...prev, { promptSend: prompt, responseBack: response.choices[0].message.content }]);
            setPrompt('');
            setImages([]);
            setEncodeImages([]);

        } catch (error) {
            ToastAndroid.showWithGravity(`Error: ${error.message}`, ToastAndroid.LONG, ToastAndroid.CENTER);
            console.error('Error details:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };





    const delImageHandler = (uri) => {
        setImages(images.filter(image => image !== uri));
        setEncodeImages(encodeImages.filter(image => image !== uri));
        ToastAndroid.showWithGravity('Image Deleted', ToastAndroid.SHORT, ToastAndroid.CENTER);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={80}
        >
            <View style={styles.chatContainer}>
                <ImageBackground
                    source={require('../images/sp1.jpg')}
                    style={styles.banner}
                    resizeMode="cover"
                >
                    <View style={styles.overlay}>
                        <Text style={styles.bannerText}>
                            Rescue – Be the Help, Until Help Arrives!
                        </Text>
                    </View>
                </ImageBackground>

                {loading ? (
                    <View style={styles.chatScroll}>
                        <Text>Generating Response------</Text>
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        style={styles.chatScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        {aiResponse.map((r, index) => (
                            <View key={index}>
                                <View>
                                    <MaterialIcons name="supervised-user-circle" size={24} color="#0d0c32" />
                                    <Text style={styles.chatText}>You: {r?.promptSend}</Text>
                                    {r.uris && r.uris.map((uri, idx) => (
                                        <Image key={idx} source={{ uri }} style={styles.attachedImage} />
                                    ))}
                                </View>
                                <MaterialCommunityIcons name="robot-outline" size={24} color="#0d0c32" />
                                <Markdown>
                                    {r?.responseBack}
                                </Markdown>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageContainer}>
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.attachedImage} />
                                <TouchableOpacity style={styles.delButton} onPress={() => delImageHandler(uri)}>
                                    <MaterialIcons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}

                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleAttachImage}>
                        <MaterialIcons name="attach-file" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton} onPress={handleCaptureImage}>
                        <MaterialIcons name="camera-alt" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={prompt}
                        onChangeText={setPrompt}
                    />

                    <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
                        <MaterialIcons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};


export default ChatScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    chatContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    chatScroll: {
        flex: 1,
        paddingHorizontal: 10,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        backgroundColor: 'white',
    },
    banner: {
        width: '100%',
        height: height * 0.25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerText: {
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    attachedImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        margin: 5,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    imageWrapper: {
        position: 'relative',
    },
    delButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        borderRadius: 15,
        padding: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#ff0000',
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: '#ff0000',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        marginHorizontal: 5,
        backgroundColor: '#fff',
    },
    iconButton: {
        padding: 5,
    },
    chatText: {
        fontSize: 16,
        marginVertical: 4,
        backgroundColor: 'lightgrey',
        padding: 10,
        borderRadius: 10,
    },
})