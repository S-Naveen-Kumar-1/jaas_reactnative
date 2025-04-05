/**
 * @format
 */
import "../Jaas_screenshare_poc/src/jitsi-lib/polyfills/browser"
import "../Jaas_screenshare_poc/src/jitsi-lib/polyfills/custom"
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
