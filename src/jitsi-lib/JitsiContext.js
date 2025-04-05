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
    "vpaas-magic-cookie-53ccaf42598243d593932049bc381fc8"
  );
  
  const [room, setRoom] = useState("screensharetest");
  const [jwt, setJwt] = useState("eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtNTNjY2FmNDI1OTgyNDNkNTkzOTMyMDQ5YmMzODFmYzgvMGI3MmE2LVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NDM4NDU4NTcsImV4cCI6MTc0Mzg1MzA1NywibmJmIjoxNzQzODQ1ODUyLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtNTNjY2FmNDI1OTgyNDNkNTkzOTMyMDQ5YmMzODFmYzgiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsIm91dGJvdW5kLWNhbGwiOnRydWUsInNpcC1vdXRib3VuZC1jYWxsIjpmYWxzZSwidHJhbnNjcmlwdGlvbiI6dHJ1ZSwicmVjb3JkaW5nIjp0cnVlfSwidXNlciI6eyJoaWRkZW4tZnJvbS1yZWNvcmRlciI6ZmFsc2UsIm1vZGVyYXRvciI6dHJ1ZSwibmFtZSI6ImthbmFrYXByYXNhZCIsImlkIjoiYXV0aDB8NjdlZTFjYjgwMmNlN2Y1ZDdmMTk5ZTk3IiwiYXZhdGFyIjoiIiwiZW1haWwiOiJrYW5ha2FwcmFzYWRAY2FydmVuaWNoZS5jb20ifX0sInJvb20iOiIqIn0.Cc65AHad4LZFso8VnF8d9TbQE_K8qTQu2LQOWGq18S10_i_cGguINDXp6qanJwKCFTRq75egad_I0YfKAB1JS64uDaRS3QHjZ7q4kbsv06BdieYcmS7eRFmEdDFV4Wg6_QOoY_fGi3h_lnPz27Tn5Uyq9b84HPCOS8b3l6x3rTS778dXO_CQ0Sf6i0PHQI_GOi_a4M9qEXwBPTpp0LbJ-NxQWb5SInCKHytbtlfLCq5b9T2JLbMtOddvlpQdMgZLn4vUcWhr5aOpSImv9CTmC7Dh4yOv-j3ihDNgm5cNSBZmyD8hXIGijGAeh2m8yPOTk17I5IMpe10f-7MneBxHdA");
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
    const options = buildOptions(appId, room);
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
