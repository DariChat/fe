import { MessageResponse } from '@/shared/types/api.types';

interface MessageItemProps {
  message: MessageResponse;
  isOwn: boolean;
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`flex gap-3 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}
      >
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {message.senderNickname.charAt(0).toUpperCase()}
          </div>
        )}

        <div className={isOwn ? 'text-right' : ''}>
          {!isOwn && (
            <p className="text-xs text-gray-500 font-medium mb-1 px-1">
              {message.senderNickname}
            </p>
          )}
          <div
            className={`px-4 py-2 rounded-2xl break-words ${
              isOwn
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 px-1">
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
