import React, { Component } from 'react';
import { AsyncStorage, View } from 'react-native';
import { Button, Text, Header } from 'react-native-elements';
import { Camera } from 'expo-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import { STORAGE_KEYS, VIDEO_STATUS } from './constants';
import { uploadVideo, annotateVideo, getAnnotationResults } from './googlecloud';
import statement from './statement.js';
import styles from './styles';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      token: null,
      videoInfo: null,
      hasPermission: false,
      showCamera: false,
      isRecording: false,
      cameraData: null,
      isUploading: false,
      showResults: false,
    }
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
    const videoInfo = await AsyncStorage.getItem(STORAGE_KEYS.VIDEO_INFO);

    if (videoInfo) {
      console.log(`found existing videoInfo: ${JSON.stringify(videoInfo)}`);
      this.setState({ videoInfo });
    } else {
      console.log('did not find existing videoInfo');
    }
  }

  async getCameraPermissions() {
    const { status } = await Camera.requestPermissionsAsync();
    this.setState({ hasPermission: status === 'granted' });
    console.log(`getCameraPermissions - this.state.hasPermission: ${this.state.hasPermission}`);
  }

  toggleCamera() {
    this.setState({ showCamera: !this.state.showCamera });
    console.log(`toggleCamera - this.state.showCamera: ${this.state.showCamera}`);
  }

  stopRecording() {
    this.setState({ isRecording: false });
    console.log(`stopRecording - this.state.isRecording: ${this.state.isRecording}`);
    console.log('stopRecording - calling camera.stopRecording');
    this.camera.stopRecording();
    console.log(`stopRecording - this.state.cameraData: ${JSON.stringify(this.state.cameraData)}`);
    this.setState({ showCamera: false });
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

  async uploadAndAnnotateVideo() {
    this.setState({ isUploading: true });

    console.log(`uploadAndAnnotateVideo - ${this.state.cameraData.uri}`);

    const videoInfo = {
      localUri: this.state.cameraData.uri,
      createdTime: new Date().toString(),
      uploadStatus: VIDEO_STATUS.IN_PROGRESS,
      uploadedTime: null,
      cloudStorageUri: null,
      annotationStatus: VIDEO_STATUS.NOT_STARTED,
      annotationResults: null,
    }

    console.log(`uploadAndAnnotateVideo - videoInfo: ${JSON.stringify(videoInfo)}`);

    await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_INFO, JSON.stringify(videoInfo));

    console.log('uploadAndAnnotateVideo - finitshed setting videoInfo in AsyncStorage');

    // TODO - handle error with try-catch
    const cloudStorageUri = await uploadVideo(videoInfo.localUri);

    console.log(`uploadAndAnnotateVideo - finished upload cloudStorageUri: ${cloudStorageUri}`);

    videoInfo['cloudStorageUri'] = cloudStorageUri;
    videoInfo['uploadStatus'] = VIDEO_STATUS.SUCCESS;
    videoInfo['uploadedTime'] = new Date().toString();
    videoInfo['annotationStatus'] = VIDEO_STATUS.IN_PROGRESS;
    await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_INFO, JSON.stringify(videoInfo));

    console.log(`uploadAndAnnotateVideo - videoInfo: ${JSON.stringify(videoInfo)}`);

    const result = await annotateVideo(cloudStorageUri);

    console.log(`uploadAndAnnotateVideo - annotation result: ${JSON.stringify(result)}`);

    const transcription = await getAnnotationResults(result.name);

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
          this.renderUploadVideoButton()
        }
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
        <Text>You said:</Text>
        <Text>{this.state.videoInfo.annotationResults.transcript}</Text>
        {
          this.renderUploadVideoButton()
        }
        {
          this.renderRecordVideoButton()
        }
      </View>
    );
  }

  renderHeader() {
    return (
      <Header
        placement="left"
        leftComponent={{ icon: 'menu', color: '#fff' }}
        centerComponent={{ text: 'COVID Statement', style: { color: '#fff' } }}
      />);
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {
          this.state.showResults ?
            this.renderResults() :
            this.state.showCamera ?
              this.renderCameraView() :
              this.renderTokenView()
        }
      </View>
    );
  }

  componentDidMount() {
    this.getTokenFromStorage();
    this.getVideoInfoFromStorage();
    this.getCameraPermissions();
  }
}
