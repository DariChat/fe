'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RoomResponse, RoomType } from '@/shared/types/api.types';
import { roomService } from '../service/roomService';

export function RoomList() {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomService.getMyRooms();
        setRooms(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load rooms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No chats yet</p>
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
            + Start a Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Your Chats</h2>
      {rooms.map((room) => (
        <Link
          key={room.roomId}
          href={`/main/chat/${room.roomId}`}
          className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                  {room.roomType === RoomType.DIRECT ? '1:1' : 'G'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                    {room.roomName || (room.roomType === RoomType.DIRECT ? 'Direct Message' : 'Group Chat')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {room.memberCount} member{room.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              {room.roomType === RoomType.DIRECT ? '💬' : '👥'}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
