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
} from 'agora-rtc-sdk-ng';

interface AgoraContextType {
  client: IAgoraRTCClient | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  screenTrack: ILocalVideoTrack | null;
  join(type: 'audio' | 'video'): Promise<void>;
  join(type: 'live', role: 'host' | 'audience'): Promise<void>;
  join(type: 'audio' | 'video' | 'live', role?: 'host' | 'audience'): Promise<void>;
  leave: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  joinLiveAsHost: () => Promise<void>;
  joinLiveAsAudience: () => Promise<void>;
  leaveLive: () => Promise<void>;
  uid: number | null;
  channelName: string | null;
  remoteUsers: any[];
}

const AgoraContext = createContext<AgoraContextType | null>(null);

export const AgoraProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [screenClient, setScreenClient] = useState<IAgoraRTCClient | null>(null);
  const [liveClient, setLiveClient] = useState<IAgoraRTCClient | null>(null);

  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [uid, setUid] = useState<number | null>(null);
  const [channelName, setChannelName] = useState<string | null>('test-channel');
  const [hasJoined, setHasJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Initialize RTC client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('agora-rtc-sdk-ng').then((AgoraRTC) => {
      const rtcClient = AgoraRTC.default.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(rtcClient);
    });
  }, []);

  // Join normal RTC call
const join = async (
  type: 'audio' | 'video' | 'live',
  role: 'host' | 'audience' = 'host' 
) => {
  if (!client || hasJoined) return;
  setHasJoined(true);

  try {
    const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
    const appId = 'f989c7c3d602421bb51abb5529ca90e5';

    client.setClientRole(role); 

    const uid = await client.join(
      appId,
      channelName!,
      null,
      null
    );

    setUid(uid as number);

    if (type === 'live') {
      await client.setClientRole(role);
    }

    // HOSTS can publish
    if (role === 'host') {
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      let videoTrack: ICameraVideoTrack | null = null;

      if (type === 'video' || type === 'live') {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
        await client.publish([audioTrack, videoTrack]);
        setLocalVideoTrack(videoTrack);
      } else {
        await client.publish([audioTrack]);
      }

      setLocalAudioTrack(audioTrack);
    }

    // LISTEN for remote user events (works for all roles)
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      setRemoteUsers((prev) => [...prev.filter((u) => u.uid !== user.uid), user]);

      if (mediaType === 'video') {
        user.videoTrack?.play(`remote-player-${user.uid}`);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    client.on('user-unpublished', (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    client.on('user-left', (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });
  } catch (err) {
    console.error('Join RTC Error:', err);
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
      }

      await client.leave();
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setRemoteUsers([]);
      setUid(null);
      setHasJoined(false);
    } catch (err) {
      console.error('Leave RTC Error:', err);
    }
  };

  const startScreenShare = async () => {
    if (!client || !channelName) return;

    try {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      const screenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setScreenClient(screenClient);

      await screenClient.join('f989c7c3d602421bb51abb5529ca90e5', channelName, null, null);

      const screenTrackResult = await AgoraRTC.createScreenVideoTrack({ encoderConfig: '1080p_1' }, 'auto');

      let screenVideoTrack: ILocalVideoTrack;
      let screenAudioTrack: ILocalAudioTrack | undefined;

      if (Array.isArray(screenTrackResult)) {
        [screenVideoTrack, screenAudioTrack] = screenTrackResult;
      } else {
        screenVideoTrack = screenTrackResult;
      }

      await screenClient.publish(screenAudioTrack ? [screenVideoTrack, screenAudioTrack] : [screenVideoTrack]);
      setScreenTrack(screenVideoTrack);
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (!screenTrack || !screenClient) return;

    try {
      await screenClient.unpublish(screenTrack);
      screenTrack.stop();
      screenTrack.close();
      await screenClient.leave();
      setScreenTrack(null);
      setScreenClient(null);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const startRecording = async () => {
    if (mediaRecorder) return;

    const tracks = [
      localVideoTrack?.getMediaStreamTrack(),
      localAudioTrack?.getMediaStreamTrack(),
      ...remoteUsers
        .flatMap((u) => [u.videoTrack?.getMediaStreamTrack(), u.audioTrack?.getMediaStreamTrack()])
        .filter(Boolean),
    ];

    const mixedStream = new MediaStream(tracks as MediaStreamTrack[]);

    if (!mixedStream || mixedStream.getTracks().length === 0) {
      console.error('No tracks to record');
      alert('No audio/video to record.');
      return;
    }

    const recorder = new MediaRecorder(mixedStream, { mimeType: 'video/webm; codecs=vp8,opus' });

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
  };

  const stopRecording = async () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  // Live Streaming: Host
  const joinLiveAsHost = async () => {
    try {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      const live = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      await live.setClientRole('host');

      await live.join('f989c7c3d602421bb51abb5529ca90e5', channelName!, null, null);
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();

      await live.publish([audioTrack, videoTrack]);
      setLiveClient(live);
    } catch (err) {
      console.error('Join live as host failed:', err);
    }
  };

  // Live Streaming: Audience
  const joinLiveAsAudience = async () => {
    try {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      const live = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      await live.setClientRole('audience');

      await live.join('f989c7c3d602421bb51abb5529ca90e5', channelName!, null, null);

      live.on('user-published', async (user, mediaType) => {
        await live.subscribe(user, mediaType);
        if (mediaType === 'video') user.videoTrack?.play(`remote-player-${user.uid}`);
        if (mediaType === 'audio') user.audioTrack?.play();
        setRemoteUsers((prev) => [...prev.filter((u) => u.uid !== user.uid), user]);
      });

      live.on('user-unpublished', (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      setLiveClient(live);
    } catch (err) {
      console.error('Join live as audience failed:', err);
    }
  };

  const leaveLive = async () => {
    if (!liveClient) return;

    try {
      await liveClient.leave();
      liveClient.removeAllListeners();
      setLiveClient(null);
      setRemoteUsers([]);
    } catch (err) {
      console.error('Leave live failed:', err);
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
        joinLiveAsHost,
        joinLiveAsAudience,
        leaveLive,
        uid,
        channelName,
        remoteUsers,
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
