import React, { Component } from 'react';
import { AsyncStorage, View } from 'react-native';
import { Button, Text, Overlay } from 'react-native-elements';
import { Camera } from 'expo-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import { STORAGE_KEYS } from './util/constants';
import styles from './styles';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      token: null,
      hasPermission: false,
      showCamera: false,
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

  async getCameraPermissions() {
    const { status } = await Camera.requestPermissionsAsync();
    this.setState({ hasPermission: status === 'granted' });
    console.log(`getCameraPermissions - this.state.hasPermission: ${this.state.hasPermission}`);
  }

  toggleCamera() {
    
    this.setState({ showCamera: !this.state.showCamera });
    console.log(`toggleCamera - this.state.showCamera: ${this.state.showCamera}`);
  }

  toggleRecording() {
    this.setState({ isRecording: !this.state.isRecording });
    console.log(`startRecording - this.state.isRecording: ${this.state.isRecording}`);
  }

  renderCameraView() {
    return(
      <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={Camera.Constants.Type.front}>

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
              onPress={() => this.toggleRecording()}
            /> :
            <Button 
              title="Start Recording"
              buttonStyle={{ backgroundColor: 'green' }}
              icon={<Icon name="play" size={15} color="white" />}
              onPress={() => this.toggleRecording()}
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
            <Text>Please upload a new video to obtain a token</Text>
        }
        <Button 
          title="New Video"
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
    this.getCameraPermissions();
  }
}
