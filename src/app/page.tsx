import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-dvh bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 pt-safe pb-safe">
        <div className="text-center space-y-10 w-full max-w-sm">
          <div className="space-y-3">
            <Image
              src="/logo.png"
              alt=""
              width={140}
              height={140}
              className="mx-auto w-28 h-28 md:w-36 md:h-36"
              priority
            />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Talkieee
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              실시간으로 대화하는 가장 쉬운 방법
            </p>
          </div>

          {/* 모바일은 세로로 꽉 찬 버튼 — 엄지로 누르기 쉬운 앱 형태 */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-3.5 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 active:bg-blue-100 transition-colors"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
