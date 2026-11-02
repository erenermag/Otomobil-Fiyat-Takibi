(() => {
  const TL = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtDate = (d) => DATE.format(new Date(d + "T00:00:00"));

  let cars = [];

  function enrich(car) {
    const p = car.prices || [];
    const last = p[p.length - 1] || null;
    const prev = p.length > 1 ? p[p.length - 2] : null;
    const change = last && prev ? (last.price - prev.price) / prev.price : null;
    return { ...car, last, prev, change };
  }

  function sparkline(prices) {
    if (prices.length < 2) return "";
    const w = 260, h = 48, pad = 4;
    const vals = prices.map((p) => p.price);
    const min = Math.min(...vals), max = Math.max(...vals);
    const x = (i) => pad + (i * (w - 2 * pad)) / (vals.length - 1);
    const y = (v) => (max === min ? h / 2 : h - pad - ((v - min) * (h - 2 * pad)) / (max - min));
    const d = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const lx = x(vals.length - 1), ly = y(vals[vals.length - 1]);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Fiyat geçmişi grafiği">
      <path d="${d}" vector-effect="non-scaling-stroke"/><circle cx="${lx}" cy="${ly}" r="3"/></svg>`;
  }

  function changeBadge(c) {
    if (c.change === null) return c.last ? `<span class="chg flat">ilk kayıt</span>` : "";
    const pct = (c.change * 100).toFixed(1).replace(".", ",");
    if (c.change > 0) return `<span class="chg up">▲ %${pct} (+${TL.format(c.last.price - c.prev.price)})</span>`;
    if (c.change < 0) return `<span class="chg down">▼ %${pct.replace("-", "")} (${TL.format(c.last.price - c.prev.price)})</span>`;
    return `<span class="chg flat">değişmedi</span>`;
  }

  function card(c) {
    const spec = [c.trim, c.fuel, c.transmission].filter(Boolean).map(esc).join(" · ");
    const body = c.last
      ? `<div class="price">${TL.format(c.last.price)}</div>
         ${changeBadge(c)}
         ${sparkline(c.prices)}
         <div class="meta">${fmtDate(c.last.date)} · <a href="${esc(c.last.source)}" target="_blank" rel="noopener">kaynak</a></div>
         <details><summary>Fiyat geçmişi (${c.prices.length})</summary>
           <table>${[...c.prices].reverse().map((p) =>
             `<tr><td>${fmtDate(p.date)}</td><td><a href="${esc(p.source)}" target="_blank" rel="noopener">${TL.format(p.price)}</a></td></tr>`
           ).join("")}</table>
         </details>`
      : `<div class="empty">Henüz fiyat girilmedi.</div>`;
    return `<article class="card">
      <h2>${esc(c.brand)} ${esc(c.model)}</h2>
      ${spec ? `<div class="meta">${spec}</div>` : ""}
      ${body}
    </article>`;
  }

  function render() {
    const brand = $("brand").value;
    const q = $("q").value.trim().toLocaleLowerCase("tr");
    const sort = $("sort").value;
    const big = Number.MAX_SAFE_INTEGER;
    const list = cars
      .filter((c) => !brand || c.brand === brand)
      .filter((c) => !q || `${c.brand} ${c.model} ${c.trim}`.toLocaleLowerCase("tr").includes(q))
      .sort((a, b) => {
        switch (sort) {
          case "price-desc": return (b.last?.price ?? -1) - (a.last?.price ?? -1);
          case "change-desc": return (b.change ?? -big) - (a.change ?? -big);
          case "name": return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, "tr");
          default: return (a.last?.price ?? big) - (b.last?.price ?? big);
        }
      });
    $("list").innerHTML = list.length ? list.map(card).join("") : `<p class="msg">Eşleşen araç yok.</p>`;
  }

  async function init() {
    try {
      const res = await fetch("data/cars.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      cars = data.cars.map(enrich);
      $("updated").textContent = data.updated ? `son güncelleme: ${fmtDate(data.updated)}` : "henüz güncellenmedi";
      const brands = [...new Set(cars.map((c) => c.brand))].sort((a, b) => a.localeCompare(b, "tr"));
      $("brand").insertAdjacentHTML("beforeend", brands.map((b) => `<option>${esc(b)}</option>`).join(""));
      ["brand", "sort", "q"].forEach((id) => $(id).addEventListener("input", render));
      render();
    } catch (e) {
      $("list").innerHTML = `<p class="msg">Veri yüklenemedi (${esc(e.message)}).</p>`;
    }
  }

  init();
})();
