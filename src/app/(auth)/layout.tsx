export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#000212] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">
            Portfolio X-Ray
          </h1>
          <p className="text-sm text-[#8a8f98] mt-1">
            See through your mutual fund portfolio
          </p>
        </div>
        <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
