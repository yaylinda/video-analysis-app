import React, { Component } from 'react';
import { AsyncStorage, View } from "react-native";
import { Button, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Device from 'expo-device';
import { makeApiRequest } from '../api';
import { annotateVideo, getAnnotationResults } from '../googlecloud';
import { STORAGE_KEYS, VIDEO_STATUS, GOOGLE_AUTH_SCOPES, GOOGLE_TOKEN_URL } from '../constants';


export default class ReviewScreen extends Component {

    constructor(props) {
        super(props);

    }

    async uploadAndAnnotateVideo() {
        this.setState({ isUploading: true });

        const refreshResponse = await this.refreshAccessToken();

        const videoInfo = {
            localUri: this.state.cameraData.uri,
            annotationStatus: VIDEO_STATUS.NOT_STARTED,
            annotationResults: null,
        }

        await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_INFO, JSON.stringify(videoInfo));

        const result = await annotateVideo(videoInfo.localUri, refreshResponse['access_token']);

        const transcription = await getAnnotationResults(result.name, refreshResponse['access_token']);

        videoInfo['annotationStatus'] = VIDEO_STATUS.SUCCESS;
        videoInfo['annotationResults'] = transcription;
        await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_INFO, JSON.stringify(videoInfo));

        // TODO - Send event
    }

    async refreshAccessToken() {
        const headers = { "Content-Type": "application/x-www-form-urlencoded" };

        const urlencoded = new URLSearchParams();
        urlencoded.append("client_id", Device.osName === 'Android' ? Environment['ANDROID_CLIENT_ID'] : Environment['IOS_CLIENT_ID']);
        urlencoded.append("refresh_token", _.get(this.state, 'googleLoginResult.refreshToken', null));
        urlencoded.append("grant_type", "refresh_token");

        const refreshResponse = await makeApiRequest(
            GOOGLE_TOKEN_URL,
            'POST',
            headers,
            urlencoded.toString()
        );

        return refreshResponse;
    }

    confirmUpload() {
        // Call Google asynchronously
        this.uploadAndAnnotateVideo();
        this.props.navigation.navigate('Home', { isUploading: true });
    }

    render() {
        return (
            <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 10, paddingTop: 0, paddingBottom: 10 }}>
                    <View style={{ padding: 10 }}>
                        <Text h4>Please review and confirm the video for processing:</Text>
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    <Video source={{ uri: `${this.props.route.params.videoUri}` }} />
                </View>
                <View style={{ flex: 1 }}>
                    <Button
                        title="Confirm Upload"
                        buttonStyle={{ backgroundColor: 'green', height: 70 }}
                        icon={<Icon name="upload" size={15} color="white" />}
                        onPress={() => this.confirmUpload()}
                    />
                </View>
            </View>
        );
    }
}