function Footer() {
  return (
    <footer className="bg-[#0f1e33] text-white">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-6 lg:px-12">
        <div>
          <p className="text-base font-semibold text-white">Smart Events</p>
          <p className="text-sm text-slate-300">
            AI-powered event experiences for modern education
          </p>
        </div>
        <p className="text-sm text-slate-300">
          &copy; 2026 Smart Events. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
