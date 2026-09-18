'use client'

import { useState } from 'react'
import Script from 'next/script'

export default function Home() {
  const [submitted, setSubmitted] = useState(false)

  const openTally = () => {
    // @ts-ignore
    if (window.Tally) {
      // @ts-ignore
      window.Tally.openPopup('1AjKOO', {
        layout: 'modal',
        autoClose: 3000,
        onSubmit: () => setSubmitted(true),
      })
    }
  }

  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: #f5f5f0  }
        body { background: #f5f5f0  color: #F0EDE6; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        ::selection { background: #C8F135; color: #0A0A0A; }

        @media (max-width: 640px) {
          .hero-headline { font-size: 36px !important; letter-spacing: -1px !important; }
          .page-pad { padding-left: 24px !important; padding-right: 24px !important; }
          .report-card { margin: 0 24px !important; }
          .how-row { flex-direction: column !important; gap: 8px !important; }
          .how-label { font-size: 20px !important; min-width: unset !important; }
        }
      `}</style>

      <main style={{ background: '#f5f5f0', minHeight: '100vh' }}>

        {/* Nav — minimal, doesn't compete */}
        <nav style={{
          padding: '20px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '680px',
          margin: '0 auto',
        }} className="page-pad">
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '18px',
            fontWeight: 700,
            color: '#0A0A0A',
          }}>
            ValidateIt
          </span>
          <span style={{ fontSize: '12px', color: '#3A3A3A' }}>
            Early access
          </span>
        </nav>

        {/* Hero — everything above the fold */}
        <section style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '56px 48px 72px',
          textAlign: 'center',
        }} className="page-pad">

          {/* Headline — the only bold thing */}
          <h1
            className="hero-headline"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '52px',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-2px',
              color: '#0A0A0A',
              marginBottom: '24px',
            }}
          >
            Your competitors'<br />
            bad reviews are<br />
            <span style={{ fontStyle: 'italic', color: '#C8F135' }}>your roadmap.</span>
          </h1>

          {/* One sentence — what it does */}
          <p style={{
            fontSize: '17px',
            color: '#666',
            lineHeight: 1.6,
            fontWeight: 300,
            maxWidth: '480px',
            margin: '0 auto 40px',
          }}>
            Type your market. We read thousands of App Store reviews from competing apps and show you exactly what users are begging for.
          </p>

          {/* CTA — the loudest element on the page */}
          {submitted ? (
            <div style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#C8F135' }}>
                You're on the list.
              </p>
              <p style={{ fontSize: '13px', color: '#444' }}>
                We'll email you when ValidateIt is ready.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={openTally}
                style={{
                  background: '#C8F135',
                  color: '#0A0A0A',
                  border: 'none',
                  padding: '18px 40px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-0.3px',
                  width: '100%',
                  maxWidth: '320px',
                  transition: 'transform 0.1s ease, opacity 0.1s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Join the waitlist
              </button>
              <p style={{ fontSize: '12px', color: '#3A3A3A' }}>
                Free. No spam. One email when we launch.
              </p>
            </div>
          )}
        </section>

        {/* Social proof line */}
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 48px 56px',
          textAlign: 'center',
        }} className="page-pad">
          <p style={{ fontSize: '13px', color: '#2E2E2E' }}>
            Joined by founders building in fintech, productivity, health and more
          </p>
        </div>

        {/* Report mockup — proof the product is real */}
        <div style={{
          maxWidth: '640px',
          margin: '0 auto 80px',
          background: '#0F0F0F',
          border: '1px solid #1C1C1C',
          borderRadius: '10px',
          overflow: 'hidden',
        }} className="report-card">

          {/* Bar */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #1C1C1C',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0D0D0D',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#D4D0C8' }}>
                Invoicing apps for freelancers
              </p>
              <p style={{ fontSize: '11px', color: '#3A3A3A', marginTop: '2px' }}>
                4 apps · 2,847 reviews analysed
              </p>
            </div>
            <span style={{
              background: '#C8F135',
              color: '#0A0A0A',
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
            }}>
              live
            </span>
          </div>

          {/* Rows */}
          {[
            { rank: 1, text: "Can't accept payments directly",     mentions: 340, hot: true  },
            { rank: 2, text: 'No recurring invoice feature',        mentions: 210, hot: true  },
            { rank: 3, text: 'Too expensive for solo freelancers',  mentions: 180, hot: false },
            { rank: 4, text: 'No client portal to track status',    mentions: 150, hot: false },
            { rank: 5, text: 'Terrible mobile experience',          mentions: 120, hot: false },
          ].map((item) => (
            <div key={item.rank} style={{
              padding: '13px 20px',
              borderBottom: '1px solid #141414',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}>
              <span style={{
                fontSize: '11px',
                color: '#2A2A2A',
                fontFamily: 'monospace',
                minWidth: '14px',
              }}>
                {item.rank}
              </span>
              <span style={{
                flex: 1,
                fontSize: '13px',
                color: item.hot ? '#D4D0C8' : '#555',
                lineHeight: 1.4,
              }}>
                {item.text}
              </span>
              <span style={{
                fontSize: '11px',
                color: item.hot ? '#C8F135' : '#2E2E2E',
                fontFamily: 'monospace',
                minWidth: '60px',
                textAlign: 'right',
              }}>
                {item.mentions} reviews
              </span>
            </div>
          ))}

          <div style={{ padding: '10px 20px' }}>
            <p style={{ fontSize: '11px', color: '#222' }}>
              Freshbooks, Wave, Invoice Ninja, AND.CO
            </p>
          </div>
        </div>

        {/* How it works — simple, no numbers, prose */}
        <section style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 48px 80px',
        }} className="page-pad">

          <p style={{
            fontSize: '13px',
            color: '#2E2E2E',
            marginBottom: '40px',
            textAlign: 'center',
          }}>
            How it works
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              {
                label: 'Describe',
                body: 'Tell us your market — "habit tracker for students" or "invoicing for freelancers". Be specific.',
              },
              {
                label: 'We read',
                body: 'ValidateIt finds the top competing apps and reads their 1 and 2 star reviews. Thousands of them.',
              },
              {
                label: 'You build',
                body: 'Get a ranked report of what users wish existed. Now you build with evidence, not assumptions.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="how-row"
                style={{
                  display: 'flex',
                  gap: '32px',
                  alignItems: 'baseline',
                  padding: '28px 0',
                  borderBottom: i < 2 ? '1px solid #141414' : 'none',
                }}
              >
                <span
                  className="how-label"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#1E1E1E',
                    minWidth: '120px',
                    flexShrink: 0,
                  }}
                >
                  {item.label}
                </span>
                <p style={{
                  fontSize: '15px',
                  color: '#555',
                  lineHeight: 1.65,
                  fontWeight: 300,
                }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{
          borderTop: '1px solid #141414',
          padding: '72px 48px',
          textAlign: 'center',
          maxWidth: '640px',
          margin: '0 auto',
        }} className="page-pad">
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '32px',
            fontWeight: 900,
            letterSpacing: '-1px',
            lineHeight: 1.15,
            marginBottom: '32px',
            color: '#0A0A0A',
          }}>
            Build what people<br />are already asking for.
          </h2>

          {submitted ? (
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#C8F135' }}>
              You're on the list. We'll be in touch.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={openTally}
                style={{
                  background: '#C8F135',
                  color: '#0A0A0A',
                  border: 'none',
                  padding: '18px 40px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif",
                  width: '100%',
                  maxWidth: '320px',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Join the waitlist
              </button>
              <p style={{ fontSize: '12px', color: '#3A3A3A' }}>
                Free. No spam. One email when we launch.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid #141414',
          padding: '24px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '640px',
          margin: '0 auto',
        }} className="page-pad">
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '15px',
            fontWeight: 700,
            color: '#2A2A2A',
          }}>
            ValidateIt
          </span>
          <span style={{ fontSize: '11px', color: '#222' }}>
            © 2026
          </span>
        </footer>

      </main>
    </>
  )
}