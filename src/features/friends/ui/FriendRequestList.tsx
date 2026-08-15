'use client';

import { useState } from 'react';
import { FriendRequestResponse } from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { useFriendsStore } from '../model/friendsStore';
import { formatTimeOrDate } from '@/shared/lib/datetime';
import { FriendAvatar } from './FriendAvatar';

interface FriendRequestListProps {
  requests: FriendRequestResponse[];
  onError: (message: string) => void;
}

const formatReceivedAt = formatTimeOrDate;

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
      <div className="text-center py-14 px-6">
        <p className="font-medium">받은 친구 요청이 없어요</p>
        <p className="text-sm text-ink-muted mt-1">
          누군가 요청을 보내면 여기에 바로 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-0.5">
      {requests.map((request) => (
        <li
          key={request.friendshipId}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition"
        >
          <FriendAvatar nickname={request.requesterNickname} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{request.requesterNickname}</p>
            <p className="text-xs text-ink-subtle">
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
              className="px-3 py-1.5 text-sm font-semibold bg-accent text-accent-fg rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
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
              className="px-3 py-1.5 text-sm font-medium text-ink-muted rounded-lg hover:bg-surface-3 transition disabled:opacity-50"
            >
              거절
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
