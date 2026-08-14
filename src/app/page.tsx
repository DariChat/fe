import Image from 'next/image';
import Link from 'next/link';
import { GlobeIcon, SparkleIcon, ChatIcon } from '@/shared/ui/icons';

const HIGHLIGHTS = [
  {
    icon: GlobeIcon,
    title: '언어가 달라도 그대로',
    body: '상대의 메시지가 내 언어로 번역돼 도착해요.',
  },
  {
    icon: ChatIcon,
    title: '1:1도 그룹도',
    body: '친구를 초대해 바로 대화를 시작할 수 있어요.',
  },
  {
    icon: SparkleIcon,
    title: '원문도 한 번에',
    body: '번역이 어색하면 원문을 눌러 바로 확인해요.',
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-bg">
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12 pt-safe pb-safe">
        <div className="w-full max-w-sm md:max-w-md text-center">
          {/* 아이콘은 모서리가 각진 원본이라 앱 아이콘처럼 보이게 직접 둥글린다 */}
          <Image
            src="/icons/icon-512.png"
            alt=""
            width={512}
            height={512}
            className="mx-auto w-20 h-20 md:w-24 md:h-24 rounded-[26%] shadow-card"
            priority
          />

          <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
            DariChat
          </h1>
          <p className="mt-3 text-base md:text-lg text-ink-muted">
            언어가 달라도, 각자 편한 말로.
          </p>

          <ul className="mt-9 space-y-2.5 text-left">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex items-start gap-3 p-3.5 bg-surface border border-line rounded-2xl shadow-soft"
              >
                <span className="w-9 h-9 shrink-0 rounded-xl bg-accent-soft text-accent-ink flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-sm text-ink-muted mt-0.5">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {/* 모바일은 세로로 꽉 찬 버튼 — 엄지로 누르기 쉬운 앱 형태 */}
          <div className="mt-9 flex flex-col md:flex-row gap-2.5 md:justify-center">
            <Link
              href="/auth/login"
              className="h-12 flex items-center justify-center px-8 bg-accent text-accent-fg rounded-2xl font-semibold hover:bg-accent-hover transition"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="h-12 flex items-center justify-center px-8 bg-surface border border-line rounded-2xl font-semibold hover:bg-surface-2 transition"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
