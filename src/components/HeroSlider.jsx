import { useEffect, useState } from "react";

const BookingArt = () => (
  <svg className="slide-img" viewBox="0 0 320 240" fill="none" aria-hidden="true">
    <circle cx="160" cy="120" r="100" fill="#22E4C5" opacity=".08" />
    <rect x="50" y="40" width="220" height="170" rx="22" fill="#0A1226" stroke="#22E4C5" strokeOpacity=".4" />
    <rect x="50" y="40" width="220" height="44" rx="22" fill="#22E4C5" />
    <rect x="50" y="62" width="220" height="22" fill="#22E4C5" />
    <rect x="90" y="28" width="8" height="26" rx="4" fill="#E8EEFF" />
    <rect x="222" y="28" width="8" height="26" rx="4" fill="#E8EEFF" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3, 4].map((c) => (
        <circle key={`${r}-${c}`} cx={84 + c * 38} cy={112 + r * 30} r="8" fill="#2A3F66" />
      ))
    )}
    <circle cx="160" cy="142" r="15" fill="#22E4C5" />
    <path d="M153 142l5 5 9-10" stroke="#04211C" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="254" cy="192" r="24" fill="#0E2247" stroke="#22E4C5" />
    <path d="M254 178v14l9 6" stroke="#22E4C5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RecordsArt = () => (
  <svg className="slide-img" viewBox="0 0 320 240" fill="none" aria-hidden="true">
    <circle cx="160" cy="120" r="100" fill="#22E4C5" opacity=".08" />
    <rect x="70" y="44" width="190" height="150" rx="20" fill="#2A3F66" opacity=".5" transform="rotate(6 165 119)" />
    <rect x="50" y="52" width="210" height="150" rx="22" fill="#0A1226" stroke="#22E4C5" strokeOpacity=".4" />
    <circle cx="92" cy="98" r="24" fill="#22E4C5" />
    <circle cx="92" cy="92" r="8" fill="#04211C" />
    <path d="M77 114c3-10 27-10 30 0" stroke="#04211C" strokeWidth="5" strokeLinecap="round" />
    <rect x="130" y="84" width="100" height="10" rx="5" fill="#2A3F66" />
    <rect x="130" y="104" width="64" height="10" rx="5" fill="#1B2A48" />
    <path d="M66 168h40l10-22 18 40 14-28 8 10h60" stroke="#22E4C5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M252 30l20 8v14c0 14-9 24-20 28-11-4-20-14-20-28V38z" fill="#0E2247" stroke="#22E4C5" />
    <path d="M243 54l6 6 11-12" stroke="#22E4C5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DoctorsArt = () => (
  <svg className="slide-img" viewBox="0 0 320 240" fill="none" aria-hidden="true">
    <circle cx="160" cy="120" r="100" fill="#22E4C5" opacity=".08" />
    <rect x="176" y="50" width="110" height="140" rx="18" fill="#0A1226" stroke="#22E4C5" strokeOpacity=".4" />
    <rect x="190" y="68" width="82" height="18" rx="9" fill="#22E4C5" />
    <rect x="190" y="96" width="60" height="18" rx="9" fill="#2A3F66" />
    <rect x="190" y="124" width="82" height="18" rx="9" fill="#22E4C5" opacity=".55" />
    <rect x="190" y="152" width="50" height="18" rx="9" fill="#2A3F66" />
    <circle cx="98" cy="90" r="26" fill="#F1D2B8" />
    <path d="M52 205c0-40 22-64 46-64s46 24 46 64z" fill="#E8EEFF" />
    <path d="M82 144v12a16 16 0 0 0 32 0v-12" stroke="#22E4C5" strokeWidth="4" strokeLinecap="round" />
    <path d="M124 168v16M116 176h16" stroke="#22E4C5" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const slides = [
  {
    title: "Book an appointment in under a minute",
    text: "Pick a patient, choose a doctor, set a time. No double bookings.",
    cta: "New appointment",
    to: "/appointments",
    Art: BookingArt,
  },
  {
    title: "Every patient record in one place",
    text: "Name, age, contact and address, protected by role-based login.",
    cta: "Add a patient",
    to: "/patients",
    Art: RecordsArt,
  },
  {
    title: "See every doctor's day at a glance",
    text: "Add doctors with their specialty and watch their day fill up.",
    cta: "Add a doctor",
    to: "/doctors",
    Art: DoctorsArt,
  },
];

export default function HeroSlider({ onNavigate }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (n) => setI((n + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(i + 1), 5000);
    return () => clearTimeout(t);
  }, [i, paused]);

  return (
    <section
      className={`hero ${paused ? "paused" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, n) => (
        <article key={n} className={`slide ${n === i ? "on" : ""}`}>
          <div>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            <button className="cta" onClick={() => onNavigate?.(s.to)}>
              {s.cta}
            </button>
          </div>
          <s.Art />
        </article>
      ))}

      <div className="hero-ctrl">
        <div className="dots">
          {slides.map((_, n) => (
            <button
              key={n}
              aria-label={`Go to slide ${n + 1}`}
              className={`dot ${n < i ? "done" : ""} ${n === i ? "now" : ""}`}
              onClick={() => go(n)}
            >
              <span className="fill" key={n === i ? `a${i}` : `b${n}`} />
            </button>
          ))}
        </div>
        <div className="arrows">
          <button aria-label="Previous" onClick={() => go(i - 1)}>‹</button>
          <button aria-label="Next" onClick={() => go(i + 1)}>›</button>
        </div>
      </div>
    </section>
  );
}