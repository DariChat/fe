'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RoomSummaryResponse } from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { roomService } from '../service/roomService';

const formatLastMessageAt = (timestamp: string | null) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();

  return isToday
    ? date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};

export function RoomList() {
  const [rooms, setRooms] = useState<RoomSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomService.getMyRooms();
        setRooms(data);
      } catch (err) {
        setError(toErrorMessage(err, '채팅 목록을 불러오지 못했습니다'));
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
          <p className="text-gray-600">채팅 목록을 불러오는 중...</p>
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
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 mb-4">아직 채팅방이 없어요</p>
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
            + 채팅 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">내 채팅</h2>
      {rooms.map((room) => (
        <Link
          key={room.roomId}
          href={`/chat/${room.roomId}`}
          className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {/* 목록 응답에는 roomType 이 없어서 인원 수로 1:1 을 구분한다 */}
              {room.memberCount === 2 ? '1:1' : 'G'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition truncate">
                {room.roomName || '채팅방'}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {room.lastMessage || `${room.memberCount}명 참여`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs text-gray-400">
                {formatLastMessageAt(room.lastMessageAt)}
              </span>
              {room.unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                  {room.unreadCount > 99 ? '99+' : room.unreadCount}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
