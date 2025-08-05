'use client';

import { useEffect, useRef, useState } from 'react';
import { useAgora } from '@/providers/agoraRTCPRovider';
import useNewContext from '@/providers/userSessionProvider';
import LiveChatBox from '@/components/LiveChatBot';


export default function Page() {
  const agora = useAgora();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const remoteUsers = agora.remoteUsers;
  const {loggedUser, setLoggedUser} = useNewContext();
  const [hasJoined, setHasJoined] = useState(false);
  const [type, setType] = useState<'audio' | 'video' | 'live'>('video');

  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRefs = useRef<{ [uid: number]: HTMLDivElement }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [input, setInput] = useState('');


  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
  }, []);

  
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setLoggedUser(JSON.parse(storedUser));
    }
  }, []);


  useEffect(() => {
    return () => {
      agora?.leave?.();
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && agora?.localVideoTrack) {
      agora.localVideoTrack.play(localVideoRef.current);
    }
  }, [agora?.localVideoTrack]);

  const toggleMic = async () => {
    if (!agora) return;
    try {
      await agora.localAudioTrack?.setEnabled(!isMicOn);
      setIsMicOn(prev => !prev);
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  const toggleCamera = async () => {
    if (!agora) return;
    try {
      await agora.localVideoTrack?.setEnabled(!isCameraOn);
      setIsCameraOn(prev => !prev);
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  const toggleScreenShare = async () => {
    if (!agora) return;
    try {
      if (isScreenSharing) {
        await agora.stopScreenShare();
      } else {
        await agora.startScreenShare();
      }
      setIsScreenSharing(prev => !prev);
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        await agora.startRecording();
        setIsRecording(true);
        setRecordingTime(0); 

        intervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

      } catch (error) {
        console.error('Error starting recording:', error);
      }
    } else {
      try {
        await agora.stopRecording();
        setIsRecording(false);

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setRecordingTime(0);
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);


  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-xl font-bold">Username: {loggedUser?.name}</h1>
        <h2 className="text-2xl mb-4">Ready to join the room?</h2>
        <div className="flex space-x-4 mb-4">
        <button
          onClick={async () => {
            try {
              await agora.join('video');
              setHasJoined(true);
              setType('video');
            } catch (e) {
              console.error("Join failed", e);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Join Video Call
        </button>

          <button
          onClick={async () => {
            try {
              console.log("live streaming")
            } catch (e) {
              console.error("Join failed", e);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Join Audio Call
        </button>

          <button
            onClick={async () => {
              try {
                await agora.join('live', 'host');
                setHasJoined(true);
                setType('live');
              } catch (e) {
                console.error("Host join failed", e);
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
          >
            Go Live as Host
          </button>

          <button
            onClick={async () => {
              try {
                await agora.join('live', 'audience');
                setHasJoined(true);
                setType('live');
              } catch (e) {
                console.error("Audience join failed", e);
              }
            }}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Join as Audience
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Username: {loggedUser?.name}</h1>
        <h2 className="text-xl font-semibold">Room: {agora?.channelName}</h2>
        <button
          onClick={() => {
            agora?.leave();
            setHasJoined(false);
          }}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Leave
        </button>
      </div>

      <div className="flex-grow p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="w-full h-64 bg-black rounded-xl overflow-hidden relative">
          <div ref={localVideoRef} className="w-full h-full" />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
            You ({agora?.uid})
          </div>
        </div>

        {remoteUsers.map((user) => (
          <div
              id={`remote-player-${user.uid}`}
              key={user.uid}
              className="w-full h-64 bg-black rounded-xl overflow-hidden relative"
            >
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
                User: {user.uid}
              </div>
            </div>

        ))}

        {agora.screenTrack && (
          <div className="w-full h-64 bg-black rounded-xl overflow-hidden relative">
            <div
              ref={(el) => {
                if (el && agora.screenTrack) {
                  agora.screenTrack.play(el);
                }
              }}
              className="w-full h-full"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
              Shared Screen
            </div>
          </div>
        )}

      </div>

      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={toggleMic}
            className={`px-3 py-2 rounded-xl ${isMicOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          >
            {isMicOn ? 'Mute' : 'Unmute'}
          </button>
          {type === 'video' && (
            <button
              onClick={toggleCamera}
              className={`px-3 py-2 rounded-xl ${isCameraOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
            {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          </button>
          )}
          {!isMobile &&  (<button
            onClick={toggleScreenShare}
            className={`px-3 py-2 rounded-xl ${isScreenSharing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          </button>
          )}

          <button
            onClick={toggleRecording} 
            className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700"
          >
           {isRecording ? `Stop Recording ${recordingTime > 0 && formatTime(recordingTime)}s` : 'Start Recording'} 
          </button>


        </div>
         <div className="w-[400px]">
        <LiveChatBox userId={loggedUser.id?.toString()} roomId={'testroom'} />
      </div>
      </div>
    </div>
  );
}

