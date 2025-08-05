// components/LiveChatBox.tsx
'use client';
import React, { useState } from 'react';
import { useLiveChat } from '@/hooks/useChat';
interface LiveChatBoxProps {
  userId: string;
  roomId: string;
}

const LiveChatBox: React.FC<LiveChatBoxProps> = ({ userId, roomId }) => {
  const { messages, sendMessage, isConnected } = useLiveChat(userId, roomId);

  console.log(messages)
  const [input, setInput] = useState('');
  const currentUserId = userId || '';

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
   <div className="w-full max-w-md border rounded shadow p-3 bg-white h-[400px] flex flex-col">
  <div className="text-sm text-gray-700 mb-2 font-semibold">
    {isConnected ? 'Connected to chat' : 'Connecting...'}
  </div>

  <div className="flex-1 overflow-y-auto border p-2 mb-2 bg-gray-50 rounded space-y-1">
    {messages.map((msg: { userId: string; content: string, timestamp: string }, i: number) => {
      const isSender = msg.userId === currentUserId;
      return (
        <div
          key={i}
          className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`rounded-lg px-3 py-2 max-w-[70%] ${
              isSender
                ? 'bg-blue-600 text-white self-end'
                : 'bg-gray-200 text-black self-start'
            }`}
          >
            <div>{isSender ? 'You' : msg.userId.slice(0, 6)}: {msg.content}</div>
            <div className="text-xs mb-1 font-semibold flex justify-end">
              {new Date(msg.timestamp).toLocaleTimeString()} 
            </div>
          </div>
        </div>
      );
    })}
  </div>

  <div className="flex items-center gap-2">
    <input
      className="border text-black p-2 flex-1 rounded"
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      placeholder="Type a message..."
    />
    <button
      onClick={handleSend}
      className="bg-blue-600 text-white px-3 py-1 rounded-lg"
    >
      Send
    </button>
  </div>
</div>

  );
};

export default LiveChatBox;