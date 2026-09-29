import { gsap, Flip, lenis, reducedMotion } from "./motion.js";
import { profiles } from "./data/profiles.js";
import { mapMarkup, addMarkers, esc } from "./maps.js";
const dialog = document.querySelector("#telemetry");
let selected = null,
  origin = null,
  lapTween = null,
  activeCorner = 0;
const safeText = (s) => esc(String(s ?? "").replace(/\[\s*\d+\s*\]/g, ""));
export const f1Records = (c) =>
  c.records.filter((r) => /,\s*(?:F1|Formula One|Formula 1)\s*\)/.test(r.text));
function cornerContent(c, p, i = 0) {
  if (!p)
    return `<p class="eyebrow">CIRCUIT REFERENCE</p><h3>BUILD YOUR<br>OWN RACING LINE.</h3><p>Explore the mapped layout, configuration history and published lap records below.</p><div class="empty-field">A corner-by-corner coaching model has not yet been verified for this circuit.</div><p class="data-note">No measured corner telemetry is bundled. Gear and speed values are never inferred from a track outline.</p>`;
  const corner = p.corners[i];
  return `<p class="eyebrow">CORNER ${String(corner.n).padStart(2, "0")} / SIM GUIDE</p><h3>${esc(corner.name)}</h3><div class="corner-stats"><div><strong>${corner.gear}</strong><small>APEX GEAR</small></div><div><strong>${corner.speed}</strong><small>KM/H · ESTIMATE</small></div></div><p>${esc(corner.note)}</p><div class="corner-buttons">${p.corners.map((n, idx) => `<button data-select-corner="${idx}" class="${i === idx ? "selected" : ""}" aria-pressed="${i === idx}">T${n.n}</button>`).join("")}</div><p class="data-note">ILLUSTRATIVE MODERN F1 / DRY BASELINE<br>Not measured telemetry. Car, sim, setup and conditions change the targets. Map marker positions are schematic.</p>`;
}
function selectCorner(i) {
  const p = profiles[selected.id];
  activeCorner = i;
  document.querySelector(".corner-panel").innerHTML = cornerContent(
    selected,
    p,
    i,
  );
  document
    .querySelectorAll(".corner-marker")
    .forEach((el, idx) => el.classList.toggle("active", i === idx));
}
function tabBody(tab) {
  const c = selected,
    p = profiles[c.id];
  if (tab === "guide")
    return `<div class="detail-columns"><div><h3>THE RACING LINE</h3><p>${esc(p?.line || "A verified circuit-specific racing-line guide is not yet available. Use the map to identify corner sequences, then validate braking points with telemetry from your chosen car and simulator.")}</p><p class="tab-subtitle">Reference geometry may represent a different revision from the last World Championship configuration. Check the configuration source before comparing laps.</p></div><div><h3>TRACK CHARACTER</h3><p>${esc(
      p?.trivia ||
        c.context
          ?.replace(/\[\s*\d+\s*\]/g, "")
          .split(/(?<=[.!?])\s/)
          .slice(0, 2)
          .join(" ") ||
        "Historical details are available in the linked circuit reference.",
    )}</p><a href="${esc(p?.source || c.source)}" target="_blank" rel="noopener noreferrer">Read circuit reference ↗</a></div></div>`;
  if (tab === "records") {
    const records = f1Records(c);
    return `<div class="detail-columns"><div><div class="record-heading"><h3>OFFICIAL-SESSION FASTEST LAP</h3><small>QUALIFYING / RACE</small></div>${p?.outright ? `<div class="record"><time>${p.outright.time}</time><p>${esc(p.outright.driver)} · ${p.outright.year}<br>${esc(p.outright.car)}</p><span>${p.outright.session} · 7.004 km configuration</span><p><a href="${p.outright.source}" target="_blank" rel="noopener noreferrer">Record-breaking lap source ↗</a></p></div>` : `<div class="empty-field">An outright fastest official-session lap has not been verified for this configuration.</div>`}<p class="tab-subtitle">An outright fastest lap may be set in qualifying. A race lap record only counts laps during a race. Different configurations must not be compared as the same record.</p></div><div><h3>PUBLISHED F1 RACE RECORDS</h3>${records.length ? records.map((r) => `<div class="record"><span>${safeText(r.configuration || "Configuration as published in source")}</span><p>${safeText(r.text)}</p></div>`).join("") : `<div class="empty-field">No verified Formula 1 race record was extracted for this venue. Some historical championship races used other regulations.</div>`}<p><a href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">Check record and configuration source ↗</a></p></div></div>`;
  }
  if (tab === "history") {
    const versions = c.layoutVersions || [];
    const latest = versions.reduce(
      (a, b) =>
        Math.max(...b.era.match(/\d{4}/g).map(Number)) >
        Math.max(...a.era.match(/\d{4}/g).map(Number))
          ? b
          : a,
      versions[0],
    );
    return `<div class="history-explorer"><div class="history-controls"><h3>LAYOUT EVOLUTION</h3><label for="layout-version">CONFIGURATION <select id="layout-version">${versions.map((v) => `<option value="${esc(v.id)}" ${v.id === latest?.id ? "selected" : ""}>${esc(v.era)}${c.id === "nurburgring" && v.id === "nurburgring-1" ? " · Nordschleife" : ""}</option>`).join("")}</select></label><p class="tab-subtitle">${versions.length} archived layout${versions.length === 1 ? "" : "s"}. Select an era to compare the geometry. Listed eras follow the diagram source; refer to championship appearances below for race years.</p><p>Diagrams © 2024–2026 ROY Jules · <a href="https://github.com/julesr0y/f1-circuits-svg" target="_blank" rel="noopener noreferrer">CC BY 4.0 / source ↗</a></p></div><div class="history-map"><img id="history-layout" src="${esc(latest?.image)}" alt="${esc(c.name)} historical configuration ${esc(latest?.era)}"></div></div><div class="detail-columns"><div><h3>KEY CHANGES</h3>${p?.history ? `<ul>${p.history.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : c.layouts?.length ? `<ul>${[...new Set(c.layouts)].map((h) => `<li>${safeText(h)}</li>`).join("")}</ul>` : "<p>A structured layout timeline is not yet available for this circuit.</p>"}<p><a href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">Explore configuration history ↗</a></p></div><div><h3>WORLD CHAMPIONSHIP APPEARANCES</h3><p>${esc(c.seasons)}</p><h3>VENUE NOTES</h3><p>${esc(p?.trivia || "This archive counts venues, not every configuration as a separate circuit. The main dossier dimensions identify the last World Championship layout, not the historical diagram selected here.")}</p></div></div>`;
  }
  if (tab === "elevation")
    return `<div class="detail-columns"><div><h3>ELEVATION PROFILE</h3><div class="empty-field">Surveyed distance/elevation samples are not available in this dataset.</div><p>A geographic track outline is two-dimensional. It cannot establish gradient, compression or crest height.</p></div><div><h3>VERTICAL RANGE</h3>${p?.elevation ? `<p style="font:50px var(--display);color:var(--acid);margin:0">${p.elevation} m</p><p>Approximate high-to-low change at Spa. This is a circuit reference value, not an elevation trace.</p><a href="${p.elevationSource}" target="_blank" rel="noopener noreferrer">Circuit reference ↗</a>` : "<p>Not verified for the displayed configuration.</p>"}<p class="tab-subtitle">To add a measured profile, supply distance in metres and elevation in metres for a named circuit revision.</p></div></div>`;
  return `<div class="detail-columns"><div><h3>DATA & ATTRIBUTION</h3><p><a href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">Circuit history, dimensions and record reference ↗</a></p><p><a href="https://en.wikipedia.org/wiki/List_of_Formula_One_circuits" target="_blank" rel="noopener noreferrer">World Championship circuit registry ↗</a></p>${c.path ? '<p>Geometry: Tomislav Bacinger, <a href="https://github.com/bacinger/f1-circuits" target="_blank" rel="noopener noreferrer">f1-circuits</a> (MIT). Displayed as a simplified vector plan.</p>' : `<p><a href="${esc(c.mapSource)}" target="_blank" rel="noopener noreferrer">Jules Roy · diagram source · CC BY 4.0 ↗</a></p>`}<p>Wikipedia-derived prose is adapted under CC BY-SA 4.0. Historical diagrams © 2024–2026 ROY Jules (julesr0y), CC BY 4.0. Diagrams are recoloured for the dark theme; geometry is unchanged.</p></div><div><h3>READ THE DATA CORRECTLY</h3><p>Imported 29 September 2026. The archive is a local snapshot, not a live timing feed. Length and turns refer to the last F1 configuration listed; imported geometry can reflect another revision. Layout-specific source labels accompany records.</p><p>Sim coaching is illustrative. Corner positions, sector colours and moving lap markers are visual aids, not measured telemetry. Unknown values stay unknown.</p></div></div>`;
}
function selectTab(tab) {
  document.querySelectorAll("[data-tab]").forEach((el) => {
    const active = el.dataset.tab === tab;
    el.classList.toggle("selected", active);
    el.setAttribute("aria-selected", active);
    el.tabIndex = active ? 0 : -1;
  });
  const panel = document.querySelector(".detail-tab-body");
  panel.innerHTML = tabBody(tab);
  panel.setAttribute("aria-labelledby", `tab-${tab}`);
}
export function openCircuit(c, sourceElement) {
  if (dialog.open) return;
  selected = c;
  origin = sourceElement?.closest("button") || document.activeElement;
  activeCorner = 0;
  const p = profiles[c.id];
  let state;
  const sourceMap =
    sourceElement?.querySelector(".card-map,.map-stage") || sourceElement;
  if (sourceMap && !reducedMotion) {
    sourceMap.dataset.flipId = "circuit-map";
    state = Flip.getState(sourceMap);
  }
  document.querySelector("#detail-body").innerHTML =
    `<div class="detail-heading"><div><p>${esc(c.country.toUpperCase())} / ${esc(c.location.toUpperCase())}</p><h2 id="detail-title">${esc(c.name)}</h2></div><span>FIRST GRAND PRIX / ${c.first}</span></div><div class="detail-workspace"><div class="detail-map-wrap"><div class="map-toolbar"><span>${c.path ? "VECTOR PLAN" : "HISTORICAL MAP"} / ${p ? "SELECT A NUMBERED CORNER" : "CIRCUIT GEOMETRY"}</span>${c.path ? '<button id="play-lap" aria-pressed="false">PLAY SCHEMATIC LAP ▷</button>' : ""}</div><div class="map-stage" data-flip-id="circuit-map">${mapMarkup(c, { id: "detail-path", interactive: true, profile: p })}</div></div><aside class="corner-panel" aria-live="polite">${cornerContent(c, p)}</aside></div><div class="detail-stats"><div><label>LAP LENGTH</label><strong>${c.length.toFixed(3)} KM</strong></div><div><label>CORNERS</label><strong>${c.turns}</strong></div><div><label>DIRECTION</label><strong>${esc(c.direction)}</strong></div><div><label>CIRCUIT TYPE</label><strong>${esc(c.type)}</strong></div><div><label>FIRST GRAND PRIX</label><strong>${c.first}</strong></div></div><div class="detail-tabs" role="tablist" aria-label="Circuit details">${[
      ["guide", "Driving guide"],
      ["records", "Lap records"],
      ["history", "Circuit history"],
      ["elevation", "Elevation"],
      ["sources", "Sources & notes"],
    ]
      .map(
        ([key, title], i) =>
          `<button id="tab-${key}" data-tab="${key}" role="tab" aria-controls="detail-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="${i === 0 ? "selected" : ""}">${title}</button>`,
      )
      .join(
        "",
      )}</div><div id="detail-panel" class="detail-tab-body" role="tabpanel" aria-labelledby="tab-guide">${tabBody("guide")}</div>`;
  dialog.showModal();
  dialog.scrollTop = 0;
  lenis?.stop();
  document.body.style.overflow = "hidden";
  document.dispatchEvent(new CustomEvent("dialog-cursor", { detail: dialog }));
  addMarkers(dialog, p, selectCorner);
  if (state)
    Flip.from(state, {
      targets: dialog.querySelector(".map-stage"),
      duration: 0.7,
      ease: "power3.inOut",
      scale: true,
    });
  document.querySelector("#close-detail").focus({ preventScroll: true });
  const play = document.querySelector("#play-lap");
  if (play)
    play.onclick = () => {
      if (lapTween) {
        lapTween.kill();
        lapTween = null;
        play.textContent = "PLAY SCHEMATIC LAP ▷";
        play.setAttribute("aria-pressed", "false");
        return;
      }
      const path = dialog.querySelector(".track-outline"),
        dot = dialog.querySelector(".lap-dot"),
        length = path.getTotalLength(),
        progress = { t: 0 };
      dot.removeAttribute("hidden");
      play.textContent = "PAUSE LAP Ⅱ";
      play.setAttribute("aria-pressed", "true");
      lapTween = gsap.to(progress, {
        t: 1,
        duration: 16,
        repeat: -1,
        ease: "none",
        onUpdate: () => {
          const point = path.getPointAtLength(progress.t * length);
          dot.setAttribute("cx", point.x);
          dot.setAttribute("cy", point.y);
        },
      });
    };
}
function cleanup() {
  lapTween?.kill();
  lapTween = null;
  document.body.style.overflow = "";
  lenis?.start();
  document.dispatchEvent(new CustomEvent("dialog-cursor"));
  origin?.focus?.({ preventScroll: true });
}
document.querySelector("#close-detail").onclick = () => dialog.close();
dialog.addEventListener("close", cleanup);
dialog.addEventListener("click", (e) => {
  const corner = e.target.closest("[data-select-corner]");
  if (corner) selectCorner(Number(corner.dataset.selectCorner));
  const tab = e.target.closest("[data-tab]");
  if (tab) selectTab(tab.dataset.tab);
});
dialog.addEventListener("keydown", (e) => {
  if (
    e.target.matches('[role="tab"]') &&
    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
  ) {
    e.preventDefault();
    const tabs = [...dialog.querySelectorAll('[role="tab"]')];
    let index = tabs.indexOf(e.target);
    index =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? tabs.length - 1
          : (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
            tabs.length;
    selectTab(tabs[index].dataset.tab);
    tabs[index].focus();
  }
});

dialog.addEventListener("change", (e) => {
  if (e.target.id === "layout-version") {
    const v = selected.layoutVersions.find((v) => v.id === e.target.value);
    const image = document.querySelector("#history-layout");
    image.src = v.image;
    image.alt = `${selected.name} historical configuration ${v.era}`;
    if (!reducedMotion)
      gsap.fromTo(
        image,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.4 },
      );
  }
});
