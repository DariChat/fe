import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/ui/LoginForm';

// useSearchParams(인증 완료 안내·이메일 프리필) 는 Suspense 경계가 있어야 프리렌더된다
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
