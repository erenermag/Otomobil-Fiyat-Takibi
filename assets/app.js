(() => {
  const TL = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtDate = (d) => DATE.format(new Date(d + "T00:00:00"));
  const sortTr = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, "tr"));

  // Adres: #marka=Fiat&model=Egea+Cross (paylaşılabilir, geri tuşu çalışır)
  const link = (brand, model) => {
    const p = new URLSearchParams();
    if (brand) p.set("marka", brand);
    if (model) p.set("model", model);
    const s = p.toString();
    return s ? `#${s}` : "#";
  };

  let cars = [];

  function enrich(car) {
    const p = car.prices || [];
    const last = p[p.length - 1] || null;
    const prev = p.length > 1 ? p[p.length - 2] : null;
    const change = last && prev ? (last.price - prev.price) / prev.price : null;
    return { ...car, last, prev, change };
  }

  const minPrice = (list) => {
    const vals = list.filter((c) => c.last).map((c) => c.last.price);
    return vals.length ? Math.min(...vals) : null;
  };

  function sparkline(prices) {
    if (prices.length < 2) return "";
    const w = 260, h = 48, pad = 4;
    const vals = prices.map((p) => p.price);
    const min = Math.min(...vals), max = Math.max(...vals);
    const x = (i) => pad + (i * (w - 2 * pad)) / (vals.length - 1);
    const y = (v) => (max === min ? h / 2 : h - pad - ((v - min) * (h - 2 * pad)) / (max - min));
    const d = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Fiyat geçmişi grafiği">
      <path d="${d}" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function changeBadge(c) {
    if (c.change === null) return c.last ? `<span class="chg flat">ilk kayıt</span>` : "";
    const pct = Math.abs(c.change * 100).toFixed(1).replace(".", ",");
    const diff = TL.format(Math.abs(c.last.price - c.prev.price));
    if (c.change > 0) return `<span class="chg up">▲ %${pct} (+${diff})</span>`;
    if (c.change < 0) return `<span class="chg down">▼ %${pct} (−${diff})</span>`;
    return `<span class="chg flat">değişmedi</span>`;
  }

  // Marka / model seçim kutusu
  function tile(href, name, detail, price) {
    return `<a class="tile" href="${href}">
      <span class="tile-name">${esc(name)}</span>
      <span class="tile-detail">${esc(detail)}</span>
      ${price !== null ? `<span class="tile-price">${TL.format(price)}<small>'den başlayan</small></span>` : ""}
    </a>`;
  }

  // Donanım kartı
  function card(c) {
    const spec = [c.engine, c.fuel, c.transmission].filter(Boolean).map(esc).join(" · ");
    const campaign = c.last?.campaign
      ? `<div class="camp">Kampanyalı: <b>${TL.format(c.last.campaign)}</b> (−${TL.format(c.last.price - c.last.campaign)})</div>`
      : "";
    const body = c.last
      ? `<div class="price">${TL.format(c.last.price)} <span class="lbl">liste</span></div>
         ${campaign}
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
      <h3>${esc(c.trim || "Standart")}</h3>
      ${spec ? `<div class="meta">${spec}</div>` : ""}
      ${body}
    </article>`;
  }

  function render() {
    const p = new URLSearchParams(location.hash.slice(1));
    let brand = p.get("marka") || "";
    let model = p.get("model") || "";
    if (!cars.some((c) => c.brand === brand)) brand = model = "";
    if (!cars.some((c) => c.brand === brand && c.model === model)) model = "";

    const crumbs = [`<a href="#">Markalar</a>`];
    if (brand) crumbs.push(model ? `<a href="${link(brand)}">${esc(brand)}</a>` : `<span>${esc(brand)}</span>`);
    if (model) crumbs.push(`<span>${esc(model)}</span>`);
    $("crumbs").innerHTML = brand ? crumbs.join(`<span class="sep">›</span>`) : "";

    if (!brand) {
      // 1. adım: markalar
      $("title").textContent = "Marka seçin";
      $("list").innerHTML = `<div class="tiles">${sortTr(cars.map((c) => c.brand)).map((b) => {
        const items = cars.filter((c) => c.brand === b);
        const n = new Set(items.map((c) => c.model)).size;
        return tile(link(b), b, `${n} model`, minPrice(items));
      }).join("")}</div>`;
    } else if (!model) {
      // 2. adım: seçilen markanın modelleri
      $("title").textContent = `${brand} · model seçin`;
      const inBrand = cars.filter((c) => c.brand === brand);
      $("list").innerHTML = `<div class="tiles">${sortTr(inBrand.map((c) => c.model)).map((m) => {
        const items = inBrand.filter((c) => c.model === m);
        return tile(link(brand, m), m, `${items.length} donanım`, minPrice(items));
      }).join("")}</div>`;
    } else {
      // 3. adım: modelin donanımları (fiyata göre artan)
      const items = cars
        .filter((c) => c.brand === brand && c.model === model)
        .sort((a, b) => (a.last?.price ?? Infinity) - (b.last?.price ?? Infinity));
      $("title").textContent = `${brand} ${model}`;
      $("list").innerHTML = `<div class="grid">${items.map(card).join("")}</div>`;
    }
    document.title = [model && `${brand} ${model}`, !model && brand, "Sıfır Araç Fiyat Takibi"].filter(Boolean).join(" · ");
  }

  async function init() {
    try {
      const res = await fetch("data/cars.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      cars = data.cars.map(enrich);
      $("updated").textContent = data.updated ? `son güncelleme: ${fmtDate(data.updated)}` : "henüz güncellenmedi";
      window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
      render();
    } catch (e) {
      $("list").innerHTML = `<p class="msg">Veri yüklenemedi (${esc(e.message)}).</p>`;
    }
  }

  init();
})();
