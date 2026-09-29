export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function mapMarkup(
  c,
  { sectors = false, id = "map", interactive = false, profile = null } = {},
) {
  if (!c.path)
    return c.image
      ? `<img src="${esc(c.image)}" alt="${esc(c.name)} circuit layout" loading="lazy">`
      : `<div class="map-unavailable">GEOMETRY NOT AVAILABLE</div>`;
  return `<svg viewBox="0 0 720 460" role="${interactive ? "group" : "img"}" aria-label="${esc(c.name)} circuit layout${interactive ? ", select a numbered corner" : ""}"><path class="track-shadow" d="${c.path}"/><path id="${id}" class="track-outline" d="${c.path}"/>${sectors ? `<path class="sector-track" pathLength="100" stroke="#a6b9a7" stroke-dasharray="33 67" stroke-dashoffset="-33" d="${c.path}"/><path class="sector-track" pathLength="100" stroke="#7983f4" stroke-dasharray="34 66" stroke-dashoffset="-66" d="${c.path}"/>` : ""}${interactive ? '<g class="markers"></g><circle class="lap-dot" r="4" hidden/>' : ""}</svg>`;
}
export function addMarkers(container, profile, onSelect) {
  const path = container.querySelector(".track-outline"),
    group = container.querySelector(".markers");
  if (!path || !group || !profile) return;
  const len = path.getTotalLength();
  group.innerHTML = profile.corners
    .map((c, i) => {
      const p = path.getPointAtLength(len * c.fraction);
      return `<g class="corner-marker ${i === 0 ? "active" : ""}" role="button" tabindex="0" aria-label="Turn ${c.n}, ${esc(c.name)}" data-corner="${i}" transform="translate(${p.x},${p.y})"><circle r="13"/><text>${c.n}</text></g>`;
    })
    .join("");
  group.querySelectorAll(".corner-marker").forEach((el) => {
    const select = () => onSelect(Number(el.dataset.corner));
    el.addEventListener("click", select);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select();
      }
    });
  });
}
