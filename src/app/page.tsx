import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center space-y-8">
          <div className="space-y-3">
            <Image
              src="/logo.png"
              alt=""
              width={140}
              height={140}
              className="mx-auto"
              priority
            />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Talkieee
            </h1>
            <p className="text-xl text-gray-600">
              실시간으로 대화하는 가장 쉬운 방법
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
