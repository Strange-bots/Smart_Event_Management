function Navbar() {
  const navLinkClass =
    "relative inline-block pb-1 text-white transition-colors duration-200 hover:text-[#ff8a3d] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-[#ff8a3d] after:transition-all after:duration-200 hover:after:w-full";

  return (
    <nav className="border-b border-[#163a5a] bg-[#1f4e79]">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-6 py-4 lg:px-12">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#1f4e79] shadow-sm">
            SE
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">
              Smart Events
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-200">
              Discover and manage
            </p>
          </div>
        </a>

        <ul className="hidden items-center gap-8 text-normal font-normal text-white md:flex">
          <li>
            <a href="#home" className={navLinkClass}>
              Home
            </a>
          </li>
          <li>
            <a href="#events" className={navLinkClass}>
              Browse Events
            </a>
          </li>
          <li>
            <a href="#categories" className={navLinkClass}>
              Categories
            </a>
          </li>
          <li>
            <a href="#about" className={navLinkClass}>
              About
            </a>
          </li>
          <li>
            <a href="#contact" className={navLinkClass}>
              Contact
            </a>
          </li>
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          <button className="rounded-lg border border-white/60 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-[#1f4e79]">
            Login
          </button>
          <button className="rounded-lg bg-[#f36f21] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]">
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
