import React from 'react';

const ShieldIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
);

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0614] text-white">
      {/* Navbar */}
      <nav className="bg-[#0a0614]/80 backdrop-blur-xl border-b border-white/[0.05] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <img src="/mascot.png" alt="BabyBoo" className="w-10 h-10 rounded-xl shadow-lg shadow-violet-500/20" />
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent">BabyBoo</span>
          </a>
          <a href="/" className="text-sm text-white/50 hover:text-white/80 transition-colors font-medium">← Back to Home</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <ShieldIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-white/40 text-base">Last Updated: October 19, 2026 • Effective: October 19, 2026</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-emerald-500/20" style={{ background: 'rgba(34,197,94,0.06)', color: '#4ade80' }}>
            Application ID: com.babyboo.app
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>1</span>
              Introduction
            </h2>
            <div className="pl-11 space-y-4 text-white/50 text-sm leading-relaxed">
              <p>
                BabyBoo ("we", "our", or "us") provides a child screen-time management and parental lockout tool for Android devices. We are committed to protecting your privacy and the privacy of your family.
              </p>
              <div className="p-4 rounded-2xl border border-emerald-500/10" style={{ background: 'rgba(34,197,94,0.04)' }}>
                <p className="text-emerald-400/80 font-semibold text-sm mb-1">🛡️ Core Privacy Principle</p>
                <p className="text-white/50 text-sm">
                  BabyBoo is an <strong className="text-white/70">offline-first, zero-telemetry application</strong>. We do not collect, harvest, track, sell, or transmit personal data, usage data, or sensitive device information to remote servers or third parties.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>2</span>
              Explicit Use of Android Permissions & Services
            </h2>
            <div className="pl-11 space-y-6">
              {/* Accessibility */}
              <div className="p-5 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-white font-semibold text-base mb-3">A. Android Accessibility Service</h3>
                <ul className="space-y-2 text-white/50 text-sm">
                  <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span><span><strong className="text-white/70">Purpose:</strong> Detects when a child switches foreground applications so BabyBoo can present a full-screen blackout overlay and re-assert the lock state.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>Does NOT read, record, log, or transmit typed text, passwords, messages, web history, or on-screen content.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>Does NOT alter system settings without parental intent or bypass Android security controls.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>Declares <code className="px-1.5 py-0.5 rounded bg-white/5 text-violet-300 text-xs">android:isAccessibilityTool="false"</code> in compliance with Google Play policy.</span></li>
                </ul>
              </div>

              {/* Overlay */}
              <div className="p-5 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-white font-semibold text-base mb-3">B. Display Over Other Apps (SYSTEM_ALERT_WINDOW)</h3>
                <ul className="space-y-2 text-white/50 text-sm">
                  <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span><span><strong className="text-white/70">Purpose:</strong> Draws the full-screen blackout layer and simulated battery drain / shutdown visual feedback.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>No visual data beneath the overlay is captured, recorded, or screenshotted.</span></li>
                </ul>
              </div>

              {/* Call Screening */}
              <div className="p-5 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-white font-semibold text-base mb-3">C. Call Screening Service</h3>
                <ul className="space-y-2 text-white/50 text-sm">
                  <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span><span><strong className="text-white/70">Purpose:</strong> Screens incoming calls during active lockout sessions.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span><span>Phone numbers and call metadata are evaluated entirely on-device in real-time. No data is recorded, uploaded, or transmitted.</span></li>
                </ul>
              </div>

              {/* Wake Lock */}
              <div className="p-5 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-white font-semibold text-base mb-3">D. Wake Lock & Vibration</h3>
                <ul className="space-y-2 text-white/50 text-sm">
                  <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span><span><strong className="text-white/70">Purpose:</strong> Keeps the display state active during lock enforcement and provides haptic feedback.</span></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>3</span>
              Data Collection, Storage & Sharing
            </h2>
            <div className="pl-11 space-y-3">
              {[
                { label: 'Personal Information', value: 'We do not collect names, emails, phone numbers, addresses, or device identifiers (IMEI, Android ID, Advertising ID).' },
                { label: 'Analytics & Telemetry', value: 'No third-party tracking SDKs, no behavioral analytics, no advertising frameworks.' },
                { label: 'Network Traffic', value: 'No background network connections. No data transmitted to any external server.' },
                { label: 'Local Storage', value: 'All preferences, PINs, and timers stored locally using encrypted Android SharedPreferences.' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/[0.06] flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-emerald-400 text-lg">✓</span>
                  <div>
                    <span className="text-white/70 font-semibold text-sm">{item.label}:</span>
                    <span className="text-white/50 text-sm ml-1">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>4</span>
              Children's Privacy & COPPA Compliance
            </h2>
            <div className="pl-11 text-white/50 text-sm leading-relaxed space-y-3">
              <p>BabyBoo is designed for parents and guardians to manage child screen time:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span> Compliant with COPPA and Google Play's Families Policy</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span> Does not knowingly solicit or collect information from children under 13</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span> No advertisements, in-app behavioral tracking, or external links presented to children</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>5</span>
              Data Retention & Deletion
            </h2>
            <div className="pl-11 text-white/50 text-sm leading-relaxed space-y-3">
              <p>All settings remain on your device for as long as the app is installed. You can delete all data at any time:</p>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Open Android <strong className="text-white/70">Settings → Apps → BabyBoo</strong></li>
                <li>Select <strong className="text-white/70">Storage & cache → Clear Storage / Clear Data</strong></li>
                <li>Or simply <strong className="text-white/70">uninstall</strong> the application</li>
              </ol>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>6</span>
              Revoking Permissions
            </h2>
            <div className="pl-11 space-y-3">
              {[
                { perm: 'Accessibility Service', path: 'Settings → Accessibility → BabyBoo → Toggle off' },
                { perm: 'Display Over Apps', path: 'Settings → Apps → Special app access → Display over other apps → BabyBoo → Toggle off' },
                { perm: 'Call Screening', path: 'Settings → Apps → Default apps → Caller ID & spam app → Set to system default' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/[0.06] flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-amber-400 text-sm">🔧</span>
                  <div>
                    <span className="text-white/70 font-semibold text-sm">{item.perm}:</span>
                    <span className="text-white/50 text-sm ml-1">{item.path}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 7 & 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>7</span>
              Changes to This Policy
            </h2>
            <div className="pl-11 text-white/50 text-sm leading-relaxed">
              <p>If we update this Privacy Policy, the updated version will be published at <a href="/privacy" className="text-violet-400 hover:text-violet-300 transition-colors">babyboo.app/privacy</a> with a revised "Last Updated" date.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>8</span>
              Contact Us
            </h2>
            <div className="pl-11 space-y-3">
              {[
                { label: 'Support Email', value: 'support@babyboo.app', href: 'mailto:support@babyboo.app' },
                { label: 'Developer Email', value: 'aryanraj0316@gmail.com', href: 'mailto:aryanraj0316@gmail.com' },
                { label: 'GitHub', value: 'github.com/aryanraj0316/BabyBoo', href: 'https://github.com/aryanraj0316/BabyBoo' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-white/60 font-semibold">{item.label}:</span>
                  <a href={item.href} className="text-violet-400 hover:text-violet-300 transition-colors">{item.value}</a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">© 2026 BabyBoo. All rights reserved.</p>
          <a href="/" className="text-white/30 hover:text-white/50 text-xs transition-colors">← Back to Home</a>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
