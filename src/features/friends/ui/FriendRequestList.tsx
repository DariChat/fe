'use client';

import { useState } from 'react';
import { FriendRequestResponse } from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { useFriendsStore } from '../model/friendsStore';
import { FriendAvatar } from './FriendAvatar';

interface FriendRequestListProps {
  requests: FriendRequestResponse[];
  onError: (message: string) => void;
}

const formatReceivedAt = (timestamp: string) => {
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

export function FriendRequestList({
  requests,
  onError,
}: FriendRequestListProps) {
  const acceptRequest = useFriendsStore((state) => state.acceptRequest);
  const rejectRequest = useFriendsStore((state) => state.rejectRequest);

  const [busyId, setBusyId] = useState<number | null>(null);

  const run = async (friendshipId: number, action: () => Promise<void>, fallback: string) => {
    setBusyId(friendshipId);
    try {
      await action();
    } catch (err) {
      onError(toErrorMessage(err, fallback));
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">받은 친구 요청이 없어요</p>
    );
  }

  return (
    <ul className="space-y-1">
      {requests.map((request) => (
        <li
          key={request.friendshipId}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
        >
          <FriendAvatar nickname={request.requesterNickname} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {request.requesterNickname}
            </p>
            <p className="text-xs text-gray-400">
              {formatReceivedAt(request.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={busyId === request.friendshipId}
              onClick={() =>
                run(
                  request.friendshipId,
                  () => acceptRequest(request.friendshipId),
                  '요청을 수락하지 못했습니다'
                )
              }
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              수락
            </button>
            <button
              type="button"
              disabled={busyId === request.friendshipId}
              onClick={() =>
                run(
                  request.friendshipId,
                  () => rejectRequest(request.friendshipId),
                  '요청을 거절하지 못했습니다'
                )
              }
              className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
            >
              거절
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
