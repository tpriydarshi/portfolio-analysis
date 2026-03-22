export function Footer() {
  return (
    <footer className="bg-[#131313] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-heading italic text-sm text-[#e7e5e5] font-medium">
              Portfolio X-Ray
            </p>
            <p className="text-xs text-[#9f9da1] mt-0.5">
              &copy; {new Date().getFullYear()} Portfolio X-Ray. The Modern Archivist.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-[#767575]">Privacy Policy</span>
            <span className="text-xs text-[#767575]">Terms of Service</span>
            <span className="text-xs text-[#767575]">Contact Support</span>
            <span className="text-xs text-[#767575]">Market Data Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
