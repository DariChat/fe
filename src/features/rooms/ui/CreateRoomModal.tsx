'use client';

import { useState } from 'react';
import { RoomType } from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { useRoomsStore } from '../model/roomsStore';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreated: (roomId: number) => void;
}

/**
 * 참여자는 사용자 id 로 지정한다.
 * 백엔드에 사용자 검색·친구 목록 API 가 아직 없어서 닉네임으로는 고를 수 없다.
 * (API 가 생기면 이 입력만 검색 결과 선택 UI 로 바꾸면 된다)
 */
const parseMemberIds = (raw: string): number[] =>
  raw
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number);

export function CreateRoomModal({ onClose, onCreated }: CreateRoomModalProps) {
  const createRoom = useRoomsStore((state) => state.createRoom);

  const [roomType, setRoomType] = useState<RoomType>(RoomType.DIRECT);
  const [roomName, setRoomName] = useState('');
  const [memberIdsInput, setMemberIdsInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDirect = roomType === RoomType.DIRECT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const memberIds = parseMemberIds(memberIdsInput);

    if (memberIds.length === 0) {
      setError('참여자 id 를 한 명 이상 입력하세요');
      return;
    }
    if (memberIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      setError('참여자 id 는 숫자로 입력하세요 (예: 2, 3)');
      return;
    }
    if (isDirect && memberIds.length > 1) {
      setError('1:1 채팅은 참여자를 한 명만 지정할 수 있어요');
      return;
    }
    if (!isDirect && !roomName.trim()) {
      setError('그룹 채팅은 방 이름이 필요해요');
      return;
    }

    setIsLoading(true);

    try {
      const room = await createRoom({
        // 1:1 은 이름을 비워두면 서버가 상대 닉네임으로 채운다 (빈 문자열을 보내면 그대로 저장된다)
        ...(roomName.trim() ? { roomName: roomName.trim() } : {}),
        roomType,
        memberIds,
      });
      onCreated(room.roomId);
    } catch (err) {
      setError(toErrorMessage(err, '채팅방을 만들지 못했습니다'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="새 채팅방 만들기"
        className="w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-safe md:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">새 채팅방</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {[
              { type: RoomType.DIRECT, label: '1:1 채팅' },
              { type: RoomType.GROUP, label: '그룹 채팅' },
            ].map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setRoomType(type)}
                aria-pressed={roomType === type}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition ${
                  roomType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="roomName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              방 이름{' '}
              {isDirect && (
                <span className="text-gray-400 font-normal">(선택)</span>
              )}
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={isDirect ? '비워두면 상대 닉네임이 됩니다' : '예: 프로젝트 팀'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label
              htmlFor="memberIds"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              참여자 id
            </label>
            <input
              id="memberIds"
              type="text"
              value={memberIdsInput}
              onChange={(e) => setMemberIdsInput(e.target.value)}
              placeholder={isDirect ? '2' : '2, 3, 4'}
              inputMode="numeric"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              쉼표로 구분해 입력하세요. 사용자 검색 API 가 없어 지금은 id 로만
              초대할 수 있어요.
            </p>
          </div>

          {error && (
            <p className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '만드는 중...' : '채팅방 만들기'}
          </button>
        </form>
      </div>
    </div>
  );
}
