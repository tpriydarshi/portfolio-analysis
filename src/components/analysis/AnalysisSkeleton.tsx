export function AnalysisSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="bg-[#1f2020] rounded-md h-3 w-28 mb-3" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="bg-[#1f2020] rounded-md h-9 w-64 mb-2" />
            <div className="bg-[#1f2020] rounded-md h-4 w-96 mt-2" />
            <div className="bg-[#1f2020] rounded-md h-3 w-40 mt-2" />
          </div>
          <div className="bg-[#1f2020] rounded-md h-9 w-28 shrink-0" />
        </div>
      </div>

      {/* Summary stat cards — 4 in a row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#131313] rounded-md p-5">
            <div className="bg-[#1f2020] rounded-md h-3 w-24 mb-3" />
            <div className="bg-[#1f2020] rounded-md h-7 w-32" />
            <div className="bg-[#1f2020] rounded-md h-3 w-28 mt-2" />
          </div>
        ))}
      </div>

      {/* Chart areas — 2 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[#131313] rounded-md p-6">
            <div className="bg-[#1f2020] rounded-md h-4 w-36 mb-4" />
            <div className="bg-[#1f2020] rounded-md h-56 w-full" />
          </div>
        ))}
      </div>

      {/* Sector bar chart skeleton */}
      <div className="bg-[#131313] rounded-md p-6 mb-8">
        <div className="bg-[#1f2020] rounded-md h-4 w-40 mb-4" />
        <div className="bg-[#1f2020] rounded-md h-48 w-full" />
      </div>

      {/* Table skeleton */}
      <div className="mb-8">
        <div className="bg-[#1f2020] rounded-md h-6 w-44 mb-4" />
        <div className="bg-[#131313] rounded-md overflow-hidden">
          {/* Table header */}
          <div className="flex gap-4 p-4 border-b border-[rgba(255,255,255,0.06)]">
            <div className="bg-[#1f2020] rounded-md h-3 w-8" />
            <div className="bg-[#1f2020] rounded-md h-3 w-48 flex-1" />
            <div className="bg-[#1f2020] rounded-md h-3 w-20" />
            <div className="bg-[#1f2020] rounded-md h-3 w-20" />
            <div className="bg-[#1f2020] rounded-md h-3 w-24" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 border-b border-[rgba(255,255,255,0.04)]"
            >
              <div className="bg-[#1f2020] rounded-md h-3 w-8" />
              <div className="bg-[#1f2020] rounded-md h-3 flex-1" style={{ maxWidth: `${180 + (i % 3) * 40}px` }} />
              <div className="bg-[#1f2020] rounded-md h-3 w-20" />
              <div className="bg-[#1f2020] rounded-md h-3 w-20" />
              <div className="bg-[#1f2020] rounded-md h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
