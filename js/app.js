/* ==========================================================
   Interfaz: pestañas, AFD animado, autómata celular,
   estadísticas y tema claro/oscuro.
   ========================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, text) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- Almacenamiento seguro ---------------- */
  const store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------------- Tema ---------------- */
  const savedTheme = store.get('tema', null);
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  $('#themeToggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('tema', next);
    renderStats();
  });

  /* ---------------- Pestañas ---------------- */
  function irA(tab) {
    $$('.tab').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    $$('.panel').forEach(p => p.classList.toggle('is-active', p.id === 'tab-' + tab));
    if (tab === 'stats') renderStats();
    if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('.tab').forEach(b => b.addEventListener('click', () => irA(b.dataset.tab)));
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => irA(b.dataset.goto)));

  /* ---------------- Estadísticas (estado) ---------------- */
  const statsDefault = () => ({
    afd: { total: 0, ok: 0, bad: 0, sym: { p: 0, t: 0, v: 0, T: 0, otros: 0 }, fallaEn: { q0: 0, q1: 0, q2: 0, q3: 0, q4: 0 }, latidos: 0, largoTotal: 0, masLarga: '' },
    ac: { pasos: 0, fases: [0, 0, 0, 0], configOk: 0, configBad: 0, enviadas: 0 },
    historial: []
  });
  let stats = Object.assign(statsDefault(), store.get('estadisticas', {}));
  const guardarStats = () => store.set('estadisticas', stats);

  function registrarAFD(r) {
    const a = stats.afd;
    a.total++;
    r.aceptada ? a.ok++ : a.bad++;
    for (const ch of r.cadena) (ch in a.sym && ch !== 'otros') ? a.sym[ch]++ : a.sym.otros++;
    if (!r.aceptada && r.estadoAntesDeFalla) a.fallaEn[r.estadoAntesDeFalla]++;
    if (r.aceptada) {
      a.latidos += r.latidos;
      if (r.cadena.length > a.masLarga.length) a.masLarga = r.cadena;
    }
    a.largoTotal += r.cadena.length;
    stats.historial.unshift({ s: r.cadena, ok: r.aceptada, f: r.final });
    stats.historial = stats.historial.slice(0, 30);
    guardarStats();
    renderHistory();
  }

  /* ==========================================================
     AFD
     ========================================================== */
  const input = $('#afdInput');

  // Teclado de símbolos
  $('#keypad').innerHTML = AFD.alfabeto.map(s =>
    `<button class="key" type="button" data-sym="${s}"><b>${s}</b><small>${AFD.simbolos[s].replace(/ \(.*\)/, '')}</small></button>`).join('');
  $$('.key').forEach(k => k.addEventListener('click', () => { input.value += k.dataset.sym; input.focus(); vistaPrevia(); }));
  $('#symLegend').innerHTML = AFD.alfabeto.map(s => `<li><b>${s}</b>${AFD.simbolos[s]}</li>`).join('');

  // Tabla δ
  function renderDelta(hlEstado, hlSimbolo) {
    const cols = AFD.alfabeto.concat(['otro']);
    let html = '<thead><tr><th>δ</th>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
    for (const q of AFD.estados) {
      const fila = q === hlEstado ? ' class="row-hl"' : '';
      const marca = q === AFD.inicial ? '→ ' : (AFD.aceptacion.includes(q) ? '* ' : '');
      html += `<tr${fila}><th>${marca}${q}</th>`;
      for (const c of cols) {
        const dest = c === 'otro' ? AFD.error : AFD.delta[q][c];
        const esHl = q === hlEstado && (c === hlSimbolo || (c === 'otro' && hlSimbolo && !AFD.alfabeto.includes(hlSimbolo)));
        html += `<td class="${dest === AFD.error ? 'err' : ''} ${esHl ? 'hl' : ''}">${dest}</td>`;
      }
      html += '</tr>';
    }
    $('#deltaTable').innerHTML = html + '</tbody>';
  }

  // Diagrama de estados
  const R = 34;
  const POS = { q0: [390, 190], q1: [230, 72], q2: [550, 72], q3: [550, 308], q4: [230, 308], q5: [705, 190] };
  const EDGES = [
    { a: 'q0', b: 'q1', s: 'T', bend: 0 }, { a: 'q0', b: 'q2', s: 'p', bend: 0 },
    { a: 'q0', b: 'q3', s: 't', bend: 0 }, { a: 'q0', b: 'q4', s: 'v', bend: 0 },
    { a: 'q1', b: 'q2', s: 'p', bend: -30 }, { a: 'q2', b: 'q3', s: 't', bend: -30 },
    { a: 'q3', b: 'q4', s: 'v', bend: -30 }, { a: 'q4', b: 'q1', s: 'T', bend: -30 },
    { a: 'q2', b: 'q5', s: 'otros', bend: -10, err: true }, { a: 'q3', b: 'q5', s: 'otros', bend: 10, err: true },
    { a: 'q1', b: 'q5', s: 'otros', ctrl: [640, -70], err: true }, { a: 'q4', b: 'q5', s: 'otros', ctrl: [640, 450], err: true },
    { a: 'q0', b: 'q5', s: 'otros', bend: 0, err: true, lblT: .62 }
  ];
  const edgeKey = (a, b) => a + '>' + b;

  function buildGraph() {
    const svg = $('#afdGraph');
    svg.innerHTML = '';
    const defs = svgEl('defs');
    [['ah', 'arrowhead'], ['ah-on', 'arrowhead-active']].forEach(([id, cls]) => {
      const m = svgEl('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
      m.appendChild(svgEl('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    const gEdges = svgEl('g'), gLabels = svgEl('g'), gNodes = svgEl('g');
    for (const e of EDGES) {
      const [x1, y1] = POS[e.a], [x2, y2] = POS[e.b];
      let cx, cy;
      if (e.ctrl) [cx, cy] = e.ctrl;
      else {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
        cx = mx + (-dy / L) * e.bend; cy = my + (dx / L) * e.bend;
      }
      const u1 = Math.hypot(cx - x1, cy - y1) || 1, u2 = Math.hypot(cx - x2, cy - y2) || 1;
      const sx = x1 + (cx - x1) / u1 * R, sy = y1 + (cy - y1) / u1 * R;
      const ex = x2 + (cx - x2) / u2 * (R + 3), ey = y2 + (cy - y2) / u2 * (R + 3);
      const g = svgEl('g', { class: 'g-edge' + (e.err ? ' err' : ''), 'data-k': edgeKey(e.a, e.b) });
      g.appendChild(svgEl('path', { d: `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`, 'marker-end': 'url(#ah)' }));
      gEdges.appendChild(g);
      // etiqueta
      const t = e.lblT || .5;
      const lx = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t * t * ex;
      const ly = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t * t * ey;
      const lg = svgEl('g', { class: 'g-edge' + (e.err ? ' err' : ''), 'data-k': edgeKey(e.a, e.b) });
      const w = e.s.length * 9 + 10;
      lg.appendChild(svgEl('rect', { x: lx - w / 2, y: ly - 11, width: w, height: 20, rx: 6, class: 'lbl-bg' }));
      lg.appendChild(svgEl('text', { x: lx, y: ly + 4, style: e.err ? 'font-size:11px;font-weight:500' : '' }, e.s));
      gLabels.appendChild(lg);
    }
    // bucle de q5
    const [qx, qy] = POS.q5;
    const loop = svgEl('g', { class: 'g-edge err', 'data-k': edgeKey('q5', 'q5') });
    loop.appendChild(svgEl('path', { d: `M${qx - 16},${qy - R + 4} C${qx - 40},${qy - 100} ${qx + 40},${qy - 100} ${qx + 16},${qy - R + 2}`, 'marker-end': 'url(#ah)' }));
    loop.appendChild(svgEl('text', { x: qx, y: qy - 86 }, 'Σ'));
    gEdges.appendChild(loop);
    // flecha de inicio
    const [x0, y0] = POS.q0;
    const st = svgEl('g', { class: 'g-edge' });
    st.appendChild(svgEl('path', { d: `M${x0},${y0 + 96} L${x0},${y0 + R + 3}`, 'marker-end': 'url(#ah)' }));
    st.appendChild(svgEl('text', { x: x0, y: y0 + 112, style: 'font-size:12px' }, 'inicio'));
    gEdges.appendChild(st);

    for (const q of AFD.estados) {
      const [x, y] = POS[q];
      const cls = ['g-node'];
      if (AFD.aceptacion.includes(q)) cls.push('is-accept');
      if (q === AFD.error) cls.push('is-error');
      const g = svgEl('g', { class: cls.join(' '), 'data-q': q });
      g.appendChild(svgEl('title', {}, `${q}: ${AFD.descripcion[q]}`));
      if (AFD.aceptacion.includes(q)) g.appendChild(svgEl('circle', { cx: x, cy: y, r: R + 5, class: 'ring' }));
      g.appendChild(svgEl('circle', { cx: x, cy: y, r: R, class: 'main' }));
      g.appendChild(svgEl('text', { x, y: y + 1 }, q));
      g.appendChild(svgEl('text', { x, y: y + 17, class: 'sub' }, AFD.corto[q]));
      gNodes.appendChild(g);
    }
    svg.append(gEdges, gLabels, gNodes);
  }

  function marcarGrafo(actual, arista, visitados) {
    $$('#afdGraph .g-node').forEach(n => {
      n.classList.toggle('is-active', n.dataset.q === actual);
      n.classList.toggle('is-visited', !!visitados && visitados.has(n.dataset.q) && n.dataset.q !== actual);
    });
    $$('#afdGraph .g-edge').forEach(g => {
      const on = g.dataset.k === arista;
      g.classList.toggle('is-active', on);
      const p = g.querySelector('path');
      if (p && p.hasAttribute('marker-end')) p.setAttribute('marker-end', on ? 'url(#ah-on)' : 'url(#ah)');
    });
    $('#afdCurrent').textContent = `${actual} · ${AFD.corto[actual]}`;
  }

  // Cinta y recorrido
  function renderTape(cadena, cabeza, falla) {
    $('#afdTape').innerHTML = cadena.split('').map((c, i) => {
      let cls = 'cell';
      if (falla >= 0 && i === falla && (cabeza == null || cabeza >= i)) cls += ' is-bad';
      else if (cabeza == null || i < cabeza) cls += ' is-read';
      if (i === cabeza) cls += ' is-head';
      return `<div class="${cls}">${escapeHtml(c)}</div>`;
    }).join('');
  }
  function renderPath(recorrido, pasos, hasta) {
    const n = hasta == null ? recorrido.length : hasta + 1;
    let html = '';
    for (let i = 0; i < n; i++) {
      if (i > 0) html += `<span class="arr">—${escapeHtml(pasos[i - 1].simbolo)}→</span>`;
      html += `<span class="q ${recorrido[i] === AFD.error ? 'err' : ''}">${recorrido[i]}</span>`;
    }
    $('#afdPath').innerHTML = html;
  }
  function setResultado(estado, badge, texto) {
    $('#afdResult').dataset.state = estado;
    $('#afdBadge').textContent = badge;
    $('#afdMotivo').textContent = texto;
  }

  // ECG
  const SEG = 60, BASE = 100;
  const bump = (i, a, b) => (i < a || i > b) ? 0 : Math.sin(Math.PI * (i - a) / (b - a));
  function ondas(sim, x0) {
    const pts = [];
    if (sim === 'v') {
      [[0, 0], [16, 0], [20, 8], [26, -78], [32, 22], [37, 0], [60, 0]].forEach(([dx, dy]) => pts.push([x0 + dx, BASE + dy]));
      return pts;
    }
    for (let i = 0; i <= SEG; i += 2) {
      let dy = 0;
      if (sim === 'p') dy = -16 * bump(i, 16, 44);
      else if (sim === 't') dy = 7 * bump(i, 14, 42);
      else if (sim === 'T') dy = -26 * bump(i, 10, 52);
      pts.push([x0 + i, BASE + dy]);
    }
    return pts;
  }
  function renderEcg(r, hasta) {
    const svg = $('#afdEcg');
    const n = r.cadena.length;
    const W = Math.max(600, n * SEG + 20);
    svg.setAttribute('viewBox', `0 0 ${W} 160`);
    svg.style.width = W > 600 ? W + 'px' : '100%';
    svg.innerHTML = '';
    const lim = hasta == null ? n : hasta + 1;
    let ok = [[0, BASE], [10, BASE]];
    let mal = [];
    for (let i = 0; i < lim; i++) {
      const x0 = 10 + i * SEG;
      const enError = r.falla >= 0 && i >= r.falla;
      if (enError) {
        if (!mal.length) mal.push([x0, BASE]);
        mal.push([x0 + SEG, BASE]);
      } else {
        ok = ok.concat(ondas(r.cadena[i], x0));
      }
      svg.appendChild(svgEl('text', { x: x0 + SEG / 2, y: 150, class: 'ecg-lbl', style: enError ? 'fill:var(--bad)' : '' }, r.cadena[i]));
    }
    svg.appendChild(svgEl('polyline', { points: ok.map(p => p.join(',')).join(' '), class: 'ecg-line' }));
    if (mal.length) {
      svg.appendChild(svgEl('polyline', { points: mal.map(p => p.join(',')).join(' '), class: 'ecg-bad' }));
      svg.appendChild(svgEl('text', { x: mal[0][0] + 6, y: 80, class: 'ecg-lbl', style: 'fill:var(--bad);text-anchor:start' }, '✕ ritmo inválido'));
    }
    if (W > 600) svg.parentElement.scrollLeft = svg.parentElement.scrollWidth;
  }
  function latido() {
    const h = $('#afdHeart');
    h.classList.remove('pulse'); void h.offsetWidth; h.classList.add('pulse');
  }

  // Validación inmediata
  let animando = false, cancelar = false;
  function mostrarCompleto(r) {
    renderTape(r.cadena, null, r.falla);
    renderPath(r.recorrido, r.pasos);
    renderEcg(r);
    const last = r.pasos[r.pasos.length - 1];
    marcarGrafo(r.final, last ? edgeKey(last.desde, last.hacia) : null, new Set(r.recorrido));
    renderDelta(last ? last.desde : null, last ? last.simbolo : null);
    if (!r.cadena.length) setResultado('bad', 'Rechazada', r.motivo);
    else setResultado(r.aceptada ? 'ok' : 'bad', r.aceptada ? '✓ Cadena aceptada' : '✕ Cadena rechazada',
      r.motivo + (r.aceptada ? ` Estado final ${r.final}: ${AFD.descripcion[r.final]}.` + (r.latidos ? ` Contiene ${r.latidos} latido${r.latidos > 1 ? 's' : ''} completo${r.latidos > 1 ? 's' : ''}.` : '') : ''));
    if (r.aceptada && r.cadena.includes('v')) latido();
  }
  function validar() {
    if (animando) cancelar = true;
    const r = AFD.procesar(input.value);
    input.value = r.cadena;
    mostrarCompleto(r);
    if (r.cadena.length) registrarAFD(r);
  }
  function vistaPrevia() {
    if (animando) return;
    const r = AFD.procesar(input.value);
    if (!r.cadena.length) return reiniciarAFD();
    renderTape(r.cadena, null, -1);
    renderPath(r.recorrido, r.pasos);
    renderEcg(r);
    marcarGrafo(r.final, null, new Set(r.recorrido));
    renderDelta(null, null);
    setResultado('idle', 'Vista previa', 'Presiona Validar (o Enter) para registrar el resultado, o "Paso a paso" para verlo animado.');
  }
  function reiniciarAFD() {
    renderTape('', null, -1);
    $('#afdPath').innerHTML = '<span class="q">q0</span>';
    renderEcg({ cadena: '', falla: -1 });
    marcarGrafo('q0', null, null);
    renderDelta(null, null);
    setResultado('idle', 'Esperando cadena', 'Escribe una cadena o usa los botones de símbolos.');
  }

  async function animar() {
    if (animando) { cancelar = true; return; }
    const r = AFD.procesar(input.value);
    input.value = r.cadena;
    if (!r.cadena.length) { mostrarCompleto(r); toast('Escribe una cadena primero'); return; }
    animando = true; cancelar = false;
    $('#afdAnimate').textContent = '■ Detener';
    const vel = () => 1350 - Number($('#afdSpeed').value);
    const visit = new Set(['q0']);
    marcarGrafo('q0', null, visit);
    renderPath(r.recorrido, r.pasos, 0);
    renderEcg(r, -1);
    renderTape(r.cadena, 0, -1);
    renderDelta('q0', null);
    setResultado('run', 'Procesando…', 'Estado inicial q0: ' + AFD.descripcion.q0 + '.');
    await sleep(vel());
    for (let i = 0; i < r.pasos.length && !cancelar; i++) {
      const p = r.pasos[i];
      renderTape(r.cadena, i, -1);
      renderDelta(p.desde, p.simbolo);
      marcarGrafo(p.desde, edgeKey(p.desde, p.hacia), visit);
      setResultado('run', `Leyendo "${p.simbolo}"`, `δ(${p.desde}, ${p.simbolo}) = ${p.hacia}` + (AFD.simbolos[p.simbolo] ? ` · ${AFD.simbolos[p.simbolo]}` : ' · símbolo fuera del alfabeto'));
      await sleep(vel() * 0.5);
      if (cancelar) break;
      visit.add(p.hacia);
      marcarGrafo(p.hacia, edgeKey(p.desde, p.hacia), visit);
      renderPath(r.recorrido, r.pasos, i + 1);
      renderEcg(r, i);
      renderTape(r.cadena, i, p.hacia === AFD.error ? i : -1);
      if (p.simbolo === 'v' && p.hacia !== AFD.error) latido();
      await sleep(vel() * 0.5);
    }
    animando = false;
    $('#afdAnimate').textContent = '▶ Paso a paso';
    if (cancelar) { cancelar = false; mostrarCompleto(r); registrarAFD(r); return; }
    mostrarCompleto(r);
    registrarAFD(r);
  }

  $('#afdValidate').addEventListener('click', validar);
  $('#afdAnimate').addEventListener('click', animar);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); validar(); } });
  input.addEventListener('input', vistaPrevia);
  $('#afdClear').addEventListener('click', () => { input.value = ''; reiniciarAFD(); input.focus(); });
  $('#afdRandomOk').addEventListener('click', () => { input.value = AFD.generarValida(); vistaPrevia(); });
  $('#afdRandomBad').addEventListener('click', () => { input.value = AFD.generarInvalida(); vistaPrevia(); });
  $$('[data-ex]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.ex; validar(); }));

  function renderHistory() {
    const ul = $('#history');
    if (!stats.historial.length) { ul.innerHTML = '<li class="muted small" style="cursor:default">Las cadenas que valides aparecerán aquí.</li>'; return; }
    ul.innerHTML = stats.historial.map((h, i) =>
      `<li data-i="${i}"><code>${escapeHtml(h.s)}</code><span class="${h.ok ? 'tag-ok' : 'tag-bad'}">${h.ok ? 'Aceptada' : 'Rechazada'} · ${h.f}</span></li>`).join('');
    $$('#history li[data-i]').forEach(li => li.addEventListener('click', () => {
      input.value = stats.historial[li.dataset.i].s;
      const r = AFD.procesar(input.value);
      mostrarCompleto(r);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }
  $('#historyClear').addEventListener('click', () => { stats.historial = []; guardarStats(); renderHistory(); });

  /* ==========================================================
     Autómata celular
     ========================================================== */
  let acHist = [AC.inicial()];
  let acSeq = '';
  let acTimer = null;
  let acEditMalla = null;
  const claseEstado = s => 'st-' + s[1].toLowerCase();
  const posClase = ['top-l', 'top-r', 'bot-l', 'bot-r'];

  function acActual() { return acHist[acHist.length - 1]; }

  function renderAC() {
    const c = acActual();
    const malla = acEditMalla || c.malla;
    const grid = $('#acGrid');
    grid.classList.toggle('editing', !!acEditMalla);
    grid.innerHTML = AC.celdas.map((cel, i) => {
      const s = malla[cel.id];
      return `<button type="button" class="chamber ${posClase[i]} ${claseEstado(s)}" data-id="${cel.id}" ${acEditMalla ? '' : 'tabindex="-1"'} aria-label="${cel.nombre}: ${AC.nombreEstado[s]}">
        <span class="c-name">${cel.nombre}</span><span class="c-state">${s}</span><span class="c-desc">${AC.nombreEstado[s]}</span></button>`;
    }).join('');
    $$('#acGrid .chamber').forEach(b => b.addEventListener('click', () => editarCelda(b.dataset.id)));
    $('#acGen').textContent = acEditMalla ? 'editando' : `t = ${c.t}`;
    $('#pacemaker').innerHTML = AC.marcapasos.map((a, i) =>
      `<span class="pm-step ${!acEditMalla && i === c.fase ? 'is-on' : ''}">${AC.estadoAFDFase[i]} · ${a}, ${AC.respuestaV[a]}</span>`).join('');
    if (acEditMalla) {
      $('#acGlobal').textContent = `(${malla.ai}, ${malla.ad}, ${malla.vi}, ${malla.vd})`;
      $('#acGlobalDesc').textContent = 'Configuración propuesta por ti. Valídala con el botón del modo editor.';
    } else {
      const a = malla.ai, v = malla.vi;
      $('#acGlobal').textContent = `(${a}, ${v}) ≡ ${AC.estadoAFDFase[c.fase]}`;
      $('#acGlobalDesc').textContent = `Aurículas en ${AC.nombreEstado[a].toLowerCase()}, ventrículos en ${AC.nombreEstado[v].toLowerCase()}. Equivale al estado ${AC.estadoAFDFase[c.fase]} del AFD.`;
    }
    const seq = $('#acSeq');
    if (!acSeq) seq.innerHTML = '<span class="muted">Avanza la simulación…</span>';
    else seq.innerHTML = escapeHtml(acSeq.slice(0, -1)) + `<span class="new">${escapeHtml(acSeq.slice(-1))}</span>`;
    $('#acPrev').disabled = acHist.length < 2 || !!acEditMalla;
  }

  function acSiguiente() {
    const n = AC.paso(acActual());
    acHist.push(n);
    if (acHist.length > 200) acHist.shift();
    acSeq += n.simbolo;
    if (acSeq.length > 40) acSeq = acSeq.slice(-40);
    stats.ac.pasos++;
    stats.ac.fases[n.fase]++;
    guardarStats();
    renderAC();
  }
  function acAnterior() {
    if (acHist.length < 2) return;
    acHist.pop();
    acSeq = acSeq.slice(0, -1);
    renderAC();
  }
  function acPlay() {
    if (acTimer) return acPausa();
    salirEditor();
    $('#acPlay').textContent = '❚❚ Pausa';
    const tick = () => { acSiguiente(); acTimer = setTimeout(tick, 1850 - Number($('#acSpeed').value)); };
    tick();
  }
  function acPausa() {
    clearTimeout(acTimer); acTimer = null;
    $('#acPlay').textContent = '▶ Play';
  }
  function acReiniciar() {
    acPausa(); salirEditor();
    acHist = [AC.inicial()]; acSeq = '';
    $('#acConfigResult').innerHTML = '';
    renderAC();
  }
  $('#acNext').addEventListener('click', () => { acPausa(); salirEditor(); acSiguiente(); });
  $('#acPrev').addEventListener('click', () => { acPausa(); acAnterior(); });
  $('#acPlay').addEventListener('click', acPlay);
  $('#acReset').addEventListener('click', acReiniciar);

  $('#acSend').addEventListener('click', () => {
    if (!acSeq) { toast('Primero avanza la simulación unos pasos'); return; }
    // El AC inicia en (AD, VS) ≡ q1, así que la secuencia del AFD inicia con T (q0 → q1)
    const inicioFase = acHist.length > acSeq.length ? acHist[acHist.length - 1 - acSeq.length].fase : 0;
    const prefijo = AC.simboloFase[(inicioFase + 3) % 4];
    input.value = prefijo + acSeq;
    stats.ac.enviadas++;
    irA('afd');
    setTimeout(animar, 350);
    toast(`Se agregó "${prefijo}" al inicio para pasar de q0 a ${AC.estadoAFDFase[inicioFase]}`);
  });

  // Modo editor
  function salirEditor() {
    if (!acEditMalla) return;
    acEditMalla = null;
    $('#acEdit').checked = false;
    $('#acValidate').disabled = true;
    renderAC();
  }
  $('#acEdit').addEventListener('change', e => {
    if (e.target.checked) {
      acPausa();
      acEditMalla = Object.assign({}, acActual().malla);
      $('#acValidate').disabled = false;
      $('#acConfigResult').innerHTML = '<span class="muted">Toca las cavidades para cambiar su estado.</span>';
      renderAC();
    } else { salirEditor(); $('#acConfigResult').innerHTML = ''; }
  });
  function editarCelda(id) {
    if (!acEditMalla) return;
    const cel = AC.celdas.find(c => c.id === id);
    const lista = cel.tipo === 'A' ? AC.estadosA : AC.estadosV;
    acEditMalla[id] = lista[(lista.indexOf(acEditMalla[id]) + 1) % lista.length];
    $('#acConfigResult').innerHTML = '';
    renderAC();
  }
  $('#acValidate').addEventListener('click', () => {
    if (!acEditMalla) return;
    const r = AC.validarConfiguracion(acEditMalla);
    r.valida ? stats.ac.configOk++ : stats.ac.configBad++;
    guardarStats();
    $('#acConfigResult').innerHTML = r.valida
      ? '<span class="ok">✓ Configuración válida.</span> Cumple las reglas de sincronización aurículo-ventricular.'
      : '<span class="bad">✕ Configuración inválida.</span><ul>' + r.errores.map(e => `<li>${escapeHtml(e)}</li>`).join('') + '</ul>';
  });

  /* ==========================================================
     Estadísticas
     ========================================================== */
  function renderStats() {
    const a = stats.afd, c = stats.ac, css = Charts.css;
    const tasa = a.total ? Math.round(a.ok / a.total * 100) : 0;
    const kpis = [
      ['🧪', a.total, 'Cadenas validadas'],
      ['✅', a.total ? tasa + '%' : '—', 'Tasa de aceptación'],
      ['❤️', a.latidos, 'Latidos completos en cadenas aceptadas'],
      ['🔁', c.pasos, 'Pasos simulados del autómata celular']
    ];
    $('#kpis').innerHTML = kpis.map(([i, v, l]) => `<div class="kpi"><div class="kpi__icon">${i}</div><div class="kpi__value">${v}</div><div class="kpi__label">${l}</div></div>`).join('');

    Charts.donut($('#chartDonut'), [
      { label: 'Aceptadas', value: a.ok, color: css('--ok') },
      { label: 'Rechazadas', value: a.bad, color: css('--bad') }
    ], a.total ? tasa + '%' : '', 'aceptadas', 'Valida algunas cadenas en el AFD para ver esta gráfica.');

    const colSym = { p: css('--st-d'), t: css('--primary'), v: css('--st-s'), T: css('--st-r') };
    const totalSym = Object.values(a.sym).reduce((x, y) => x + y, 0);
    Charts.bars($('#chartSymbols'), AFD.alfabeto.map(s => ({ label: s, sub: AFD.simbolos[s].replace(/ \(.*\)/, ''), value: a.sym[s], color: colSym[s] }))
      .concat([{ label: 'otros', sub: 'Fuera del alfabeto', value: a.sym.otros, color: css('--muted') }]),
    { labelW: 170, total: totalSym, vacio: 'Aún no has escrito símbolos.' });

    Charts.bars($('#chartFail'), ['q0', 'q1', 'q2', 'q3', 'q4'].map(q => ({ label: q, sub: AFD.corto[q], value: a.fallaEn[q], color: css('--bad') })),
      { labelW: 90, vacio: 'Ninguna cadena ha fallado todavía. ¡Prueba una inválida!' });

    const colF = [css('--st-d'), css('--st-r'), css('--st-s'), css('--st-r')];
    Charts.bars($('#chartPhases'), AC.marcapasos.map((at, i) => ({ label: AC.estadoAFDFase[i], sub: `${at}, ${AC.respuestaV[at]}`, value: c.fases[i], color: colF[i] })),
      { labelW: 90, total: c.pasos, vacio: 'Corre la simulación del autómata celular para ver esta gráfica.' });

    const fav = AFD.alfabeto.slice().sort((x, y) => a.sym[y] - a.sym[x])[0];
    const peor = Object.keys(a.fallaEn).sort((x, y) => a.fallaEn[y] - a.fallaEn[x])[0];
    const facts = [];
    if (a.total) {
      facts.push(['📏', `Longitud promedio de tus cadenas: <b>${(a.largoTotal / a.total).toFixed(1)}</b> símbolos.`]);
      if (a.masLarga) facts.push(['🏆', `Cadena aceptada más larga: <code>${escapeHtml(a.masLarga.length > 24 ? a.masLarga.slice(0, 24) + '…' : a.masLarga)}</code> (${a.masLarga.length} símbolos).`]);
      if (a.sym[fav]) facts.push(['⭐', `Tu evento favorito es <b>${fav}</b>: ${AFD.simbolos[fav].toLowerCase()}.`]);
      if (a.fallaEn[peor]) facts.push(['⚠️', `La mayoría de los errores ocurren en <b>${peor}</b> (${AFD.corto[peor]}).`]);
      facts.push(['⏱️', `A 75 latidos por minuto, tus latidos aceptados equivalen a <b>${(a.latidos * 0.8).toFixed(1)} s</b> de actividad cardiaca.`]);
    }
    if (c.pasos) facts.push(['🫀', `El autómata celular ha completado <b>${Math.floor(c.pasos / 4)}</b> ciclo(s) cardiaco(s) completo(s).`]);
    if (c.configOk + c.configBad) facts.push(['🧩', `Configuraciones probadas en el editor: <b>${c.configOk}</b> válidas y <b>${c.configBad}</b> inválidas.`]);
    if (c.enviadas) facts.push(['🔗', `Enviaste <b>${c.enviadas}</b> secuencia(s) del autómata celular al AFD.`]);
    if (!facts.length) facts.push(['💡', 'Usa el validador y el simulador: aquí aparecerán datos curiosos sobre tu sesión.']);
    $('#facts').innerHTML = facts.map(([i, t]) => `<li><span>${i}</span>${t}</li>`).join('');
  }
  $('#statsReset').addEventListener('click', () => {
    const hist = stats.historial;
    stats = statsDefault(); stats.historial = hist;
    guardarStats(); renderStats(); toast('Estadísticas reiniciadas');
  });

  /* ---------------- Inicio ---------------- */
  buildGraph();
  reiniciarAFD();
  renderHistory();
  renderAC();
  const hash = location.hash.replace('#', '');
  if (['inicio', 'afd', 'ac', 'stats'].includes(hash)) irA(hash);
})();
