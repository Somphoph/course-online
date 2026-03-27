'use client';

import Link from 'next/link';
import styles from './auth-shell.module.css';

export function AuthShell({
  tone = 'student',
  eyebrow,
  brandTitle,
  lead,
  bullets = [],
  footerLinks = [],
  children,
}) {
  return (
    <main className={`${styles.shell} ${tone === 'admin' ? styles.admin : styles.student}`}>
      <section className={styles.leftRail}>
        <div>
          <div className={styles.brand} aria-label="Course Online">
            <span className={styles.brandMark} />
            <div>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.brandTitle}>{brandTitle}</h1>
            </div>
          </div>

          <p className={styles.lead}>{lead}</p>
        </div>

        <div className={styles.bulletList}>
          {bullets.map((bullet) => (
            <article key={bullet.title} className={styles.bullet}>
              <span className={styles.bulletMark} aria-hidden="true" />
              <div>
                <p className={styles.bulletTitle}>{bullet.title}</p>
                <p className={styles.bulletCopy}>{bullet.copy}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.railFooter}>
          {footerLinks.map((link) => (
            <Link key={link.href} className={styles.chip} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.surface}>
          <div className={styles.panelCard}>{children}</div>
        </div>
      </section>
    </main>
  );
}
