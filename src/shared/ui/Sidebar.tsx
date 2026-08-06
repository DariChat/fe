'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          href="/main/rooms"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/main/rooms')
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">💬</span>
          Chats
        </Link>

        <Link
          href="/main/friends"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/main/friends')
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">👥</span>
          Friends
        </Link>
      </nav>

      <div className="px-4 py-6 border-t border-gray-200">
        <button className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
          + New Chat
        </button>
      </div>
    </aside>
  );
}
