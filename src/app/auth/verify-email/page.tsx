import { Suspense } from 'react';
import { VerifyEmailForm } from '@/features/auth/ui/VerifyEmailForm';

// useSearchParams 는 Suspense 경계가 있어야 페이지가 정적으로 프리렌더된다
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
