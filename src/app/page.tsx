import {
  ArrowRight,
  BedDouble,
  Brush,
  Dumbbell,
  KeyRound,
  MapPin,
  Phone,
  ShieldCheck,
  Sofa,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Logo } from "@/components/brand/logo";
import { SiteHeader } from "@/components/marketing/site-header";
import { RoomShowcase } from "@/components/marketing/room-showcase";
import { Reveal } from "@/components/marketing/reveal";
import { RoomsSection } from "@/components/marketing/rooms-section";
import { StatsStrip } from "@/components/marketing/stats-strip";

const amenities = [
  { icon: Wifi, title: "High-speed Wi-Fi" },
  { icon: UtensilsCrossed, title: "Home-style mess" },
  { icon: ShieldCheck, title: "24/7 security" },
  { icon: Brush, title: "Daily housekeeping" },
  { icon: Sofa, title: "Study & lounges" },
  { icon: WashingMachine, title: "Laundry service" },
  { icon: Zap, title: "Power backup" },
  { icon: Dumbbell, title: "Gym & recreation" },
];

const steps = [
  { icon: KeyRound, n: "01", title: "Apply online", desc: "Create your account and request a room in minutes." },
  { icon: ShieldCheck, n: "02", title: "Get allocated", desc: "We review and assign the room that fits you best." },
  { icon: BedDouble, n: "03", title: "Move in", desc: "Pay online, collect your keys and settle in." },
];

const gallery = [
  { label: "Resident rooms", image: "/images/room_double.png", span: "sm:col-span-2 sm:row-span-2" },
  { label: "Mess hall", image: "/images/mess_hall.png", span: "" },
  { label: "Study lounge", image: "/images/study_lounge.png", span: "" },
  { label: "Courtyard", image: "/images/courtyard.png", span: "" },
  { label: "Common room", image: "/images/common_room.png", span: "" },
];

const testimonials = [
  { quote: "Moving in felt effortless. Clean rooms, great food, and it genuinely feels like home.", name: "Hamza Iqbal", meta: "Computer Science" },
  { quote: "Security and housekeeping are top-notch. My parents stopped worrying day one.", name: "Fatima Noor", meta: "Electrical Eng." },
  { quote: "The lounges and Wi-Fi are perfect for exam season. Best decision of my degree.", name: "Mariam Sheikh", meta: "Architecture" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#1c1a18]">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-8 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8 lg:pt-24">
          <div>
            <p className="animate-rise text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Student hostel · 2026 intake
            </p>
            <h1
              className="animate-rise mt-5 font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.02em] text-[#181715] sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "60ms" }}
            >
              A place that
              <br />
              feels like <span className="italic text-gold">home</span>.
            </h1>
            <p
              className="animate-rise mt-6 max-w-md text-lg leading-relaxed text-[#6f6a63]"
              style={{ animationDelay: "120ms" }}
            >
              Comfortable rooms, home-style meals and a community that looks out
              for each other. Find your room and move in with ease.
            </p>

            {/* Quick Feature Pillars */}
            <div
              className="animate-rise mt-8 grid grid-cols-2 gap-4 border-t border-[#ece7df] pt-6"
              style={{ animationDelay: "150ms" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <Wifi className="size-4" />
                </div>
                <span className="text-sm font-medium text-[#3a3731]">High-speed Wi-Fi</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <UtensilsCrossed className="size-4" />
                </div>
                <span className="text-sm font-medium text-[#3a3731]">Home-style meals</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="text-sm font-medium text-[#3a3731]">24/7 Security</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <Brush className="size-4" />
                </div>
                <span className="text-sm font-medium text-[#3a3731]">Housekeeping</span>
              </div>
            </div>

            <div
              className="animate-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "180ms" }}
            >
              <ButtonLink
                href="/rooms"
                size="lg"
                className="rounded-full bg-gold px-7 text-gold-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-md"
              >
                Browse rooms <ArrowRight className="size-4" />
              </ButtonLink>
              <a
                href="#rooms"
                className="inline-flex items-center gap-1.5 px-2 text-sm font-semibold text-[#1c1a18] underline-offset-4 hover:underline"
              >
                Explore rooms <ArrowRight className="size-4 text-gold" />
              </a>
            </div>
            <p
              className="animate-rise mt-8 text-sm text-[#8a857d]"
              style={{ animationDelay: "240ms" }}
            >
              No booking fee · Move in within days · 500+ residents
            </p>
          </div>

          <div className="animate-rise relative lg:ml-4" style={{ animationDelay: "200ms" }}>
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-gold/10 blur-2xl lg:-inset-8" />

            {/* Premium picture frame */}
            <div className="relative overflow-hidden rounded-[2rem] border border-[#ece7df] bg-[#faf9f6] p-2 shadow-2xl shadow-gold/5">
              <div className="overflow-hidden rounded-[1.75rem]">
                <img
                  src="/images/hero_hostel.png"
                  alt="Second Home Hostel Life"
                  className="h-[320px] w-full object-cover transition-transform duration-700 hover:scale-102 sm:h-[400px] lg:h-[455px]"
                />
              </div>

              {/* Overlay badges */}
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#1c1a18] shadow-md border border-[#ece7df]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                </span>
                Admissions open for 2026
              </div>

              <div className="absolute bottom-6 right-6 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-sm border border-[#ece7df] max-w-[200px]">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-[#1c1a18]">4.9</span>
                  <div className="flex text-gold">
                    <span className="text-xs">★</span>
                    <span className="text-xs">★</span>
                    <span className="text-xs">★</span>
                    <span className="text-xs">★</span>
                    <span className="text-xs">★</span>
                  </div>
                </div>
                <p className="mt-1 text-xs font-medium text-[#6f6a63]">Rated by 500+ students in Lahore</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats (live) ── */}
        <section className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <StatsStrip />
        </section>

        {/* ── Amenities ── */}
        <section id="amenities" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Reveal className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Everything you need
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#181715] sm:text-4xl">
              Comfort, care and community
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {amenities.map((a, i) => (
              <Reveal key={a.title} delay={i * 60} className="group">
                <a.icon className="size-6 text-gold" strokeWidth={1.5} />
                <h3 className="mt-4 text-base font-semibold text-[#1c1a18]">{a.title}</h3>
                <div className="mt-3 h-px w-10 bg-gold/40 transition-all duration-300 group-hover:w-16" />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Rooms & pricing (live) ── */}
        <RoomsSection />

        {/* ── Safety & Wellbeing ── */}
        <section id="safety" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <Reveal className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Safety & Peace of Mind
                </p>
                <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#181715] sm:text-4xl">
                  Your safety is our absolute priority
                </h2>
              </div>
              <p className="text-[#6f6a63] leading-relaxed">
                We understand that moving away from home is a big step for both students and parents. That's why we have built a multi-layered security and support ecosystem to ensure a safe, secure, and stress-free living environment.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[#1c1a18]">24/7 Guarded & Monitored Access</h4>
                    <p className="mt-1 text-sm text-[#6f6a63]">Round-the-clock security personnel, active CCTV in all corridors and common spaces, and biometric access gates.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <KeyRound className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[#1c1a18]">On-Site Wardens & Separate Wings</h4>
                    <p className="mt-1 text-sm text-[#6f6a63]">Dedicated resident wardens available at all times. Strictly separated, secured blocks for male and female students.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[#1c1a18]">Emergency & Medical Support</h4>
                    <p className="mt-1 text-sm text-[#6f6a63]">Quick first-aid response, tie-ups with leading nearby hospitals, and emergency transport vehicle on standby.</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="relative lg:pl-6">
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-gold/5 blur-2xl" />
              <div className="overflow-hidden rounded-[2rem] border border-[#ece7df] shadow-lg">
                <img
                  src="/images/study_lounge.png"
                  alt="Safe and focused environment at Second Home"
                  className="h-[300px] w-full object-cover sm:h-[380px] lg:h-[420px]"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Gallery ── */}
        <section id="gallery" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Reveal className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Life at Second Home
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#181715] sm:text-4xl">
              Take a look around
            </h2>
          </Reveal>

          <Reveal className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-4 sm:grid-cols-3 sm:auto-rows-[220px]">
            {gallery.map((g) => (
              <div
                key={g.label}
                className={`group relative flex items-end overflow-hidden rounded-2xl border border-[#ece7df] bg-muted ${g.span}`}
              >
                <img
                  src={g.image}
                  alt={g.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <span className="relative z-10 m-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#1c1a18] shadow-sm">
                  <MapPin className="size-3 text-gold" /> {g.label}
                </span>
              </div>
            ))}
          </Reveal>
        </section>

        {/* ── How it works ── */}
        <section className="border-y border-[#ece7df] bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
            <Reveal className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                How it works
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#181715] sm:text-4xl">
                Move in in three steps
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <span className="font-heading text-5xl font-semibold text-gold/25">{s.n}</span>
                  <h3 className="mt-4 flex items-center gap-2 text-lg font-semibold text-[#1c1a18]">
                    <s.icon className="size-5 text-gold" strokeWidth={1.6} /> {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6f6a63]">{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Reveal className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Loved by residents
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#181715] sm:text-4xl">
              In their words
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <figure className="flex h-full flex-col rounded-2xl border border-[#ece7df] bg-white p-7">
                  <span className="font-heading text-4xl leading-none text-gold">&ldquo;</span>
                  <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-[#3a3731]">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6 border-t border-[#ece7df] pt-4">
                    <p className="text-sm font-semibold text-[#1c1a18]">{t.name}</p>
                    <p className="text-xs text-[#8a857d]">{t.meta}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── FAQ Section (New) ── */}
        <section id="faq" className="border-t border-[#ece7df] bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
            <Reveal className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Have Questions?
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#181715] sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[#6f6a63]">
                Got a question about booking, facilities, or policies? We've got answers.
              </p>
            </Reveal>

            <div className="mt-12 space-y-4">
              {[
                {
                  q: "What is included in the term fee?",
                  a: "Our fee is all-inclusive! It covers your fully-furnished room, three daily home-style meals in the mess, high-speed Wi-Fi, laundry service, daily room cleaning, power backup (UPS/generators), and 24/7 security. No hidden charges."
                },
                {
                  q: "Can I request a roommate of my choice?",
                  a: "Yes, absolutely! During the online application process, you can specify the name of the student you'd like to share a room with. We do our best to match friends together, provided you apply around the same time."
                },
                {
                  q: "Is there a curfew or attendance policy?",
                  a: "Yes, for the safety and security of all residents, we maintain standard curfew hours (e.g., check-in by 10:00 PM). Extensions are granted with prior warden approval or upon direct parental authorization through our student portal."
                },
                {
                  q: "What medical assistance is available on-campus?",
                  a: "We have fully-stocked first-aid kits on every floor and a dedicated sick room. We have immediate tie-ups and quick transport arrangements with top-tier hospitals located within a 5-minute radius of the hostel."
                },
                {
                  q: "How does the laundry service work?",
                  a: "Residents get their laundry washed, ironed, and returned twice a week. You will be provided with a personalized laundry bag, and the pickup/delivery is managed right at your room door by our housekeeping team."
                }
              ].map((faq, idx) => (
                <Reveal key={idx} delay={idx * 50}>
                  <details className="group rounded-2xl border border-[#ece7df] bg-[#faf9f6] p-6 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:bg-white open:shadow-md">
                    <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-base font-semibold text-[#1c1a18]">
                      <span>{faq.q}</span>
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold transition-transform duration-300 group-open:rotate-180">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="size-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-4 text-sm leading-relaxed text-[#6f6a63] border-t border-[#ece7df] pt-4">
                      {faq.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <Reveal className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#f3dcae] via-[#eccf95] to-[#c9974a] px-6 py-16 text-center">
            <h2 className="mx-auto max-w-2xl font-heading text-3xl font-semibold tracking-tight text-[#231d10] sm:text-4xl">
              Ready to find your second home?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[#5a4a28]">
              Rooms for the 2026 intake are filling fast. Apply today and secure your spot.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/apply"
                size="lg"
                className="rounded-full bg-[#1c1a18] px-7 text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#1c1a18]/90"
              >
                Apply for a room
              </ButtonLink>
              <ButtonLink
                href="/login"
                size="lg"
                variant="outline"
                className="rounded-full border-[#231d10]/25 bg-transparent text-[#231d10] hover:bg-[#231d10]/5"
              >
                Resident login
              </ButtonLink>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer id="footer" className="border-t border-[#ece7df] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div className="max-w-xs">
              <Logo showTagline />
              <p className="mt-3 text-sm text-[#6f6a63]">
                A modern student hostel where comfort, safety and community come together.
              </p>
              <div className="mt-4 space-y-1.5 text-sm text-[#6f6a63]">
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-gold" /> 24 University Road, Lahore
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-gold" /> +92 42 111 000 222
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <FooterCol title="Explore" links={["Rooms", "Amenities", "Gallery", "Apply"]} />
              <FooterCol title="Residents" links={["Resident login", "Pay fees", "Mess menu", "Support"]} />
              <FooterCol title="Hostel" links={["About us", "Rules", "Careers", "Contact"]} />
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#ece7df] pt-6 text-sm text-[#8a857d] sm:flex-row">
            <p>© 2026 Second Home Hostel.</p>
            <p>Your home away from home.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#1c1a18]">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-[#6f6a63] transition-colors hover:text-gold">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
