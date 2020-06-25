import React, { Component } from 'react';
import { AsyncStorage, View } from 'react-native';
import { Button, Text, Overlay } from 'react-native-elements';
import * as Google from 'expo-google-app-auth';
import * as Permissions from 'expo-permissions';
import { STORAGE_KEYS, VIDEO_STATUS, GOOGLE_AUTH_SCOPES, GOOGLE_TOKEN_URL } from '../constants';
import { annotateVideo, getAnnotationResults } from '../googlecloud';
import Environment from '../config/environment';
import { Video } from 'expo-av';
import _ from 'lodash';
import * as Device from 'expo-device';
import { makeApiRequest } from '../api';
import statement from '../statement';
import { AppLoading } from 'expo';
import { NavigationEvents } from 'react-navigation';

export default class HomeScreen extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
          googleLoginResult: null,
          token: null,
          videoInfo: null,
          hasPermission: false,
          showResults: false,
          isUploading: false,
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
    
      renderRecordVideoButton() {
        const personName = _.get(this.state, 'googleLoginResult.user.name');
        return (
          <Button
            buttonStyle={{ height: 70 }}
            disabled={this.state.isUploading}
            title="Record Video"
            onPress={() => this.props.navigation.navigate('Camera', { personName, statement })}
          />
        );
      }

      renderTokenView() {
        return (
          <View style={{ flex: 1 }}>
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

      renderUploading() {
        return (
          <View style={{ flex: 1 }}>
            <Text>Processing video...</Text>
          </View>
        );
      }
    
      render() {
        return (
          <View style={{ flex: 1 }}>
            <NavigationEvents onWillFocus={() => this.setStateFromRouteParams()} />
            {
              this.state.isUploading ? this.renderUploading() : this.state.showResults ? this.renderResults() : this.renderTokenView() 
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

      setStateFromRouteParams() {
        console.log(`HomeScreen - setStateFromProps: ${JSON.stringify(this.props.route.params)}`);
        if (this.props.route.params) {
          this.setState({ isUploading: this.props.route.params.isUploading });
        }
      }
}