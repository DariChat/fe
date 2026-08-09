export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 pt-safe pb-safe">
      {children}
    </div>
  );
}
