'use client';

import Link from 'next/link';

export function AuthShell({
  tone = 'student',
  eyebrow,
  brandTitle,
  lead,
  bullets = [],
  footerLinks = [],
  children,
}) {
  const accentFrom = tone === 'admin' ? '#312e81' : '#0052ae';
  const accentTo   = tone === 'admin' ? '#4338ca' : '#006adc';
  const markGlow   = tone === 'admin' ? 'rgba(67,56,202,0.22)' : 'rgba(0,106,220,0.22)';

  return (
    <main className="page-shell grid grid-cols-1 lg:grid-cols-[minmax(360px,0.96fr)_minmax(420px,1fr)]">
      <section
        className="relative overflow-hidden flex flex-col justify-between gap-8 p-10 backdrop-blur-2xl lg:min-h-0 min-h-[42vh]"
        style={{
          background: `linear-gradient(145deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.70) 100%), radial-gradient(circle at 20% 20%, ${markGlow}, transparent 38%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -top-28 -right-28 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, transparent 66%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 w-64 h-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${markGlow} 0%, transparent 68%)` }}
          aria-hidden="true"
        />

        <div>
          <div className="inline-flex items-center gap-3.5" aria-label="Course Online">
            <span
              className="w-[18px] h-[18px] rounded-full shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
                boxShadow: `0 12px 24px ${markGlow}`,
              }}
            />
            <div>
              <p className="section-kicker">{eyebrow}</p>
              <h1 className="font-headline font-extrabold leading-none mt-0.5 text-[clamp(2.5rem,4vw,4.4rem)] max-w-[9ch]">
                {brandTitle}
              </h1>
            </div>
          </div>

          <p className="mt-6 max-w-[30ch] text-[clamp(1.05rem,1.2vw,1.2rem)] leading-relaxed text-on-surface/80">
            {lead}
          </p>
        </div>

        <div className="grid gap-3">
          {bullets.map((bullet) => (
            <article
              key={bullet.title}
              className="surface-panel-soft grid max-w-[32ch] items-start gap-3 px-4 py-3.5"
              style={{ gridTemplateColumns: '16px minmax(0,1fr)', boxShadow: '0 20px 40px rgba(25,28,34,0.05)' }}
            >
              <span
                className="w-2.5 h-2.5 mt-1.5 rounded-full shrink-0"
                style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
                aria-hidden="true"
              />
              <div>
                <p className="m-0 font-bold text-on-surface">{bullet.title}</p>
                <p className="mt-1 text-sm leading-snug text-on-surface/72">{bullet.copy}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="chip-link min-h-[40px] px-3.5">
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="p-8 sm:p-8 lg:p-8 grid items-center">
        <div className="w-full max-w-[560px] mx-auto">
          <div className="surface-panel p-7">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
