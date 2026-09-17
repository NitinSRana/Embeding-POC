import Link from 'next/link'

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2a78d6" />
      <path d="M7 17.5 16 9l9 8.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="19.5" r="3.6" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="16" cy="19.5" r="1.2" fill="#fff" />
    </svg>
  )
}

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/" className="logo">
            <LogoMark /> DeepVue <span className="logo-tag">Embed</span>
          </Link>
          <nav className="topnav">
            <Link href="/">Create tour</Link>
            <Link href="/#tours">Tours</Link>
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  )
}
