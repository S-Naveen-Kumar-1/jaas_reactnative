/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React from 'react';

import JitsiConference from './src/jitsi-lib/JitsiConference';
import { TracksProvider } from './src/jitsi-lib/JitsiContext';

function App(): React.JSX.Element {
  return (
    <TracksProvider>
      <JitsiConference />
    </TracksProvider>
  );
}


export default App;
