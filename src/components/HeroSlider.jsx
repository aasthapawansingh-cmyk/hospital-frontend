import { useEffect, useState } from "react";

const slides = [
  { title: "Book an appointment in under a minute",
    text: "Pick a patient, choose a doctor, set a time. No double bookings.",
    cta: "New appointment", to: "/appointments" },
  { title: "Every patient record in one place",
    text: "Name, age, contact and address, protected by role-based login.",
    cta: "Add a patient", to: "/patients" },
  { title: "See every doctor's day at a glance",
    text: "Add doctors with their specialty and watch their day fill up.",
    cta: "Add a doctor", to: "/doctors" },
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
            <button className="cta" onClick={() => onNavigate?.(s.to)}>{s.cta}</button>
          </div>
          <svg className="art" viewBox="0 0 320 260" fill="none" aria-hidden="true">
            <rect x="30" y="34" width="260" height="192" rx="26" fill="#fff" />
            <rect x="30" y="34" width="260" height="52" rx="26" fill="#22E4C5" />
            <rect x="30" y="60" width="260" height="26" fill="#22E4C5" />
            <rect x="70" y="110" width="90" height="26" rx="13" fill="#22E4C5" />
            <rect x="130" y="150" width="120" height="26" rx="13" fill="#B7C7D8" />
            <rect x="90" y="190" width="80" height="20" rx="10" fill="#22E4C5" opacity=".6" />
          </svg>
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