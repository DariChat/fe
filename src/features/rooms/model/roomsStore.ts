import { create } from 'zustand';
import {
  RoomCreateRequest,
  RoomResponse,
  RoomSummaryResponse,
} from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { roomService } from '../service/roomService';

/**
 * 방 목록은 레이아웃의 RoomList 와 대화방 화면이 함께 쓴다.
 * 각자 GET /api/rooms 를 부르면 같은 목록을 두 번 불러오고,
 * 방을 만들거나 나가도 다른 쪽 화면이 갱신되지 않아 한 곳에 모아둔다.
 */

/** 생성 직후에는 메시지가 없으므로 마지막 메시지 없이 목록에 끼워 넣는다 */
const toSummary = (room: RoomResponse): RoomSummaryResponse => ({
  roomId: room.roomId,
  roomName: room.roomName,
  lastMessage: null,
  lastMessageAt: null,
  memberCount: room.memberCount,
  unreadCount: 0,
});

interface RoomsState {
  rooms: RoomSummaryResponse[];
  /** 한 번이라도 목록을 받아왔는지 — 화면을 옮길 때마다 다시 부르지 않으려고 둔다 */
  hasLoaded: boolean;
  isLoading: boolean;
  error: string;
  fetchRooms: (options?: { force?: boolean }) => Promise<void>;
  createRoom: (data: RoomCreateRequest) => Promise<RoomResponse>;
  leaveRoom: (roomId: number) => Promise<void>;
  markRoomRead: (roomId: number) => void;
  applyMessagePreview: (
    roomId: number,
    message: { content: string; createdAt: string }
  ) => void;
  reset: () => void;
}

const initialState = {
  rooms: [] as RoomSummaryResponse[],
  hasLoaded: false,
  isLoading: false,
  error: '',
};

export const useRoomsStore = create<RoomsState>((set, get) => ({
  ...initialState,

  async fetchRooms({ force = false } = {}) {
    if (get().hasLoaded && !force) {
      return;
    }

    // 이미 목록이 있는 상태의 새로고침은 화면을 로딩으로 되돌리지 않는다
    set({ isLoading: !get().hasLoaded, error: '' });

    try {
      set({ rooms: await roomService.getMyRooms(), hasLoaded: true });
    } catch (err) {
      // 주기적 갱신이 한 번 실패했다고 이미 보고 있던 목록을 에러 화면으로 덮지 않는다
      if (get().hasLoaded) {
        console.warn('채팅 목록 갱신 실패, 이전 목록을 유지합니다', err);
      } else {
        set({ error: toErrorMessage(err, '채팅 목록을 불러오지 못했습니다') });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  async createRoom(data) {
    const room = await roomService.createRoom(data);

    set((state) => ({
      rooms: [
        toSummary(room),
        ...state.rooms.filter((r) => r.roomId !== room.roomId),
      ],
    }));

    return room;
  },

  async leaveRoom(roomId) {
    await roomService.leaveRoom(roomId);
    set((state) => ({
      rooms: state.rooms.filter((room) => room.roomId !== roomId),
    }));
  },

  /**
   * 서버는 /sub/rooms/{roomId} 구독 시점에 읽음 처리를 한다.
   * 그 결과는 다음 목록 조회 때나 반영되므로 배지는 화면에서 먼저 지운다.
   */
  markRoomRead(roomId) {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.roomId === roomId ? { ...room, unreadCount: 0 } : room
      ),
    }));
  },

  /** 데스크톱에서는 대화 중에도 목록이 옆에 보이므로 미리보기를 함께 갱신한다 */
  applyMessagePreview(roomId, message) {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.roomId === roomId
          ? {
              ...room,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
            }
          : room
      ),
    }));
  },

  reset() {
    set({ ...initialState });
  },
}));
