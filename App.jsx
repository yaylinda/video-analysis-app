import React, { Component } from 'react';
import { AsyncStorage, View } from 'react-native';
import { Button, Text, Overlay } from 'react-native-elements';
import { RNCamera } from 'react-native-camera';
import { STORAGE_KEYS } from './util/constants';
import styles from './styles';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      token: null,
      openCamera: false,
      isRecording: false,
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

  toggleCamera() {
    console.log(`toggleCamera - this.state.openCamera: ${this.state.openCamera}`);
    this.setState({ openCamera: !this.state.openCamera });
  }

  stopRecording() {
    console.log(`stopRecording - this.state.isRecording: ${this.state.isRecording}`);
    this.setState({ openCamera: !this.state.isRecording });
  }

  startRecording() {
    console.log(`startRecording - this.state.isRecording: ${this.state.isRecording}`);
    this.setState({ openCamera: !this.state.isRecording });
  }

  renderCameraView() {
    return(
      <View>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onGoogleVisionBarcodesDetected={({ barcodes }) => {
            console.log(barcodes);
          }}
        />
        <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
          {
            this.state.isRecording 
              ? <Button title="STOP"  onPress={() => this.stopRecording()}/>
              : <Button title="START" onPress={() => this.startRecording()}/>
          }
        </View>
      </View>
    );
  }

  componentDidMount() {
    this.getTokenFromStorage();
  }

  render() {
    return (
      <View style={styles.container}>
        {
          this.state.token 
            ? <Token token={this.state.token}/> 
            : <Text>Please upload a new video to obtain a token</Text>
        }

        { this.state.openCamera ? this.renderCameraView() : null }

        <Button 
          title="New Video"
          onPress={() => this.toggleCamera()}
        />
      </View>
    );
  } 
}
