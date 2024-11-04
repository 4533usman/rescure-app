import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ScrollView, Dimensions, ToastAndroid, ImageBackground, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Markdown from 'react-native-markdown-display';
import OpenAI from 'openai';
import { stringify } from './../../node_modules/css-what/lib/es/stringify';
import { Video } from 'expo-av';

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
    const [videoGenerating, setVideoGenerating] = useState(false);
    const [videoUri, setVideoUri] = useState(null);
    const [vedioPrompt, setVedioPrompt] = useState<any>('')

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


    const handleSend = async () => {
        if (!prompt && encodeImages.length === 0) {
            ToastAndroid.showWithGravity('Please enter a prompt or attach an image.', ToastAndroid.SHORT, ToastAndroid.CENTER);
            return;
        }

        setLoading(true);

        try {
            const systemPrompt = `You are a helpful AI agent specializing in first aid guidance. When given images of accident scenes, generate clear, step-by-step first aid instructions. If only a text prompt is provided, offer general guidance relevant to the accident scenario. Always create a separate prompt for video demonstration of the first aid steps, regardless of whether images are provided.`;

            // const systemPrompt = `yor are an ai Assistant`;
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
                            text: `${imageTags}${prompt}`
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
            // try {
            //     const data = response.choices[0].message.content.split("Video Demonstration Prompt")[1].trim().replace(/"/g, '').replace(/,/g, '');
            //     setVedioPrompt(data)
            //     main(data)
            //     console.log('data', data);
            // } catch (error) {
            //     console.error("JSON Parse error:", error.message);
            // }
            // main(response.choices[0].message.content)
            setAiResponse(prev => [
                ...prev,
                {
                    promptSend: prompt,
                    responseBack: response.choices[0].message.content,
                    uris: images
                }
            ]);
            // main();
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

    // Function to generate a video
    async function generateVideo(token, d) {
        const url = "https://api.rhymes.ai/v1/generateVideoSyn";
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
        console.log("vedioPrompt", d);
        const data = {
            "refined_prompt": `analyze these steps and create vedio ${d}`,
            "num_step": 100,
            "cfg_scale": 7.5,
            "user_prompt": `analyze these steps and create vedio ${d}`,
            "rand_seed": 12345
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data)
            });

            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();  // Return the JSON response
            return responseData;
        } catch (error) {
            console.error("An error occurred:", error.message);
            return null;  // Handle error appropriately
        }
    }

    // Function to query the video status
    // async function queryVideoStatus(token, requestId) {
    //     const url = `https://api.rhymes.ai/v1/videoQuery?requestId=${requestId}`;
    //     const headers = {
    //         "Authorization": `Bearer ${token}`
    //     };

    //     try {
    //         const response = await fetch(url, {
    //             method: "GET",
    //             headers: headers
    //         });

    //         // Check if the request was successful
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }

    //         const statusData = await response.json();  // Return the JSON response
    //         return statusData;
    //     } catch (error) {
    //         console.error("An error occurred:", error.message);
    //         return null;  // Handle error appropriately
    //     }
    // }
    async function queryVideoStatus(token, requestId) {
        console.log(requestId)
        const url = `https://api.rhymes.ai/v1/videoQuery?requestId=${requestId}`;
        const headers = {
            "Authorization": `Bearer ${token}`
        };

        const maxWaitTime = 600000; // 3 minutes in milliseconds
        const checkInterval = 30000; // 30 seconds
        let elapsed = 0;

        while (elapsed < maxWaitTime) {
            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const statusData = await response.json();

                // Check if the video URL is available within the data key
                if (statusData.data) {  // Adjust this if the structure is different
                    return statusData;  // Return the video URL once it's available
                }

                // Wait for the interval before checking again
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                elapsed += checkInterval;

            } catch (error) {
                console.error("An error occurred:", error.message);
                return null;  // Handle error appropriately if needed
            }
        }

        // If the loop exits without finding the video URL, log a timeout and return null
        console.error("Request timed out after 3 minutes without a video URL.");
        return null;
    }

    // Example usage

    async function main(data) {
        console.log("ddd", data)
        setVideoGenerating(true);  // Show loading indicator for video generation
        const bearerToken = API_KEY;
        const responseData = await generateVideo(bearerToken, data);

        if (responseData) {
            const requestId = responseData.data;
            const statusData = await queryVideoStatus(bearerToken, requestId);
            console.log("statusData" , statusData)
            if (statusData && statusData.data) {
                console.log("sdfsd",statusData)
                setVideoUri(statusData.data);  // Assuming video URL is available
            } else {
                ToastAndroid.showWithGravity('Failed to fetch video URL.', ToastAndroid.SHORT, ToastAndroid.CENTER);
            }
        } else {
            ToastAndroid.showWithGravity('Failed to start video generation.', ToastAndroid.SHORT, ToastAndroid.CENTER);
        }
        setVideoGenerating(false);
    }

    // Call the main function





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
                            <View key={index} style={styles.chatMessage}>
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

                                {!videoUri && (
                                    <TouchableOpacity
                                        style={styles.generateButton}
                                        onPress={() => {
                                            const params = `Please generate a video solely focused on demonstrating the following first aid steps in a clear, step-by-step manner. Do not include any content or visuals unrelated to these instructions. Only depict actions, gestures, and environments necessary for accurately following these specific steps:${r?.responseBack}Ensure that the generated video strictly adheres to these instructions without any additional or unrelated content.`

                                            main(params)
                                        }}
                                        disabled={videoGenerating}
                                    >
                                        {videoGenerating ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.generateButtonText}>Generate Video</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {videoUri && (
                            <View style={styles.videoContainer}>
                                <Text style={styles.videoTitle}>Video:</Text>
                                <Video
                                    source={{ uri: videoUri }}
                                    rate={1.0}
                                    volume={1.0}
                                    isMuted={false}
                                    // resizeMode="cover"
                                    shouldPlay
                                    isLooping
                                    style={styles.video}
                                />
                            </View>
                        )}
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

export default ChatScreen;

// Style adjustments (optional)
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
    chatMessage: {
        marginBottom: 10,
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
    generateButton: {
        backgroundColor: '#ff4500',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    generateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    videoContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    video: {
        width: width - 20,
        height: height * 0.4,
        borderRadius: 10,
    },
});