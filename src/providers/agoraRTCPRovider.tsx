'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  ILocalAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';

interface AgoraContextType {
  client: IAgoraRTCClient | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null ;
  screenTrack: ILocalVideoTrack | null;
  join: (type: 'audio' | 'video') => Promise<void>;
  leave: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  uid: number | null;
  channelName: string | null;
  remoteUsers: any[];
}

const AgoraContext = createContext<AgoraContextType | null>(null);

export const AgoraProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [uid, setUid] = useState<number | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
 const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

 const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);


useEffect(() => {
  if (typeof window === 'undefined') return;

  let isMounted = true;
  let localClient: IAgoraRTCClient;

  import('agora-rtc-sdk-ng').then((AgoraRTC) => {
    if (!isMounted) return;

    localClient = AgoraRTC.default.createClient({ mode: 'rtc', codec: 'vp8' });

    // Store client in state
    setClient(localClient);

    // ✅ Set up event listeners
    localClient.on('user-published', async (user, mediaType) => {
      await localClient.subscribe(user, mediaType);
      if (mediaType === 'video') {
        setRemoteUsers((prev) => {
          const existing = prev.find((u) => u.uid === user.uid);
          if (existing) return prev;
          return [...prev, user];
        });
      }
    });

    localClient.on('user-unpublished', (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    localClient.on('user-left', (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });
  });

  return () => {
    isMounted = false;
    if (localClient) {
      localClient.removeAllListeners();
    }
  };
}, []);


useEffect(() => {
  if (!client) return;

  const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
    await client.subscribe(user, mediaType);

    setRemoteUsers(prev => {
      const exists = prev.find((u: any) => u.uid === user.uid);
      if (!exists) return [...prev, user];
      return prev;
    });

    if (mediaType === 'video') {
      user.videoTrack?.play(`remote-player-${user.uid}`);
    }

    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
  };

  const handleUserJoined = (user: any) => {
    setRemoteUsers(prev => {
      const exists = prev.find((u: any) => u.uid === user.uid);
      if (!exists) return [...prev, user];
      return prev;
    });
  };

  const handleUserUnpublished = (user: any) => {
    setRemoteUsers(prev => prev.filter((u: any) => u.uid !== user.uid));
  };

  const handleUserLeft = (user: any) => {
    setRemoteUsers(prev => prev.filter((u: any) => u.uid !== user.uid));
  };

  client.on('user-published', handleUserPublished);
  client.on('user-joined', handleUserJoined);
  client.on('user-unpublished', handleUserUnpublished);
  client.on('user-left', handleUserLeft);

  return () => {
    client.off('user-published', handleUserPublished);
    client.off('user-joined', handleUserJoined);
    client.off('user-unpublished', handleUserUnpublished);
    client.off('user-left', handleUserLeft);
  };
}, [client]);


  const join = async (type: 'audio' | 'video') => {
    if (!client || hasJoined) return;

    try {
      setHasJoined(true);

      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');

      const appId = 'f989c7c3d602421bb51abb5529ca90e5';
      const channel = 'test-channel';
      const uid = await client.join(appId, channel, null, null);

      setUid(uid as number);
      setChannelName(channel);


      let videoTrack;
      let audioTrack;

      if (type === 'audio') {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([audioTrack]);
        setLocalAudioTrack(audioTrack);
      } else {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        videoTrack = await AgoraRTC.createCameraVideoTrack();
        await client.publish([audioTrack, videoTrack]);
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
      }

    } catch (error) {
      console.error('Error joining channel:', error);
      setHasJoined(false);
    }
  };

  const leave = async () => {
    if (!client) return;

    try {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }

      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }

      if (screenTrack) {
        screenTrack.stop();
        screenTrack.close();
        setScreenTrack(null);
      }

      await client.leave();
      setRemoteUsers([]);

      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setUid(null);
      setChannelName(null);
      setHasJoined(false);
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };

  const startScreenShare = async () => {
    if (!client) return;

    try {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');

      const screenTrackResult = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: '1080p_1',
        },
        'auto'
      );

      let videoTrack: ILocalVideoTrack;
      let audioTrack: ILocalAudioTrack | undefined;

      if (Array.isArray(screenTrackResult)) {
        [videoTrack, audioTrack] = screenTrackResult;
      } else {
        videoTrack = screenTrackResult;
      }

      await client.publish([videoTrack]);
      setScreenTrack(videoTrack);

      if (audioTrack) {
        await client.publish([audioTrack]);
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (!client || !screenTrack) return;

    try {
      await client.unpublish(screenTrack);
      screenTrack.stop();
      screenTrack.close();
      setScreenTrack(null);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };


  const mergeStreams = (): MediaStream => {
  const combinedStream = new MediaStream();

  // Add local tracks
  if (localVideoTrack) {
    const videoStream = localVideoTrack.getMediaStreamTrack();
    combinedStream.addTrack(videoStream);
  }

  if (localAudioTrack) {
    const audioStream = localAudioTrack.getMediaStreamTrack();
    combinedStream.addTrack(audioStream);
  }

  // Add remote tracks
  remoteUsers.forEach((user) => {
    if (user.videoTrack) {
      const remoteVideo = user.videoTrack.getMediaStreamTrack();
      combinedStream.addTrack(remoteVideo);
    }
    if (user.audioTrack) {
      const remoteAudio = user.audioTrack.getMediaStreamTrack();
      combinedStream.addTrack(remoteAudio);
    }
  });

  return combinedStream;
};

const startRecording = async (): Promise<void> => {
  if (mediaRecorder) return;
  try{
  const tracks = [
    localVideoTrack?.getMediaStreamTrack(),
    localAudioTrack?.getMediaStreamTrack(),
    ...remoteUsers
      .map(u => [u.videoTrack?.getMediaStreamTrack(), u.audioTrack?.getMediaStreamTrack()])
      .flat()
      .filter(Boolean)
  ];

  const mixedStream = new MediaStream(tracks as MediaStreamTrack[]);

  if (!mixedStream || mixedStream.getTracks().length === 0) {
    console.error(" No tracks to record. Make sure audio/video is enabled.");
    alert("Recording can't start: no audio/video tracks available.");
    return;
  }

  const recorder = new MediaRecorder(mixedStream, {
    mimeType: 'video/webm; codecs=vp8,opus'
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  recorder.start();
  setMediaRecorder(recorder);
   } catch (err) {
    console.error("Error starting recording", err);
  }
};



const stopRecording = async () => {
  try {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      console.log('Recording stopped');
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
  }
};


  return (
    <AgoraContext.Provider
      value={{
        client,
        localAudioTrack,
        localVideoTrack,
        screenTrack,
        join,
        leave,
        startScreenShare,
        stopScreenShare,
        startRecording,
        stopRecording,
        uid,
        channelName,
        remoteUsers
      }}
    >
      {children}
    </AgoraContext.Provider>
  );
};

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error('useAgora must be used within an AgoraProvider');
  }
  return context;
};
