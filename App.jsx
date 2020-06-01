import React, { Component } from 'react';
import { AsyncStorage, View } from 'react-native';
import { Avatar, Button, Text, Header, Overlay } from 'react-native-elements';
import { Camera } from 'expo-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Google from 'expo-google-app-auth';
import * as Permissions from 'expo-permissions';
import { STORAGE_KEYS, VIDEO_STATUS, GOOGLE_AUTH_SCOPES } from './constants';
import { annotateVideo, getAnnotationResults } from './googlecloud';
import Environment from './config/environment';
import { Video } from 'expo-av';
import _ from 'lodash';
import * as Device from 'expo-device';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      googleLoginResult: null,
      token: null,
      videoInfo: null,
      hasPermission: false,
      showCamera: false,
      showOverlay: false,
      isRecording: false,
      cameraData: null,
      isUploading: false,
      showResults: false,
    }
  }

  async doGoogleLogin() {
    let googleLoginResult = await AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_LOGIN_RESULT);

    if (googleLoginResult) {
      // TODO - also check to see that googleLoginResult has not expired
      console.log(`doGoogleLogin - already have googleLoginResult: ${googleLoginResult}`);
      googleLoginResult = JSON.parse(googleLoginResult);
    } else {
      console.log(`doGoogleLogin - starting google login process`);

      googleLoginResult = await Google.logInAsync({
        androidClientId: Environment['ANDROID_CLIENT_ID'],
        iosClientId: Environment['IOS_CLIENT_ID'],
        scopes: GOOGLE_AUTH_SCOPES,
      });

      console.log(`doGoogleLogin - got result from login: ${JSON.stringify(googleLoginResult)}`);

      await AsyncStorage.setItem(STORAGE_KEYS.GOOGLE_LOGIN_RESULT, JSON.stringify(googleLoginResult));
    }

    this.setState({ googleLoginResult });
  }

  async getTokenFromStorage() {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

    if (token) {
      console.log('found existing token');
      this.setState({ token });
    } else {
      console.log('did not find existing token');
    }
  }

  async getVideoInfoFromStorage() {
    let videoInfo = await AsyncStorage.getItem(STORAGE_KEYS.VIDEO_INFO);
    videoInfo = JSON.parse(videoInfo);

    if (videoInfo) {
      // TODO - check that video has not expired
      console.log(`found existing videoInfo: ${JSON.stringify(videoInfo)}`);
      this.setState({ videoInfo });

      if (videoInfo.annotationResults && videoInfo.annotationResults.transcript) {
        this.setState({ showResults: true });
      }
    } else {
      console.log('did not find existing videoInfo');
    }
  }

  async checkPermissions() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA, Permissions.AUDIO_RECORDING, Permissions.CAMERA_ROLL);
    this.setState({ hasPermission: status === 'granted' });
    console.log(`getPermissions - this.state.hasPermission: ${this.state.hasPermission}`);
  }

  toggleCamera() {
    this.setState({ showCamera: !this.state.showCamera, showResults: false });
    console.log(`toggleCamera - this.state.showCamera: ${this.state.showCamera}`);
  }

  stopRecording() {
    this.setState({ isRecording: false });
    console.log(`stopRecording - this.state.isRecording: ${this.state.isRecording}`);
    console.log('stopRecording - calling camera.stopRecording');
    this.camera.stopRecording();
    console.log(`stopRecording - this.state.cameraData: ${JSON.stringify(this.state.cameraData)}`);
    this.setState({ showCamera: false, showOverlay: true });
  }

  startRecording() {
    this.setState({ isRecording: true });
    console.log(`startRecording - this.state.isRecording: ${this.state.isRecording}`);
    console.log('startRecording - calling recordAsync');
    if (this.camera) {
      this.camera.recordAsync().then((data) => this.setState({ cameraData: data }));
    }
    console.log('startRecording - called async recordAsync');
  }

  toggleOverlay() {
    console.log('toggleOverlay');
    this.setState({ showOverlay: false });
  }

  async uploadAndAnnotateVideo() {
    this.setState({ isUploading: true });

    // Refresh Google Auth Token before upload
    const refreshResponse = await makeApiRequest(
      GOOGLE_TOKEN_URL, 
      'POST', 
      { 
        'Content-Type' : 'application/x-www-form-urlencoded',
      }, 
      {
        client_id: Device.osName === 'Android' ? Environment['ANDROID_CLIENT_ID'] : Environment['IOS_CLIENT_ID'],
        refresh_token: this.state.googleLoginResult.refreshToken,
        grant_type: 'refresh_token',
      }
    );

    // TODO - get new access token from refresh response

    console.log(`uploadAndAnnotateVideo - ${this.state.cameraData.uri}`);

    const videoInfo = {
      localUri: this.state.cameraData.uri,
      annotationStatus: VIDEO_STATUS.NOT_STARTED,
      annotationResults: null,
    }

    console.log(`uploadAndAnnotateVideo - videoInfo: ${JSON.stringify(videoInfo)}`);

    await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_INFO, JSON.stringify(videoInfo));

    console.log('uploadAndAnnotateVideo - finitshed setting videoInfo in AsyncStorage');

    const result = await annotateVideo(videoInfo.localUri, this.state.googleLoginResult.accessToken);

    console.log(`uploadAndAnnotateVideo - annotation result: ${JSON.stringify(result)}`);

    const transcription = await getAnnotationResults(result.name, this.state.googleLoginResult.accessToken);

    console.log(`uploadAndAnnotateVideo - transcription: ${JSON.stringify(transcription)}`);

    videoInfo['annotationStatus'] = VIDEO_STATUS.SUCCESS;
    videoInfo['annotationResults'] = transcription;
    await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_INFO, JSON.stringify(videoInfo));

    this.setState({ isUploading: false, showResults: true, videoInfo });
  }

  renderRecordVideoButton() {
    return (
      <Button
        buttonStyle={{ height: 70 }}
        disabled={this.state.isUploading}
        title="Record Video"
        onPress={() => this.toggleCamera()}
      />
    );
  }

  renderUploadVideoButton() {
    return (
      <Button
        title="Upload Video"
        disabled={this.state.cameraData === null || this.state.isUploading}
        onPress={() => this.uploadAndAnnotateVideo()}
      />
    );
  }

  renderCameraView() {
    return (
      <View style={{ flex: 1 }}>
        <Camera
          ref={ref => {
            this.camera = ref;
          }}
          style={{ flex: 1 }}
          type={Camera.Constants.Type.front}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              flexDirection: 'row',
            }}>
          </View>
          {
            this.state.isRecording ?
              <Button
                title="Stop Recording"
                buttonStyle={{ backgroundColor: 'red', height: 70 }}
                icon={<Icon name="stop" size={15} color="white" />}
                onPress={() => this.stopRecording()}
              /> :
              <Button
                title="Start Recording"
                buttonStyle={{ backgroundColor: 'green', height: 70 }}
                icon={<Icon name="play" size={15} color="white" />}
                onPress={() => this.startRecording()}
              />
          }
        </Camera>
      </View>
    );
  }

  renderTokenView() {
    return (
      <View style={{ flex: 1 }}>
        {this.renderHeader()}
        <View style={{ flex: 1, padding: 20 }}>
          <View style={{ flex: 1, backgroundColor: 'light-grey' }}>
            {
              this.state.token ?
                <Text>Token: {this.state.token}</Text> :
                this.state.isUploading ?
                  <Text>Uploading...</Text> :
                  <Text>Please record and upload a video to obtain a token</Text>
            }
          </View>
        </View>
        {
          this.renderRecordVideoButton()
        }
      </View>
    );
  }

  renderResults() {
    return (
      <View style={{ flex: 1 }}>
        {this.renderHeader()}
        <View style={{ flex: 1, padding: 20 }}>
          <View style={{ flex: 1, backgroundColor: 'light-grey' }}>
            <Text>You said:</Text>
            <Text>{this.state.videoInfo.annotationResults.transcript}</Text>
          </View>
        </View>
        {
          this.renderRecordVideoButton()
        }
      </View>
    );
  }

  renderHeader() {
    let avatarUrl = null;
    if (this.state.googleLoginResult && this.state.googleLoginResult.type === 'success' && this.state.googleLoginResult.user) {
      avatarUrl = this.state.googleLoginResult.user.photoUrl;
    }

    return (
      <Header
        placement="left"
        leftComponent={{ icon: 'menu', color: '#fff' }}
        centerComponent={{ text: 'COVID Statement', style: { color: '#fff' } }}
        rightComponent={<Avatar rounded source={{ uri: `${avatarUrl}` }} />}
      />);
  }

  render() {
    const videoUri = _.get(this.state, 'videoInfo.localUri', null);
    return (
      <View style={{ flex: 1 }}>
        {
          this.state.showResults ?
            this.renderResults() :
            this.state.showCamera ?
              this.renderCameraView() :
              this.renderTokenView()
        }
        {
          <Overlay isVisible={this.state.showOverlay} onBackdropPress={this.toggleOverlay.bind(this)}>
            <View>
              <Text>Confirm Upload for Processing</Text>
              {videoUri ? <Video source={{ uri: `${videoUri}` }} style={{ width: 300, height: 300 }} /> : null}
              {this.renderUploadVideoButton()}
            </View>
          </Overlay>
        }
      </View>
    );
  }

  componentDidMount() {
    this.doGoogleLogin();
    this.getTokenFromStorage();
    this.getVideoInfoFromStorage();
    this.checkPermissions();
  }
}
