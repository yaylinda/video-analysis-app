import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View } from "react-native";
import { Camera } from 'expo-camera';
import { Button, Text, Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../constants';

export default class CameraScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isRecording: false,
            cameraData: null,
            showOverlay: false,
        }
    }

    componentDidMount() {

    }

    stopRecording() {
        this.setState({ isRecording: false });
        console.log(`stopRecording - this.state.isRecording: ${this.state.isRecording}`);
        console.log('stopRecording - calling camera.stopRecording');
        this.camera.stopRecording();
        console.log(`stopRecording - this.state.cameraData: ${JSON.stringify(this.state.cameraData)}`);
        this.setState({ showOverlay: true });
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

    render() {
        return (
            <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 10, paddingTop: 0, paddingBottom: 10 }}>
                    <View style={{ padding: 10 }}>
                    <Text h4>
                        Please record yourself reading the following statement:
                        </Text>
                        </View>
                    <View style={{ padding: 10, backgroundColor: COLORS.LIGHT_GRAY, borderRadius: 10 }}>
                        <Text>
                            My name is {this.props.route.params.personName}.
                            </Text>
                        <Text>
                            I am unaware of having any symptoms related to the coronavirus.
                            </Text>
                        <Text>
                            I am unaware of having interacted with anyone who has any symptoms of the coronavirus.
                        </Text>
                    </View>
                </View>
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
            </View>
        );
    }
}