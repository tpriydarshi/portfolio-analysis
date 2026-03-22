export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading italic text-2xl font-semibold text-[#e7e5e5] tracking-tight">
            Portfolio X-Ray
          </h1>
          <p className="text-sm text-[#9f9da1] mt-1">
            Unmask your portfolio&apos;s true exposure
          </p>
        </div>
        <div className="bg-[#131313] rounded-md p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
