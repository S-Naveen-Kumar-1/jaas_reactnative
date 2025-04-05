import React, {useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import {useTracks} from './JitsiContext';
import JitsiMeetJS from 'lib-jitsi-meet';

const {width} = Dimensions.get('window');

const JitsiConference = () => {
  const {
    localVideoTrack,
    localAudioTrack,
    remoteTracks,
    screenShareTrack,
    joinMeeting,
    conference,
    setScreenShareTrack,
    setLocalAudioTrack,
    setLocalVideoTrack,
    isConnected,
  } = useTracks();

  useEffect(() => {
    if (JitsiMeetJS) {
      JitsiMeetJS.init({disableAudioLevels: false});
      console.log('JitsiMeetJS initialized');
      createLocalTracks();
    } else {
      console.error('JitsiMeetJS is not loaded.');
    }
  }, []);

  const createLocalTracks = async () => {
    if (localAudioTrack && localVideoTrack) return;

    try {
      const tracks = await JitsiMeetJS.createLocalTracks({
        devices: ['audio', 'video'],
        resolution: 720,
      });

      tracks.forEach(track => {
        if (track.getType() === 'audio') setLocalAudioTrack(track);
        else if (track.getType() === 'video') setLocalVideoTrack(track);
      });

      console.log('Local tracks created:', tracks);
    } catch (error) {
      console.error('Error creating local tracks:', error);
    }
  };

  const renderRTCView = (track, key, mirror = false) => {
    try {
      const stream = track?.getOriginalStream?.();
      if (!stream) return null;

      return (
        <RTCView
          key={key}
          streamURL={stream.toURL()}
          style={styles.video}
          objectFit="cover"
          mirror={mirror}
        />
      );
    } catch (error) {
      console.error('Error rendering track:', error);
      return null;
    }
  };
  const startScreenShare = async () => {
    try {
      const tracks = await JitsiMeetJS.createLocalTracks({
        devices: ['desktop'],
      });

      const screenTrack = tracks.find(track => track.getType() === 'video');
      if (screenTrack) {
        if (conference) {
          await conference.addTrack(screenTrack);
        }
        if (screenShareTrack) {
          screenShareTrack.dispose();
        }
        setScreenShareTrack(screenTrack);
        console.log('Screen share started', screenTrack);
      } else {
        console.error('No screen track created.');
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (screenShareTrack) {
      if (conference) {
        await conference.removeTrack(screenShareTrack);
      }
      screenShareTrack.dispose();
      setScreenShareTrack(null);
      console.log('Screen share stopped');
    }
  };
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Your Video</Text>
        {localVideoTrack && renderRTCView(localVideoTrack, 'local', true)}

        {screenShareTrack && (
          <View style={styles.section}>
            <Text style={styles.header}>Screen Sharing</Text>
            {renderRTCView(screenShareTrack, 'screen-share')}
          </View>
        )}

        <Text style={styles.header}>Remote Participants</Text>
        <ScrollView horizontal style={styles.remoteContainer}>
          {Object.keys(remoteTracks).map(participantId =>
            remoteTracks[participantId].map(track =>
              track.getType() === 'video' ? (
                <RTCView
                  key={track.getId()}
                  streamURL={track.getOriginalStream().toURL()}
                  style={styles.remoteVideo}
                />
              ) : null,
            ),
          )}
        </ScrollView>
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {!isConnected ? (
          <TouchableOpacity style={styles.button} onPress={joinMeeting}>
            <Text style={styles.buttonText}>Join Meeting</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={startScreenShare}>
              <Text style={styles.buttonText}>Start Screen Share</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingVertical: 20,
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 100,
  },
  section: {
    marginTop: 20,
    alignItems: 'center',
  },
  header: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 10,
  },
  video: {
    width: width * 0.9,
    height: width * 1.2,
    borderRadius: 16,
    backgroundColor: '#333',
    marginVertical: 10,
  },
  remoteContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 4,
  },
  stopBtn: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JitsiConference;
