import React, { Component } from 'react';
import { AsyncStorage, View } from 'react-native';
import { Button, Text, Overlay } from 'react-native-elements';
import { Camera } from 'expo-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import { STORAGE_KEYS, VIDEO_STATUS } from './constants';
import { uploadVideo, annotateVideo } from './googlecloud';
import styles from './styles';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      token: null,
      hasPermission: false,
      showCamera: false,
      isRecording: false,
      lastRecordedVideoData: null,
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
    console.log(`stopRecording - this.state.lastRecordedVideoData: ${JSON.stringify(this.state.lastRecordedVideoData)}`);
    this.setState({ showCamera : false });
  }

  startRecording() {
    this.setState({ isRecording: true });
    console.log(`startRecording - this.state.isRecording: ${this.state.isRecording}`);
    console.log('startRecording - calling recordAsync');
    if (this.camera) {
      this.camera.recordAsync().then((data) => this.setState({ lastRecordedVideoData: data }));
    } 
    console.log('startRecording - called async recordAsync');
  }

  async uploadAndAnnotateVideo() {
    console.log(`uploadAndAnnotateVideo - ${this.state.lastRecordedVideoData.uri}`);

    const video_upload_info = {
      localUri: this.state.lastRecordedVideoData.uri,
      createdTime: new Date().toString(),
      uploadStatus: VIDEO_STATUS.IN_PROGRESS,
      uploadedTime: null,
      cloudStorageUri: null,
      annotationStatus: VIDEO_STATUS.NOT_STARTED,
    }
    
    console.log(`uploadAndAnnotateVideo - video_upload_info: ${JSON.stringify(video_upload_info)}`);

    await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_INFO, JSON.stringify(video_upload_info));

    console.log('uploadAndAnnotateVideo - finitshed setting video_upload_info in AsyncStorage');

    // TODO - handle error with try-catch
    const cloudStorageUri = await uploadVideo(video_upload_info.localUri);

    console.log(`uploadAndAnnotateVideo - finished upload cloudStorageUri: ${cloudStorageUri}`);

    video_upload_info['cloudStorageUri'] = cloudStorageUri;
    video_upload_info['uploadStatus'] = VIDEO_UPLOAD_STATUS.SUCCESS;
    video_upload_info['uploadedTime'] = new Date().toString();
    video_upload_info['annotationStatus'] = VIDEO_STATUS.IN_PROGRESS;
    await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_INFO, JSON.stringify(video_upload_info));

    console.log(`uploadAndAnnotateVideo - video_upload_info: ${JSON.stringify(video_upload_info)}`);

    const annotation = annotateVideo(cloudStorageUri);

    console.log(`uploadAndAnnotateVideo - finished annotation: ${JSON.stringify(annotation)}`);
  }

  renderCameraView() {
    return(
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
              buttonStyle={{ backgroundColor: 'red' }}
              icon={<Icon name="stop" size={15} color="white" />}
              onPress={() => this.stopRecording()}
            /> :
            <Button 
              title="Start Recording"
              buttonStyle={{ backgroundColor: 'green' }}
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
      <View style={styles.container}>
        {
          this.state.token ? 
            <Token token={this.state.token}/> : 
            <Text>Please record and upload a video to obtain a token</Text>
        }
        {
          <Text>
            {this.state.lastRecordedVideoData ? this.state.lastRecordedVideoData.uri : 'No video uri'}
          </Text>
        }
        <Button
          title="Upload Video"
          disabled={this.state.lastRecordedVideoData === null}
          onPress={() => this.uploadAndAnnotateVideo()}
        />
        <Button 
          title="Record Video"
          onPress={() => this.toggleCamera()}
        />
      </View>
    )
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {
          this.state.showCamera ? 
            this.renderCameraView() :
            this.renderTokenView()
        }
      </View>
    );
  }

  componentDidMount() {
    this.getTokenFromStorage();
    // TODO - get video info from storage
    this.getCameraPermissions();
  }
}
