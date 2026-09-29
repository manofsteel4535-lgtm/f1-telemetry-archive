import "./styles.css";
import circuits from "./data/circuits.json";
import { profiles, featuredIds } from "./data/profiles.js";
import { esc, mapMarkup } from "./maps.js";
import {
  gsap,
  ScrollTrigger,
  lenis,
  reducedMotion,
  initIntro,
  initCursor,
  initScroll,
  animateCards,
  scrollTo,
} from "./motion.js";
import { openCircuit, f1Records } from "./telemetry.js";
const $ = (s) => document.querySelector(s),
  byId = new Map(circuits.map((c) => [c.id, c]));
let period = "all",
  visible = 12,
  featureIndex = 0;
const countries = [...new Set(circuits.map((c) => c.country))].sort();
$("#total-count").textContent = circuits.length;
$("#country-count").textContent = countries.length;
$("#archive-count").textContent = circuits.length;
$("#country").insertAdjacentHTML(
  "beforeend",
  countries.map((c) => `<option>${esc(c)}</option>`).join(""),
);
function showFeature() {
  const c = byId.get(featuredIds[featureIndex]),
    p = profiles[c.id];
  $("#focus-country").textContent =
    `${p.flag} / ${c.country.toUpperCase()} · EST. ${c.first}`;
  $("#focus-name").innerHTML = esc(p.short).replace("\n", "<br>");
  $("#focus-description").textContent = p.description;
  $("#focus-coordinate").textContent = p.coordinate;
  $("#feature-number").textContent =
    `${String(featureIndex + 1).padStart(2, "0")} / 06`;
  $("#focus-tag").textContent = p.tag;
  $("#focus-metrics").innerHTML =
    `<div class="metric"><strong>${c.length.toFixed(3)}<small>KM</small></strong><span>CIRCUIT LENGTH</span></div><div class="metric"><strong>${c.turns}</strong><span>CORNERS</span></div><div class="metric"><strong>${c.first}</strong><span>FIRST GRAND PRIX</span></div>`;
  $("#focus-map").innerHTML = mapMarkup(c, {
    sectors: true,
    id: "feature-path",
  });
  if (!reducedMotion) {
    gsap.fromTo(
      "#focus-map svg",
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.6 },
    );
    const path = $("#feature-path");
    if (path) {
      const l = path.getTotalLength();
      gsap.fromTo(
        path,
        { strokeDasharray: l, strokeDashoffset: l },
        { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" },
      );
    }
  }
}
$("#next-feature").onclick = () => {
  featureIndex = (featureIndex + 1) % featuredIds.length;
  showFeature();
};
$("#prev-feature").onclick = () => {
  featureIndex = (featureIndex + featuredIds.length - 1) % featuredIds.length;
  showFeature();
};
$("#open-feature").onclick = () =>
  openCircuit(byId.get(featuredIds[featureIndex]), $("#focus-map"));
function matchesEra(c, year) {
  if (year === "all") return true;
  const start = Number(year),
    end = start + 9;
  return c.seasons.split(",").some((part) => {
    const years = part.match(/\d{4}/g)?.map(Number) || [];
    return years.length === 2
      ? years[0] <= end && years[1] >= start
      : years[0] >= start && years[0] <= end;
  });
}
function normalize(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function card(c, i) {
  const p = profiles[c.id];
  const short =
    p?.short.replace("\n", " ") ||
    c.name.replace(/ Circuit$| International Racing Course$/, "");
  const record = f1Records(c)[0]?.text.match(/\d+:\d+(?:\.\d+)?/)?.[0];
  return `<button class="circuit-card" data-id="${c.id}" aria-label="Explore ${esc(c.name)}"><div class="card-top"><span>${esc(c.country.toUpperCase())}</span><span class="card-era">${c.status === "recent" ? "RECENT" : "HISTORIC"}</span></div><div class="card-map">${mapMarkup(c, { id: "card-" + c.id })}</div><div class="card-info"><h3>${esc(short)}</h3><p>${c.first} — ${c.last}${p ? " · SIM GUIDE" : ""}</p></div><div class="card-bottom"><span>${c.length.toFixed(3)}<small>KM</small></span><span>${c.turns}<small>TURNS</small></span><span title="Published F1 race reference; see configuration in dossier">${record || "—"}<small>REF.</small></span><span class="card-open">⊕</span></div></button>`;
}
function render() {
  const q = normalize($("#search").value.trim()),
    country = $("#country").value,
    era = $("#era").value,
    sort = $("#sort").value;
  let filtered = circuits.filter(
    (c) =>
      (period === "all" || c.status === period) &&
      (country === "all" || c.country === country) &&
      matchesEra(c, era) &&
      normalize(
        c.name +
          " " +
          c.country +
          " " +
          c.location +
          (c.id === "nurburgring" ? " Nordschleife green hell" : ""),
      ).includes(q),
  );
  filtered.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "oldest"
        ? a.first - b.first || a.name.localeCompare(b.name)
        : sort === "length"
          ? b.length - a.length
          : (featuredIds.includes(a.id) ? featuredIds.indexOf(a.id) : -1) === -1
            ? featuredIds.includes(b.id)
              ? 1
              : a.name.localeCompare(b.name)
            : featuredIds.includes(b.id)
              ? featuredIds.indexOf(a.id) - featuredIds.indexOf(b.id)
              : -1,
  );
  $("#circuits").innerHTML = filtered.slice(0, visible).map(card).join("");
  $("#results-count").textContent = `${filtered.length} CIRCUITS`;
  $("#empty").hidden = filtered.length > 0;
  $("#load-more").hidden = filtered.length <= visible;
  $("#load-more").innerHTML =
    `LOAD MORE CIRCUITS <span>+ ${Math.min(12, Math.max(0, filtered.length - visible))}</span>`;
  $("#reset").hidden =
    period === "all" && country === "all" && era === "all" && !q;
  animateCards();
}
function reset() {
  period = "all";
  visible = 12;
  $("#search").value = "";
  $("#country").value = "all";
  $("#era").value = "all";
  document
    .querySelectorAll("[data-period]")
    .forEach((b) => b.classList.toggle("selected", b.dataset.period === "all"));
  render();
}
$("#circuits").onclick = (e) => {
  const el = e.target.closest("[data-id]");
  if (el) openCircuit(byId.get(el.dataset.id), el);
};
$(".filter-tabs").onclick = (e) => {
  const btn = e.target.closest("[data-period]");
  if (!btn) return;
  period = btn.dataset.period;
  visible = 12;
  document
    .querySelectorAll("[data-period]")
    .forEach((b) => b.classList.toggle("selected", b === btn));
  render();
};
["#search", "#country", "#era", "#sort"].forEach((s) =>
  $(s).addEventListener(s === "#search" ? "input" : "change", () => {
    visible = 12;
    render();
  }),
);
$("#load-more").onclick = () => {
  visible += 12;
  render();
};
$("#reset").onclick = reset;
$("#empty-reset").onclick = reset;
function setView(list) {
  $("#circuits").classList.toggle("list", list);
  $("#grid-view").classList.toggle("selected", !list);
  $("#list-view").classList.toggle("selected", list);
  $("#grid-view").setAttribute("aria-pressed", !list);
  $("#list-view").setAttribute("aria-pressed", list);
  ScrollTrigger.refresh();
}
$("#grid-view").onclick = () => setView(false);
$("#list-view").onclick = () => setView(true);
document.querySelectorAll('a[href="#archive"]').forEach(
  (el) =>
    (el.onclick = (e) => {
      e.preventDefault();
      scrollTo("#archive");
    }),
);
document.querySelectorAll('a[href="#"]').forEach(
  (el) =>
    (el.onclick = (e) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo(0, 0);
    }),
);
$("#era-nav").onclick = () => {
  scrollTo("#archive");
  $("#era").focus({ preventScroll: true });
};
const info = $("#info-dialog");
let infoOrigin;
function openInfo() {
  infoOrigin = document.activeElement;
  $("#info-content").innerHTML =
    `<p class="eyebrow">INDEPENDENT / SOURCE-LED / SIM-FOCUSED</p><h2 id="info-title">THE MEMORY OF EVERY LAP.</h2><p>A desktop archive of all ${circuits.length} venues in the Formula 1 World Championship circuit registry, from 1950 through September 2026. Indianapolis is included because its 500-mile race counted toward the championship from 1950 to 1960.</p><p>Search by circuit, country or decade. Each venue opens a dossier with its map, published race records and configuration history. Six featured circuits include illustrative sim-racing corner notes.</p><h3>Know what you are looking at</h3><ul><li>Registry and history: <a href="https://en.wikipedia.org/wiki/List_of_Formula_One_circuits" target="_blank" rel="noopener noreferrer">Wikipedia circuit registry</a>, with linked per-circuit sources.</li><li>40 vector plans: <a href="https://github.com/bacinger/f1-circuits" target="_blank" rel="noopener noreferrer">Tomislav Bacinger’s f1-circuits</a>, MIT licensed. 160 historical diagrams: <a href="https://github.com/julesr0y/f1-circuits-svg" target="_blank" rel="noopener noreferrer">ROY Jules (julesr0y)</a>, CC BY 4.0. Colours adapted for the dark theme.</li><li>Race records are separated by source configuration. Outright qualifying records require separate verification.</li><li>Gear and speed ranges, marker positions, sectors and moving lap markers are illustrative, not a measured data feed.</li><li>Unverified corner telemetry and elevation traces are marked unavailable.</li><li>Snapshot: 29 September 2026. Recent means raced since 2025; it does not guarantee a place on the current calendar.</li></ul><p>Wikipedia-derived descriptions are adapted under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Historical diagrams © 2024–2026 ROY Jules, licensed CC BY 4.0. Geometry is unchanged.</p><p>Keyboard: <b>/</b> to search, <b>Escape</b> to close a dossier, <b>Tab</b> to move between controls. Reduced-motion preferences are respected.</p>`;
  info.showModal();
  lenis?.stop();
  document.body.style.overflow = "hidden";
  document.dispatchEvent(new CustomEvent("dialog-cursor", { detail: info }));
  $("#close-info").focus();
}
$("#about").onclick = openInfo;
$("#sources-footer").onclick = openInfo;
$("#close-info").onclick = () => info.close();
info.addEventListener("close", () => {
  lenis?.start();
  document.body.style.overflow = "";
  document.dispatchEvent(new CustomEvent("dialog-cursor"));
  infoOrigin?.focus({ preventScroll: true });
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !document.querySelector("dialog[open]") &&
    !e.target.matches("input,textarea,select")
  ) {
    e.preventDefault();
    scrollTo("#archive");
    $("#search").focus({ preventScroll: true });
  }
});
showFeature();
render();
initIntro(byId.get("circuit-de-monaco").path);
initCursor();
initScroll();
// Refresh after font metrics settle, without delaying useful content.
document.fonts.ready.then(() => ScrollTrigger.refresh());
