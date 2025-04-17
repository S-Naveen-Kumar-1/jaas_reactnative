// TracksContext.js
import React, {
  createContext,

  useContext,
  useEffect,
  useState,
} from "react";
import JitsiMeetJS from "lib-jitsi-meet";
// Create the context
const TracksContext = createContext();
export const useTracks = () => {
  return useContext(TracksContext);
};

export const TracksProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [conference, setConference] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteTracks, setRemoteTracks] = useState({});
  const [appId, setAppId] = useState(
    "vpaas-magic-cookie-58f484fa173f4cda981a9ed1d8fc7a8f"
  );
  const [room, setRoom] = useState("screensharetest");
  const [jwt, setJwt] = useState("eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtNThmNDg0ZmExNzNmNGNkYTk4MWE5ZWQxZDhmYzdhOGYvMjU4NzY0LVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NDQ4NjA3NDcsImV4cCI6MTc0NDg2Nzk0NywibmJmIjoxNzQ0ODYwNzQyLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtNThmNDg0ZmExNzNmNGNkYTk4MWE5ZWQxZDhmYzdhOGYiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsIm91dGJvdW5kLWNhbGwiOnRydWUsInNpcC1vdXRib3VuZC1jYWxsIjpmYWxzZSwidHJhbnNjcmlwdGlvbiI6dHJ1ZSwicmVjb3JkaW5nIjp0cnVlfSwidXNlciI6eyJoaWRkZW4tZnJvbS1yZWNvcmRlciI6ZmFsc2UsIm1vZGVyYXRvciI6dHJ1ZSwibmFtZSI6Im5hdmVlbi5zIiwiaWQiOiJnb29nbGUtb2F1dGgyfDEwMDU5OTEyMTQxODE1ODIyMjEwNyIsImF2YXRhciI6IiIsImVtYWlsIjoibmF2ZWVuLnNAY2FydmVuaWNoZS5jb20ifX0sInJvb20iOiIqIn0.k9Nb9ZX2ITFMjDSP7m2_7U426gIY8vozEtEDzxBXQ34n7RdcaZFeUwtATfhFhLR0TlSr4nei6vy1x2kUMZyAUnsmQdK2Me4PMOX6daoMgUy_5oY1ikCc6cGDBl-VNj7KXJ1bgB3kvVxBTd0M5DhyIAcs8CRamGK4trxClfwvL6RBp_rO9i90kaTSid31uUMYuCEyQUe5jWxSFGkBWrQWUU69nVDoloc-tOUQOTLoUV5BjvY3OqCSd-y8Fzce-_rMXW2YDL9GBq8RPLiu3VCQ1hK97GA4BZf7aL4xFeRTYA9lZWbYWBiBdYh8YTFfhDqAxT2u6eQcnvpPtxJgx0OOEA");
  const [isConnected, setIsConnected] = useState(false);
  const [videoVisible, setVideoVisible] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [screenShareTrack, setScreenShareTrack] = useState(null);
  const [isScreensharing, setIsScreenSharing] = useState(false);

  

  const handleRemoteTrack = async (track) => {
    if (track.isLocal()) return; 

    const participantId = track.getParticipantId();
    const videoType = track.videoType;
   

    console.log(
      `Remote track added: participantId=${participantId}, trackId=${track.getId()}, videoType=${videoType}`
    );

    if (videoType === "desktop") {
      // Handle screen share tracks separately
      console.log("Screen share track detected:", track);
      setScreenShareTrack(track);
    } else {
      // Handle regular remote tracks
      setRemoteTracks((prev) => {
        const existingTracks = prev[participantId] || [];
        if (!existingTracks.find((t) => t.getId() === track.getId())) {
          return {
            ...prev,
            [participantId]: [...existingTracks, track],
          };
        }
        console.log(prev,"remote tracks")
        return prev;
      });
    }
  };

  const buildOptions = (appId, room) => ({
    hosts: {
      domain: "8x8.vc",
      muc: `conference.${appId}.8x8.vc`,
      focus: "focus.8x8.vc",
    },
    serviceUrl: `wss://8x8.vc/${appId}/xmpp-websocket?room=${room}`,
  });

  const onConnectionSuccess = (conn,room) => {
    console.log("check user role inside onConnectionSucces",userRole)
    console.log("Connection established!",conn);
    const conf = conn.initJitsiConference(room, { openBridgeChannel: true });
    if (userRole) {
      conf.setDisplayName(userRole);
    }
    setConference(conf);
    // JitsiMeetJS.rtcstats.sendStatsEntry("user_joined", {
    //   userName: userName,
    //   userEmail: `${userName}@mail.com`,
    //   timestamp: new Date().toISOString(),
    // });

    conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track) => {
      console.log("TRACK_ADDED:", track);
      if (!track.isLocal()) {
        handleRemoteTrack(track);
      }
    });

    conf.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track) => {
      console.log("TRACK_REMOVED:", track);
      const participantId = track.getParticipantId();
      setScreenShareTrack(null)
      setRemoteTracks((prev) => ({
        ...prev,
        [participantId]:
          prev[participantId]?.filter((t) => t.getId() !== track.getId()) || [],
      }));
    });

    conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, () => {
      console.log("Conference joined!");
      setIsConnected(true);
    });

    conf.on(JitsiMeetJS.events.conference.USER_JOINED, (id) => {
      console.log(`User joined: ${id}`);
      
    });

    conf.on(
      JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED,
      (participant, receivedMessage) => {
        console.log(`Message from ${participant.getId()}:`, receivedMessage);
   

        if (receivedMessage.type === "ALERT") {
          // Handle alert messages
          alert(receivedMessage.message);
          // setReceivedAlerts((prev) => [...prev, receivedMessage.message]);
        }
      }
    );

    // Add Local Tracks
    if (localAudioTrack) conf.addTrack(localAudioTrack);
    if (localVideoTrack) conf.addTrack(localVideoTrack);

    conf.join();
  };

  const joinMeeting = async () => {

    console.log(room,"room inisde joinMeeting check also jwt",jwt)
    let options = buildOptions(appId, room);
    options={...options,  
      configOverwrite: {
      startWithAudioMuted: true,
      desktopSharingIOS: true,
      startScreenSharing: true,
      _iosScreenRecordingExtension: "com.shreenshare.testing.BroadcastExtension" 
    },
    featureFlags: {
      'ios.screensharing.enabled': true
    }
  }
    
    const conn = new JitsiMeetJS.JitsiConnection(null, jwt, options);
    console.log(conn,"check conn")
    conn.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      () => onConnectionSuccess(conn,room)
    );

    conn.addEventListener(
 JitsiMeetJS.events.connection.CONNECTION_FAILED,
      (error) => console.error("Connection failed:", error)
    );

    conn.connect();
    setConnection(conn);
  };
  

  const getStoredToken = async () => {
    try {

      
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };

  useEffect(()=>{
    getStoredToken()
  },[])

  return (
    <TracksContext.Provider
      value={{
        localAudioTrack,
        setLocalAudioTrack,
        localVideoTrack,
        setLocalVideoTrack,
        remoteTracks,
        setRemoteTracks,
        jwt,
        setJwt,
        connection,
        setConnection,
        conference,
        setConference,
        appId,
        setAppId,
        room,
        setRoom,
        isConnected,
        setIsConnected,
        userName,
        setUserName,
        videoVisible,
        setVideoVisible,
        audioOn,
        setAudioOn,
        userRole,
        screenShareTrack,
        setScreenShareTrack,
        isScreensharing,
        setIsScreenSharing,
        joinMeeting,
     
        setUserRole
      }}
    >
      {children}
    </TracksContext.Provider>
  );
};
