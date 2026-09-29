import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
gsap.registerPlugin(ScrollTrigger, Flip);
export { gsap, ScrollTrigger, Flip };
export const reducedMotion = matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
export const desktop = matchMedia("(min-width: 1024px)").matches;
export const lenis =
  !reducedMotion && desktop
    ? new Lenis({
        duration: 1.05,
        smoothWheel: true,
        autoRaf: false,
        prevent: (node) => node.closest("dialog"),
      })
    : null;
if (lenis) {
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
export function scrollTo(target) {
  if (lenis) lenis.scrollTo(target, { offset: -25 });
  else document.querySelector(target)?.scrollIntoView({ behavior: "auto" });
}
export function initIntro(pathData) {
  const intro = document.querySelector("#intro"),
    path = document.querySelector("#intro-path");
  let seen = false;
  try {
    seen = sessionStorage.getItem("f1-intro") === "1";
    sessionStorage.setItem("f1-intro", "1");
  } catch {}
  if (reducedMotion || !desktop || seen) {
    intro.remove();
    return;
  }
  path.setAttribute("d", pathData);
  const l = path.getTotalLength();
  const done = () => {
    intro.remove();
    lenis?.start();
  };
  lenis?.stop();
  const tl = gsap.timeline({ onComplete: done });
  tl.fromTo(
    path,
    { strokeDasharray: l, strokeDashoffset: l },
    { strokeDashoffset: 0, duration: 1.35, ease: "power2.inOut" },
  )
    .from(
      ".intro-inner h1 span",
      { y: 70, opacity: 0, stagger: 0.1, duration: 0.65 },
      0.5,
    )
    .to(
      ".load-line i",
      { width: "100%", duration: 1.6, ease: "power1.inOut" },
      0,
    )
    .to(intro, { opacity: 0, duration: 0.45 }, 1.8);
  document.querySelector("#skip-intro").onclick = () => {
    tl.kill();
    done();
  };
  // An animation must never permanently block the application.
  setTimeout(() => {
    if (intro.isConnected) {
      tl.kill();
      done();
    }
  }, 3500);
}
export function initCursor() {
  if (reducedMotion || !desktop || !matchMedia("(pointer:fine)").matches)
    return;
  const cursor = document.querySelector("#cursor"),
    ring = cursor.querySelector("i"),
    coords = cursor.querySelector("small");
  document.documentElement.classList.add("custom-cursor");
  const x = gsap.quickSetter(cursor, "x", "px"),
    y = gsap.quickSetter(cursor, "y", "px");
  const rx = gsap.quickTo(ring, "x", { duration: 0.22 }),
    ry = gsap.quickTo(ring, "y", { duration: 0.22 });
  let previous = { x: 0, y: 0 };
  window.addEventListener(
    "pointermove",
    (e) => {
      x(e.clientX);
      y(e.clientY);
      cursor.style.opacity = "1";
      coords.textContent = `X ${String(Math.round(e.clientX)).padStart(4, "0")}  Y ${String(Math.round(e.clientY)).padStart(4, "0")}`;
      const target = e.target.closest('button,a,select,input,[role="button"]');
      cursor.classList.toggle("target", !!target);
      if (target && target.getBoundingClientRect().width < 280) {
        const r = target.getBoundingClientRect();
        rx((r.x + r.width / 2 - e.clientX) * 0.12);
        ry((r.y + r.height / 2 - e.clientY) * 0.12);
      } else {
        rx(0);
        ry(0);
      }
      previous = { x: e.clientX, y: e.clientY };
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => (cursor.style.opacity = "0"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      cursor.style.opacity = "0";
      document.documentElement.classList.remove("custom-cursor");
    }
  });
  document.addEventListener(
    "pointermove",
    () => document.documentElement.classList.add("custom-cursor"),
    { passive: true },
  );
  // Native dialogs enter the top layer. Keep the reticle in that same layer.
  document.addEventListener("dialog-cursor", (e) => {
    (e.detail || document.body).append(cursor);
  });
}
let cardsContext;
export function animateCards() {
  cardsContext?.revert();
  if (reducedMotion || !desktop) return;
  cardsContext = gsap.context(() => {
    gsap.utils.toArray(".circuit-card").forEach((card) => {
      const path = card.querySelector(".track-outline");
      if (path) {
        const l = path.getTotalLength();
        gsap.fromTo(
          path,
          { strokeDasharray: l, strokeDashoffset: l },
          {
            strokeDashoffset: 0,
            duration: 1.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 95%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }
      gsap.fromTo(
        card.querySelector(".card-map"),
        { y: 8 },
        {
          y: -8,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        },
      );
    });
  });
  ScrollTrigger.refresh();
}
export function initScroll() {
  if (reducedMotion || !desktop) return;
  ScrollTrigger.create({
    trigger: "#featured",
    start: "top 22px",
    end: "+=180",
    pin: true,
    pinSpacing: true,
  });
  const skew = gsap.quickTo("#circuits", "skewY", {
    duration: 0.5,
    ease: "power3.out",
  });
  const resetSkew = gsap.delayedCall(0.15, () => skew(0)).pause();
  ScrollTrigger.create({
    onUpdate: (self) => {
      skew(gsap.utils.clamp(-0.45, 0.45, self.getVelocity() / -3500));
      resetSkew.restart(true);
    },
  });
}
