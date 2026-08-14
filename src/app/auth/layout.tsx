export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-4 pt-safe pb-safe">
      {children}
    </div>
  );
}
