import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import { COLORS } from './constants';

const Stack = createStackNavigator();

export default class App extends Component {

  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{
              title: 'My COVID Statement',
              headerStyle: {
                backgroundColor: COLORS.MAIN_BLUE,
              },
              headerTintColor: COLORS.WHITE,
            }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
            options={{
              title: 'Record Video',
              headerStyle: {
                backgroundColor: COLORS.MAIN_BLUE,
              },
              headerTintColor: COLORS.WHITE,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}
