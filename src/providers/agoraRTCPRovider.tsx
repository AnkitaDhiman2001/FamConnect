'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  ILocalAudioTrack,
  IRemoteVideoTrack
} from 'agora-rtc-sdk-ng';

interface AgoraContextType {
  client: IAgoraRTCClient | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  screenTrack: ILocalVideoTrack | null;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
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
 const [remoteUsers, setRemoteUsers] = useState<IRemoteVideoTrack[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setClient(agoraClient);

    return () => {
      agoraClient.removeAllListeners();
    };
  }, []);

  useEffect(() => {
  if (!client) return;

  const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
    await client.subscribe(user, mediaType);

    setRemoteUsers(prev => {
      const exists = prev.find((u:any) => u.uid === user.uid);
      if (!exists) return [...prev, user];
      return prev;
    });

    if (mediaType === 'audio') user.audioTrack?.play();
  };

  const handleUserUnpublished = (user: any) => {
    setRemoteUsers(prev => prev.filter((u:any) => u.uid !== user.uid));
  };

  client.on('user-published', handleUserPublished);
  client.on('user-unpublished', handleUserUnpublished);

  return () => {
    client.off('user-published', handleUserPublished);
    client.off('user-unpublished', handleUserUnpublished);
  };
}, [client]);


 const join = async () => {
  if (!client || hasJoined) return; 

  try {
    setHasJoined(true);

    const appId = 'f989c7c3d602421bb51abb5529ca90e5';
    const channel = 'test-channel';
    const uid = await client.join(appId, channel, null, null);

    setUid(uid as number);
    setChannelName(channel);

    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    const videoTrack = await AgoraRTC.createCameraVideoTrack();

    await client.publish([audioTrack, videoTrack]);

    setLocalAudioTrack(audioTrack);
    setLocalVideoTrack(videoTrack);
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
      const screenTrackResult = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: '1080p_1',
        },
        'auto'
      );

      // Handle both return types
      let videoTrack: ILocalVideoTrack;
      let audioTrack: ILocalAudioTrack | undefined;

      if (Array.isArray(screenTrackResult)) {
        [videoTrack, audioTrack] = screenTrackResult;
      } else {
        videoTrack = screenTrackResult;
      }

      await client.publish([videoTrack]);
      setScreenTrack(videoTrack);

      // Optional: if system audio is captured
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
