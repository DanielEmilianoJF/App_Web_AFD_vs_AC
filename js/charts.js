/* Gráficas ligeras en SVG (sin librerías externas). */
(function (global) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function empty(container, msg) {
    container.innerHTML = `<div class="empty">${msg}</div>`;
  }

  /** Dona: datos = [{label, value, color}] */
  function donut(container, datos, centro, sub, vacio) {
    const total = datos.reduce((a, d) => a + d.value, 0);
    if (!total) return empty(container, vacio || 'Aún no hay datos');
    container.innerHTML = '';
    const svg = el('svg', { viewBox: '0 0 220 220', role: 'img' });
    const r = 80, cx = 110, cy = 110, w = 26, C = 2 * Math.PI * r;
    svg.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: css('--surface-2'), 'stroke-width': w }));
    let offset = 0;
    datos.forEach(d => {
      if (!d.value) return;
      const len = (d.value / total) * C;
      const gap = datos.filter(x => x.value).length > 1 ? 3 : 0;
      const c = el('circle', {
        cx, cy, r, fill: 'none', stroke: d.color, 'stroke-width': w,
        'stroke-dasharray': `${Math.max(len - gap, 0)} ${C}`,
        'stroke-dashoffset': -offset, transform: `rotate(-90 ${cx} ${cy})`, 'stroke-linecap': 'butt'
      });
      c.appendChild(el('title', {}, `${d.label}: ${d.value} (${Math.round(d.value / total * 100)}%)`));
      svg.appendChild(c);
      offset += len;
    });
    svg.appendChild(el('text', { x: cx, y: cy + 6, class: 'donut-center' }, centro));
    svg.appendChild(el('text', { x: cx, y: cy + 28, class: 'donut-sub' }, sub));
    const wrap = document.createElement('div');
    wrap.style.maxWidth = '240px'; wrap.style.margin = '0 auto';
    wrap.appendChild(svg);
    container.appendChild(wrap);
    const leg = document.createElement('div');
    leg.className = 'chart-legend';
    leg.innerHTML = datos.map(d => `<span><i class="sw" style="background:${d.color}"></i>${d.label}: <b>${d.value}</b></span>`).join('');
    container.appendChild(leg);
  }

  /** Barras horizontales: datos = [{label, sub, value, color}] */
  function bars(container, datos, opts) {
    opts = opts || {};
    const max = Math.max(0, ...datos.map(d => d.value));
    if (!max) return empty(container, opts.vacio || 'Aún no hay datos');
    container.innerHTML = '';
    const rowH = 40, labelW = opts.labelW || 120, W = 440, valW = 84;
    const H = datos.length * rowH;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    datos.forEach((d, i) => {
      const y = i * rowH;
      const bw = W - labelW - valW;
      svg.appendChild(el('text', { x: 0, y: y + 18, class: 'axis-lbl', style: 'font-weight:600' }, d.label));
      if (d.sub) svg.appendChild(el('text', { x: 0, y: y + 33, class: 'axis-lbl', style: 'font-size:10.5px' }, d.sub));
      svg.appendChild(el('rect', { x: labelW, y: y + 10, width: bw, height: 18, rx: 4, class: 'track' }));
      const w = Math.max((d.value / max) * bw, d.value ? 4 : 0);
      const r = el('rect', { x: labelW, y: y + 10, width: w, height: 18, rx: 4, fill: d.color || css('--primary'), class: 'bar' });
      r.appendChild(el('title', {}, `${d.label}: ${d.value}`));
      svg.appendChild(r);
      const pct = opts.total ? ` · ${Math.round(d.value / opts.total * 100)}%` : '';
      svg.appendChild(el('text', { x: labelW + w + 6, y: y + 24, class: 'val-lbl' }, d.value + pct));
    });
    container.appendChild(svg);
  }

  global.Charts = { donut, bars, css };
})(window);
