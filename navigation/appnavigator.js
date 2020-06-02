import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';

export default createAppContainer(
    createStackNavigator(
        {
            'Home' : {
                screen: HomeScreen,
                navigationOptions: {
                    title: 'COVID Statement'
                },
            },

            'Camera' : {
                screen: CameraScreen,
                navigationOptions: {
                    headerStyle: {
                        borderBottomWidth: 0,
                        height: 0
                      },
                },
            }
        },
        {
            initialRouteName: 'Home',
        }
    )
);