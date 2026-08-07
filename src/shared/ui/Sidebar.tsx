'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    // 이미 헤더 높이를 뺀 컨테이너 안에 들어가므로 h-screen 이면 헤더 높이만큼 넘친다
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          href="/rooms"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/rooms')
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">💬</span>
          채팅
        </Link>

        <Link
          href="/friends"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/friends')
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">👥</span>
          친구
        </Link>
      </nav>

      <div className="px-4 py-6 border-t border-gray-200">
        <button className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
          + 새 채팅
        </button>
      </div>
    </aside>
  );
}
