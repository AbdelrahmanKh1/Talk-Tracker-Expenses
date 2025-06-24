import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const features = [
  {
    title: 'Voice Recognition',
    desc: 'Advanced AI understands natural language and accurately captures your expenses.',
    icon: '🎤',
    badge: null,
  },
  {
    title: 'Instant Processing',
    desc: 'Your expenses are processed in real-time, categorized, and added instantly.',
    icon: '⚡',
    badge: null,
  },
  {
    title: 'Privacy First',
    desc: 'Your data stays secure. We prioritize privacy and never sell your info.',
    icon: '🔒',
    badge: null,
  },
  {
    title: 'Smart Analytics',
    desc: 'Visualize spending patterns to help you save. ',
    icon: '📊',
    badge: 'Coming Soon',
  },
  {
    title: 'Works Offline',
    desc: 'Record expenses without internet; syncs later.',
    icon: '📶',
    badge: 'Coming Soon',
  },
  {
    title: 'Multi-User Support',
    desc: 'Track shared expenses with family or teams.',
    icon: '👥',
    badge: 'Coming Soon',
  },
];

const faqs = [
  {
    q: 'How accurate is the voice recognition?',
    a: 'Over 98% accuracy — even in noisy environments!'
  },
  {
    q: 'Does Talk support multiple languages?',
    a: 'Yes! 99+ languages supported globally.'
  },
  {
    q: 'Is my data safe?',
    a: '100% yes. You can delete anytime. No data is sold.'
  },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  useEffect(() => { AOS.init({ once: true, duration: 800 }); }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 bg-white shadow-sm w-full">
        <div className="flex items-center gap-3">
          <img src="/Talk_logo.png" alt="Talk Logo" className="h-9 w-9 rounded" />
          <span className="text-xl md:text-2xl font-bold text-gray-900">Talk</span>
        </div>
        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
          <a href="#features" className="hover:text-teal-600">Features</a>
          <a href="#how" className="hover:text-teal-600">How it works</a>
          <a href="#pricing" className="hover:text-teal-600">Pricing</a>
          <a href="#faq" className="hover:text-teal-600">FAQ</a>
          <a href="#support" className="hover:text-teal-600">Support</a>
        </nav>
        <a href="#download" className="hidden md:inline bg-teal-600 text-white px-5 py-2 rounded-full font-semibold shadow hover:bg-teal-700 transition">Download</a>
        {/* Hamburger for mobile */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#0d9488" strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex flex-col items-end">
            <div className="bg-white w-64 h-full shadow-lg p-6 flex flex-col gap-6">
              <button className="self-end mb-4" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#0d9488" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M6 18L18 6"/></svg>
              </button>
              <a href="#features" className="py-2 text-lg hover:text-teal-600" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#how" className="py-2 text-lg hover:text-teal-600" onClick={() => setMenuOpen(false)}>How it works</a>
              <a href="#pricing" className="py-2 text-lg hover:text-teal-600" onClick={() => setMenuOpen(false)}>Pricing</a>
              <a href="#faq" className="py-2 text-lg hover:text-teal-600" onClick={() => setMenuOpen(false)}>FAQ</a>
              <a href="#support" className="py-2 text-lg hover:text-teal-600" onClick={() => setMenuOpen(false)}>Support</a>
              <a href="#download" className="mt-4 bg-teal-600 text-white px-5 py-2 rounded-full font-semibold shadow hover:bg-teal-700 transition text-center" onClick={() => setMenuOpen(false)}>Download</a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="w-full min-h-[80vh] flex flex-col-reverse md:flex-row items-center justify-center text-center md:text-left px-4 md:px-8 py-10 md:py-20 bg-gradient-to-br from-white via-gray-50 to-gray-100 relative overflow-hidden">
        {/* Background shapes */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-100 rounded-full opacity-30 blur-2xl z-0" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-200 rounded-full opacity-20 blur-2xl z-0" />
        <div className="max-w-7xl mx-auto w-full flex flex-col-reverse md:flex-row items-center justify-center relative z-10">
          <div className="flex-1 flex flex-col items-center md:items-start justify-center max-w-xl mx-auto md:mx-0" data-aos="fade-right">
            <span className="inline-block bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">AI Voice Expense Tracker</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">Track expenses with your <span className="text-teal-600">voice</span></h1>
            <p className="text-base sm:text-lg md:text-2xl text-gray-700 max-w-2xl mb-8">No more typing or manual input. Just speak your expenses and let our AI handle the rest. Simple, fast, and accurate expense tracking.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full">
              <a href="#download" className="bg-teal-600 text-white px-8 py-3 rounded-full font-semibold shadow hover:bg-teal-700 transition text-lg w-full sm:w-auto flex items-center justify-center gap-2">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download for iOS
              </a>
            </div>
            <div className="flex flex-col items-center md:items-start mt-8">
              <ul className="text-gray-700 text-base space-y-2">
                <li>✅ Simple</li>
                <li>✅ Fast</li>
                <li>✅ Accurate</li>
              </ul>
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center mb-10 md:mb-0" data-aos="fade-left">
            <div className="relative w-full max-w-[340px] h-auto aspect-[10/20] bg-black rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-200 flex items-center justify-center">
              <img src="/mockupone.png" alt="Talk App Screenshot" className="object-contain w-full h-full" />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" data-aos="fade-up">Why choose Talk?</h2>
          <p className="text-center text-gray-500 mb-12" data-aos="fade-up" data-aos-delay="100">Powerful features designed to make expense tracking effortless</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 flex flex-col items-start shadow hover:shadow-lg transition relative" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{f.title}</h3>
                <p className="text-gray-600 mb-2">{f.desc}</p>
                {f.badge && <span className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-semibold">{f.badge}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" data-aos="fade-up">How it works</h2>
          <p className="text-center text-gray-500 mb-12" data-aos="fade-up" data-aos-delay="100">Three simple steps to effortless expense tracking</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="0">
              <div className="text-5xl mb-4">🎙️</div>
              <div className="bg-teal-100 text-teal-700 rounded-full px-3 py-1 text-xs font-bold mb-2">1</div>
              <h4 className="text-lg font-semibold mb-2">Speak</h4>
              <p className="text-gray-600 text-center">Tap the mic button and say your expense naturally<br/><span className="italic">"Coffee, $4.50"</span></p>
            </div>
            <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="100">
              <div className="text-5xl mb-4">⚡</div>
              <div className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-bold mb-2">2</div>
              <h4 className="text-lg font-semibold mb-2">Process</h4>
              <p className="text-gray-600 text-center">Our AI recognizes and categorizes your expense instantly<br/><span className="italic">AI Processing 85%...</span></p>
            </div>
            <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="200">
              <div className="text-5xl mb-4">✅</div>
              <div className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-bold mb-2">3</div>
              <h4 className="text-lg font-semibold mb-2">Done</h4>
              <p className="text-gray-600 text-center">Your expense is added to your list automatically<br/><span className="italic">☕ Coffee · <b>$4.50</b> · ✓ Added successfully</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" data-aos="fade-up">Simple pricing</h2>
          <p className="text-center text-gray-500 mb-12" data-aos="fade-up" data-aos-delay="100">Choose the plan that works for you</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center shadow" data-aos="fade-up" data-aos-delay="0">
              <div className="text-2xl font-bold mb-2">Free</div>
              <div className="text-3xl font-extrabold mb-4">$0<span className="text-lg font-normal">/month</span></div>
              <ul className="text-gray-700 mb-6 space-y-2">
                <li>Up to 50 voice entries/month</li>
                <li>30 seconds limit per voice note</li>
                <li>Resets every month</li>
              </ul>
              <a href="#download" className="bg-teal-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-teal-700 transition">Download Free</a>
            </div>
            <div className="bg-white border-2 border-teal-600 rounded-2xl p-8 flex flex-col items-center shadow relative" data-aos="fade-up" data-aos-delay="100">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs px-4 py-1 rounded-full font-semibold shadow">Most Popular</span>
              <div className="text-2xl font-bold mb-2">Pro</div>
              <div className="text-3xl font-extrabold mb-4">$4.99<span className="text-lg font-normal">/month</span></div>
              <ul className="text-gray-700 mb-6 space-y-2">
                <li>150 voice entries/month</li>
                <li>Unlimited voice note length</li>
                <li>Device sync, export/share, analytics & mentoring (coming soon)</li>
              </ul>
              <a href="#download" className="bg-teal-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-teal-700 transition">Go Pro</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" data-aos="fade-up">Frequently asked questions</h2>
          <p className="text-center text-gray-500 mb-12" data-aos="fade-up" data-aos-delay="100">Everything you need to know about Talk</p>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6 cursor-pointer transition-all" data-aos="fade-up" data-aos-delay={i * 100}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-teal-600">{openFaq === i ? '−' : '+'}</span> {faq.q}
                  </div>
                </div>
                <div className={`text-gray-700 overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 mt-2' : 'max-h-0'}`}
                  style={{ maxHeight: openFaq === i ? 200 : 0 }}>
                  {openFaq === i && <div>{faq.a}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support/Contact Section */}
      <section id="support" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" data-aos="fade-up">Need help?</h2>
          <p className="text-center text-gray-500 mb-8" data-aos="fade-up" data-aos-delay="100">Get in touch with us and we'll help you with any questions or issues</p>
          <form className="bg-gray-50 rounded-2xl shadow p-8 flex flex-col gap-4" data-aos="fade-up" data-aos-delay="200">
            <input type="text" placeholder="Name" className="px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500" />
            <input type="email" placeholder="Email" className="px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500" />
            <textarea placeholder="How can we help you?" rows={4} className="px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500" />
            <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-teal-700 transition">Send Message</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-200 py-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <img src="/Talk_logo.png" alt="Talk Logo" className="h-8 w-8 rounded" />
            <span className="text-lg font-bold">Talk</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="#support" className="hover:text-white">Support</a>
            <a href="https://www.sayapp.net/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white">Privacy Policy</a>
            <a href="https://www.sayapp.net" target="_blank" rel="noopener noreferrer" className="hover:text-white">Visit Website</a>
          </div>
          <div className="text-xs text-gray-400 mt-4 md:mt-0">© 2025 Talk App. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
