'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
  AnimatePresence,
  type Variants,
} from 'framer-motion';
import {
  VideoPlay,
  Calendar,
  People,
  Receipt,
  Wallet,
  MessageText,
  ArrowRight,
  TickCircle,
  Add,
  Building,
  Brush,
} from 'iconsax-react';

const ease = [0.22, 1, 0.36, 1] as const;

const reveal: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease } },
};

const stagger: Variants = { show: { transition: { staggerChildren: 0.08 } } };

function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Nav ─────────────────────────────────────────────────────── */
function Nav() {
  const { scrollY } = useScroll();
  const width = useTransform(scrollY, [0, 120], ['72rem', '55rem']);
  const top = useTransform(scrollY, [0, 120], [0, 16]);
  return (
    <motion.header style={{ top }} className="fixed inset-x-0 z-50 flex justify-center px-4">
      <motion.nav
        style={{ maxWidth: width }}
        className="glass w-full rounded-full px-4 sm:px-5 py-2.5 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <VideoPlay color="#FFF" size={14} variant="Bold" />
          </span>
          <span className="font-bold tracking-tight">Task.me</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-gray-600 font-medium">
          <a href="#features" className="hover:text-black transition-colors">Features</a>
          <a href="#how" className="hover:text-black transition-colors">How it works</a>
          <a href="#roles" className="hover:text-black transition-colors">For whom</a>
          <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
        </div>
        <Link
          href="/auth/login"
          className="rounded-full bg-black text-white text-sm font-semibold px-4 py-2 hover:bg-gray-800 transition-colors"
        >
          Sign in
        </Link>
      </motion.nav>
    </motion.header>
  );
}

/* ─── Hero ────────────────────────────────────────────────────── */
const HEADLINE = ['Run', 'your', 'studio', 'like', 'a', 'well‑cut', 'scene.'];

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const mockY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const mockRotate = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 14, 0]);
  const mockScale = useTransform(scrollYProgress, [0, 1], [0.94, 1.04]);

  return (
    <section ref={ref} className="relative pt-36 sm:pt-44 pb-16 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="inline-flex items-center gap-2 glass rounded-full pl-1.5 pr-4 py-1.5 text-xs font-semibold text-gray-700"
        >
          <span className="rounded-full bg-black text-white px-2 py-0.5 text-[10px] uppercase tracking-wider">New</span>
          Google Calendar sync &amp; WhatsApp alerts
        </motion.div>

        <h1 className="mt-7 text-[2.6rem] leading-[1.02] sm:text-7xl md:text-[5.5rem] font-bold tracking-[-0.045em] text-gray-950">
          {HEADLINE.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] mr-[0.22em] last:mr-0">
              <motion.span
                className="inline-block"
                initial={{ y: '110%', rotate: 6 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 0.9, ease, delay: 0.15 + i * 0.07 }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.7 }}
          className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto"
        >
          Bookings, crew scheduling, invoices and payouts for creative studios and the freelancers
          who make the work — in one calm, glassy workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.85 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <MagneticButton href="/auth/login">
            Get started free <ArrowRight size={16} color="currentColor" />
          </MagneticButton>
          <a
            href="#how"
            className="rounded-full glass px-6 py-3.5 text-sm font-semibold text-gray-800 hover:bg-white/80 transition-colors"
          >
            See how it works
          </a>
        </motion.div>
      </div>

      <div className="mt-16 sm:mt-20 [perspective:1600px]">
        <motion.div
          style={{ y: mockY, rotateX: mockRotate, scale: mockScale }}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease, delay: 0.5 }}
          className="max-w-5xl mx-auto origin-top"
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}

function MagneticButton({ href, children }: { href: string; children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });
  return (
    <motion.div style={{ x: sx, y: sy }}>
      <Link
        href={href}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - r.left - r.width / 2) * 0.25);
          y.set((e.clientY - r.top - r.height / 2) * 0.35);
        }}
        onMouseLeave={() => { x.set(0); y.set(0); }}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-black/20"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:translate-x-full transition-transform duration-700" />
        <span className="relative flex items-center gap-2">{children}</span>
      </Link>
    </motion.div>
  );
}

function DashboardMock() {
  const rows = [
    { t: 'Nike — Spring campaign', d: 'Mon, 09:00', s: 'Confirmed', dark: true },
    { t: 'Podcast S2 · Ep. 4', d: 'Tue, 14:00', s: 'Pending', dark: false },
    { t: 'Music video — “Neon”', d: 'Thu, 18:30', s: 'Confirmed', dark: true },
  ];
  return (
    <div className="glass rounded-[2rem] p-3 sm:p-4 shadow-2xl">
      <div className="rounded-[1.5rem] bg-white/70 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="card-black p-5 md:row-span-2 flex flex-col justify-between min-h-[180px]">
          <div className="text-xs uppercase tracking-widest text-white/50 font-semibold">Revenue · Nov</div>
          <div>
            <Counter to={48250} className="text-4xl font-bold tracking-tight" prefix="$" />
            <div className="mt-4 flex items-end gap-1.5 h-16">
              {[40, 65, 35, 80, 55, 95, 70].map((h, i) => (
                <div key={i} className="flex-1 h-full flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, ease, delay: 1 + i * 0.06 }}
                    className="w-full rounded-md bg-white/80"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Upcoming bookings</span>
            <span className="text-xs text-gray-400">This week</span>
          </div>
          <div className="space-y-2.5">
            {rows.map((r, i) => (
              <motion.div
                key={r.t}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease, delay: 1.1 + i * 0.1 }}
                className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{r.t}</div>
                  <div className="text-xs text-gray-500">{r.d}</div>
                </div>
                <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0 ${r.dark ? 'badge-confirm' : 'badge-pending'}`}>
                  {r.s}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['A', 'M', 'S', 'J'].map((l) => (
              <span key={l} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 text-xs font-bold flex items-center justify-center">{l}</span>
            ))}
          </div>
          <div className="text-sm"><b>4 crew</b> <span className="text-gray-500">assigned</span></div>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <TickCircle size={22} color="#0A0A0A" variant="Bold" />
          <div className="text-sm"><b>Invoice #1042</b> <span className="text-gray-500">paid</span></div>
        </div>
      </div>
    </div>
  );
}

function Counter({ to, prefix = '', className }: { to: number; prefix?: string; className?: string }) {
  const [val, setVal] = useState(0);
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => {
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1400);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }}
    >
      {prefix}{val.toLocaleString('en-US')}
    </motion.span>
  );
}

/* ─── Marquee ─────────────────────────────────────────────────── */
const TAGS = ['Photo studios', 'Video production', 'Podcast rooms', 'Music labels', 'Agencies', 'Freelance crews', 'Rental houses', 'Post‑production'];

function Marquee() {
  return (
    <div className="relative py-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
      <div className="flex w-max gap-3 animate-[marquee_32s_linear_infinite] motion-reduce:animate-none">
        {[...TAGS, ...TAGS, ...TAGS, ...TAGS].map((t, i) => (
          <span key={i} className="glass rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Features (bento w/ spotlight) ───────────────────────────── */
const FEATURES = [
  { icon: Calendar, title: 'Smart bookings', text: 'Studios, slots and equipment in one calendar — two‑way synced with Google Calendar.', span: 'md:col-span-2' },
  { icon: People, title: 'Crew scheduling', text: 'Invite freelancers, track availability and confirm a crew in a couple of taps.', span: '' },
  { icon: Receipt, title: 'Invoices', text: 'Generate invoices from a booking and follow them from draft to paid.', span: '' },
  { icon: Wallet, title: 'Payments & payouts', text: 'See what clients owe and what you owe your crew — no spreadsheets.', span: '' },
  { icon: MessageText, title: 'WhatsApp alerts', text: 'Codes, confirmations and reminders land where your team actually reads them.', span: '' },
];

function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const bg = useTransform([mx, my], ([x, y]) => `radial-gradient(320px circle at ${x}px ${y}px, rgba(255,255,255,0.9), transparent 70%)`);
  return (
    <motion.div
      variants={reveal}
      whileHover={{ y: -4 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onMouseLeave={() => { mx.set(-200); my.set(-200); }}
      className={`glass relative overflow-hidden rounded-[1.75rem] p-7 ${className}`}
    >
      <motion.div aria-hidden style={{ background: bg }} className="pointer-events-none absolute inset-0" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="px-4 py-24 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Features</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-[-0.035em]">Everything between “we’re booked” and “we’re paid”.</h2>
        </Reveal>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {FEATURES.map(({ icon: Icon, title, text, span }) => (
            <SpotlightCard key={title} className={span}>
              <span className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center">
                <Icon size={20} color="#FFF" variant="Bold" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{text}</p>
            </SpotlightCard>
          ))}
          <SpotlightCard className="card-black !bg-[#0A0A0A] text-white md:col-span-1">
            <div className="text-5xl font-bold tracking-tight">5 → 1</div>
            <p className="mt-2 text-sm text-white/60">One workspace instead of a calendar, a chat, a spreadsheet, an invoicing tool and a notes app.</p>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How it works (scroll‑linked progress line) ──────────────── */
const STEPS = [
  { n: '01', t: 'Create your studio', d: 'Sign in with Google, add your rooms, rates and gear.' },
  { n: '02', t: 'Take a booking', d: 'Pick a slot, attach a client, and it lands in everyone’s calendar.' },
  { n: '03', t: 'Assemble the crew', d: 'Invite creatives — they confirm on web, mobile or via WhatsApp.' },
  { n: '04', t: 'Invoice & pay out', d: 'One click from a wrapped shoot to a sent invoice and settled crew.' },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <section id="how" className="px-4 py-24 scroll-mt-24">
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">How it works</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-[-0.035em]">Four steps. Zero chaos.</h2>
        </Reveal>
        <div ref={ref} className="relative mt-16 pl-10 sm:pl-14">
          <div className="absolute left-[15px] sm:left-[23px] top-2 bottom-2 w-px bg-black/10" />
          <motion.div style={{ scaleY }} className="absolute left-[15px] sm:left-[23px] top-2 bottom-2 w-px bg-black origin-top" />
          <div className="space-y-12">
            {STEPS.map((s) => (
              <Reveal key={s.n} className="relative">
                <span className="absolute -left-10 sm:-left-14 top-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black text-white text-xs sm:text-sm font-bold flex items-center justify-center ring-8 ring-[#EAEAEF]/70">
                  {s.n}
                </span>
                <div className="glass rounded-[1.5rem] p-6">
                  <h3 className="text-xl font-semibold">{s.t}</h3>
                  <p className="mt-1.5 text-gray-600">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Roles (tabbed, layout animation) ────────────────────────── */
const ROLES = {
  studio: {
    icon: Building,
    label: 'For studios',
    points: ['Unified booking calendar', 'Crew rosters and availability', 'Invoices, payments and reports', 'Admin dashboard with revenue at a glance'],
  },
  creative: {
    icon: Brush,
    label: 'For creatives',
    points: ['All your gigs in one place', 'Accept or decline with one tap', 'Know when and what you’ll be paid', 'Mobile app with WhatsApp sign‑in'],
  },
} as const;

function Roles() {
  const [tab, setTab] = useState<keyof typeof ROLES>('studio');
  const role = ROLES[tab];
  return (
    <section id="roles" className="px-4 py-24 scroll-mt-24">
      <Reveal className="max-w-4xl mx-auto glass rounded-[2.25rem] p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.035em]">Built for both sides of the shoot.</h2>
          <div className="relative flex rounded-full bg-black/5 p-1 self-start">
            {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === k ? 'text-white' : 'text-gray-600'}`}
              >
                {tab === k && (
                  <motion.span layoutId="role-pill" className="absolute inset-0 -z-10 rounded-full bg-black" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                {ROLES[k].label}
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.ul
            key={tab}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            variants={stagger}
            className="mt-8 grid sm:grid-cols-2 gap-3"
          >
            {role.points.map((p) => (
              <motion.li key={p} variants={reveal} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-4 text-sm font-medium">
                <TickCircle size={20} color="#0A0A0A" variant="Bold" />
                {p}
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </Reveal>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────── */
const FAQS = [
  { q: 'Is Task.me free to try?', a: 'Yes. Sign in with Google and set up your studio — no card required.' },
  { q: 'Why does Task.me ask for Google Calendar access?', a: 'To pull your existing events in, so bookings never clash with what is already on your calendar. We only use it for scheduling and never share it.' },
  { q: 'How do WhatsApp codes work?', a: 'When you add a phone number we send a one‑time code over WhatsApp to confirm it belongs to you. We never message you for marketing.' },
  { q: 'Is there a mobile app?', a: 'Yes — creatives can manage gigs from iOS and Android. It is rolling out soon.' },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-4 py-24 scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.035em]">Questions, answered.</h2>
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q}>
              <div className="glass rounded-[1.5rem] overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-semibold"
                >
                  {f.q}
                  <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="shrink-0">
                    <Add size={20} color="#0A0A0A" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                    >
                      <p className="px-6 pb-5 text-gray-600">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA + Footer ────────────────────────────────────────────── */
function Cta() {
  return (
    <section className="px-4 py-24">
      <Reveal className="max-w-5xl mx-auto card-black !rounded-[2.5rem] relative overflow-hidden px-6 py-16 sm:py-20 text-center">
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.12),transparent_40%)] motion-reduce:hidden"
        />
        <div className="relative">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em]">Your next shoot,<br />already organised.</h2>
          <p className="mt-5 text-white/60 max-w-xl mx-auto">Join studios that swapped spreadsheets and group chats for one workspace.</p>
          <Link href="/auth/login" className="mt-9 inline-flex items-center gap-2 rounded-full bg-white text-black px-7 py-3.5 text-sm font-semibold hover:bg-gray-100 transition-colors">
            Start now <ArrowRight size={16} color="currentColor" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="px-4 pb-10">
      <div className="max-w-6xl mx-auto glass rounded-[1.75rem] px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
            <VideoPlay color="#FFF" size={12} variant="Bold" />
          </span>
          <span className="font-semibold text-gray-900">Task.me</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex gap-6">
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
          <Link href="/support" className="hover:text-black">Support</Link>
        </nav>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <main className="landing relative">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <Roles />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}
