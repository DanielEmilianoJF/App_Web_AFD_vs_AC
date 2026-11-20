/* Interfaz de la aplicación: pestañas, AFD y autómata celular */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';
  const crear = (tag, attrs, texto) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (texto != null) n.textContent = texto;
    return n;
  };
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const escapar = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- Pestañas ---------------- */
  function irA(tab) {
    $$('.menu__btn').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
    $$('.pagina').forEach(p => p.classList.toggle('activa', p.id === 'tab-' + tab));
    history.replaceState(null, '', '#' + tab);
    window.scrollTo(0, 0);
  }
  $$('.menu__btn').forEach(b => b.addEventListener('click', () => irA(b.dataset.tab)));
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => irA(b.dataset.goto)));

  /* ==========================================================
     AFD
     ========================================================== */
  const input = $('#afdInput');

  // Diagrama con el mismo acomodo que el póster
  const R = 24;
  const Y = 150;
  const POS = { q0: [70, Y], q1: [210, Y], q2: [360, Y], q3: [510, Y], q4: [650, Y], q5: [435, 50] };
  // Cada arista es una línea con esquinas (puntos) y la posición de su etiqueta
  const ARISTAS = [
    { de: 'q0', a: 'q1', s: 'T', pts: [[70, Y], [210 - R, Y]], lbl: [140, Y - 8] },
    { de: 'q1', a: 'q2', s: 'p', pts: [[210, Y], [360 - R, Y]], lbl: [285, Y - 8] },
    { de: 'q2', a: 'q3', s: 't', pts: [[360, Y], [510 - R, Y]], lbl: [435, Y - 8] },
    { de: 'q3', a: 'q4', s: 'v', pts: [[510, Y], [650 - R, Y]], lbl: [580, Y - 8] },
    { de: 'q0', a: 'q2', s: 'p', pts: [[78, Y], [78, 195], [360, 195], [360, Y + R]], lbl: [92, 190] },
    { de: 'q0', a: 'q3', s: 't', pts: [[68, Y], [68, 220], [510, 220], [510, Y + R]], lbl: [92, 215] },
    { de: 'q0', a: 'q4', s: 'v', pts: [[58, Y], [58, 245], [650, 245], [650, Y + R]], lbl: [92, 240] },
    { de: 'q4', a: 'q1', s: 'T', pts: [[662, Y], [662, 12], [222, 12], [222, Y - R]], lbl: [440, 9] },
    { de: 'q1', a: 'q5', s: 't,v,T', pts: [[204, Y], [204, 44], [435 - R, 44]], lbl: [300, 39] },
    { de: 'q2', a: 'q5', s: 'p,v,T', pts: [[360, Y], [360, 68], [435 - 18, 68]], lbl: [355, 90], anchor: 'end' },
    { de: 'q3', a: 'q5', s: 'p,t,T', pts: [[510, Y], [510, 68], [435 + 18, 68]], lbl: [515, 90], anchor: 'start' },
    { de: 'q4', a: 'q5', s: 'p,t,v', pts: [[644, Y], [644, 44], [435 + R, 44]], lbl: [560, 39] }
  ];
  const clave = (a, b) => a + '>' + b;

  function dibujarDiagrama() {
    const svg = $('#afdGraph');
    svg.innerHTML = '';
    const defs = crear('defs');
    [['punta', '#333'], ['punta-activa', '#d9692b']].forEach(([id, color]) => {
      const m = crear('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 11, markerHeight: 11, markerUnits: 'userSpaceOnUse', orient: 'auto' });
      m.appendChild(crear('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    // flecha de inicio
    const inicio = crear('g', { class: 'arista' });
    inicio.appendChild(crear('path', { d: `M5,${Y} L${70 - R},${Y}`, 'marker-end': 'url(#punta)' }));
    svg.appendChild(inicio);

    for (const e of ARISTAS) {
      const g = crear('g', { class: 'arista', 'data-k': clave(e.de, e.a) });
      const d = e.pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ');
      g.appendChild(crear('path', { d, 'marker-end': 'url(#punta)' }));
      g.appendChild(crear('text', { x: e.lbl[0], y: e.lbl[1], 'text-anchor': e.anchor || 'middle' }, e.s));
      svg.appendChild(g);
    }

    for (const q of AFD.estados) {
      const [x, y] = POS[q];
      const clases = ['nodo'];
      if (q === 'q0') clases.push('inicial');
      if (AFD.aceptacion.includes(q)) clases.push('aceptacion');
      if (q === AFD.error) clases.push('error');
      const g = crear('g', { class: clases.join(' '), 'data-q': q });
      g.appendChild(crear('title', {}, `${q}: ${AFD.descripcion[q]}`));
      g.appendChild(crear('circle', { cx: x, cy: y, r: R, class: 'principal' }));
      if (AFD.aceptacion.includes(q)) g.appendChild(crear('circle', { cx: x, cy: y, r: R - 5, fill: 'none' }));
      g.appendChild(crear('text', { x, y: y + 5 }, q));
      svg.appendChild(g);
    }
  }

  function marcarDiagrama(estado, arista) {
    $$('#afdGraph .nodo').forEach(n => n.classList.toggle('activo', n.dataset.q === estado));
    $$('#afdGraph .arista[data-k]').forEach(g => {
      const on = g.dataset.k === arista;
      g.classList.toggle('activa', on);
      g.querySelector('path').setAttribute('marker-end', on ? 'url(#punta-activa)' : 'url(#punta)');
    });
  }

  // Resultado y recorrido
  function mostrarResultado(estado, titulo, texto) {
    $('#afdResult').dataset.estado = estado;
    $('#afdBadge').textContent = titulo;
    $('#afdMotivo').textContent = texto || '';
  }
  function mostrarRecorrido(r, hasta) {
    const n = hasta == null ? r.recorrido.length : hasta + 1;
    let html = '';
    for (let i = 0; i < n; i++) {
      if (i > 0) html += `<span class="flecha">—${escapar(r.pasos[i - 1].simbolo)}→</span>`;
      html += `<span class="q ${r.recorrido[i] === AFD.error ? 'error' : ''}">${r.recorrido[i]}</span>`;
    }
    $('#afdPath').innerHTML = html;
  }

  // Electrocardiograma
  const SEG = 60, BASE = 100;
  const curva = (i, a, b) => (i < a || i > b) ? 0 : Math.sin(Math.PI * (i - a) / (b - a));
  function onda(sim, x0) {
    if (sim === 'v') return [[0, 0], [16, 0], [20, 8], [26, -78], [32, 22], [37, 0], [60, 0]].map(([dx, dy]) => [x0 + dx, BASE + dy]);
    const pts = [];
    for (let i = 0; i <= SEG; i += 2) {
      let dy = 0;
      if (sim === 'p') dy = -16 * curva(i, 16, 44);
      else if (sim === 't') dy = 7 * curva(i, 14, 42);
      else if (sim === 'T') dy = -26 * curva(i, 10, 52);
      pts.push([x0 + i, BASE + dy]);
    }
    return pts;
  }
  function dibujarECG(r, hasta) {
    const svg = $('#afdEcg');
    const n = r.cadena.length;
    const W = Math.max(600, n * SEG + 20);
    svg.setAttribute('viewBox', `0 0 ${W} 160`);
    svg.style.width = W > 600 ? W + 'px' : '100%';
    svg.innerHTML = '';
    const lim = hasta == null ? n : hasta + 1;
    let bien = [[0, BASE], [10, BASE]], mal = [];
    for (let i = 0; i < lim; i++) {
      const x0 = 10 + i * SEG;
      const enError = r.falla >= 0 && i >= r.falla;
      if (enError) { if (!mal.length) mal.push([x0, BASE]); mal.push([x0 + SEG, BASE]); }
      else bien = bien.concat(onda(r.cadena[i], x0));
      svg.appendChild(crear('text', { x: x0 + SEG / 2, y: 150, class: 'ecg-etiqueta', fill: enError ? '#c62828' : '#444' }, r.cadena[i]));
    }
    svg.appendChild(crear('polyline', { points: bien.map(p => p.join(',')).join(' '), class: 'ecg-linea' }));
    if (mal.length) svg.appendChild(crear('polyline', { points: mal.map(p => p.join(',')).join(' '), class: 'ecg-error' }));
  }

  function mostrarCompleto(r) {
    mostrarRecorrido(r);
    dibujarECG(r);
    const ult = r.pasos[r.pasos.length - 1];
    marcarDiagrama(r.final, ult ? clave(ult.desde, ult.hacia) : null);
    if (!r.cadena.length) mostrarResultado('error', 'Cadena rechazada', r.motivo);
    else if (r.aceptada) mostrarResultado('ok', 'Cadena aceptada', `${r.motivo} Estado final: ${r.final} (${AFD.descripcion[r.final]}).`);
    else mostrarResultado('error', 'Cadena rechazada', r.motivo);
  }

  let animando = false, detener = false;
  function validar() {
    if (animando) detener = true;
    const r = AFD.procesar(input.value);
    input.value = r.cadena;
    mostrarCompleto(r);
  }
  function limpiar() {
    if (animando) detener = true;
    input.value = '';
    $('#afdPath').innerHTML = '<span class="q">q0</span>';
    dibujarECG({ cadena: '', falla: -1 });
    marcarDiagrama('q0', null);
    mostrarResultado('espera', 'Escribe una cadena y presiona Validar.');
  }

  async function pasoAPaso() {
    if (animando) { detener = true; return; }
    const r = AFD.procesar(input.value);
    input.value = r.cadena;
    if (!r.cadena.length) { mostrarCompleto(r); return; }
    animando = true; detener = false;
    $('#afdAnimate').textContent = 'Detener';
    marcarDiagrama('q0', null);
    mostrarRecorrido(r, 0);
    dibujarECG(r, -1);
    mostrarResultado('proceso', 'Estado inicial: q0');
    await esperar(800);
    for (let i = 0; i < r.pasos.length && !detener; i++) {
      const p = r.pasos[i];
      marcarDiagrama(p.hacia, clave(p.desde, p.hacia));
      mostrarRecorrido(r, i + 1);
      dibujarECG(r, i);
      mostrarResultado('proceso', `Leyendo el símbolo ${i + 1}: "${p.simbolo}"`,
        `δ(${p.desde}, ${p.simbolo}) = ${p.hacia}. ${AFD.simbolos[p.simbolo] || 'Símbolo fuera del alfabeto.'}`);
      await esperar(900);
    }
    animando = false; detener = false;
    $('#afdAnimate').textContent = 'Paso a paso';
    mostrarCompleto(r);
  }

  $$('.simbolo').forEach(b => b.addEventListener('click', () => { input.value += b.dataset.sym; input.focus(); }));
  $('#afdValidate').addEventListener('click', validar);
  $('#afdAnimate').addEventListener('click', pasoAPaso);
  $('#afdClear').addEventListener('click', limpiar);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); validar(); } });

  /* ==========================================================
     Autómata celular
     ========================================================== */
  const FASES = [
    { q: 'q1', que: 'Las aurículas se relajan y se llenan de sangre, mientras los ventrículos se contraen y expulsan la sangre hacia las arterias.', sig: 'p (onda P)' },
    { q: 'q2', que: 'Llega la onda P. Aurículas y ventrículos quedan en período refractario: todavía no pueden volver a activarse.', sig: 't (repolarización auricular)' },
    { q: 'q3', que: 'Las aurículas se contraen y empujan la sangre hacia los ventrículos, que están relajados y se llenan.', sig: 'v (complejo QRS)' },
    { q: 'q4', que: 'Llega el complejo QRS. Aurículas y ventrículos vuelven a quedar en período refractario.', sig: 'T (onda T), regresa a q1' }
  ];


  let historial = [AC.inicial()];
  let secuencia = '';
  let reloj = null;
  const actual = () => historial[historial.length - 1];

  function dibujarAC() {
    const c = actual();
    const clase = { D: 'd', S: 's', R: 'r' };
    $('#acGrid').innerHTML = AC.celdas.map(cel => {
      const st = c.malla[cel.id];
      return `<div class="celda ${clase[st[1]]}">
        <span class="nombre">${cel.nombre}</span>
        <span class="estado">${st}</span>
        <span class="desc">${AC.nombreEstado[st]}</span></div>`;
    }).join('');
    const f = FASES[c.fase];
    $('#acGen').textContent = `Paso t = ${c.t} · Estado ${f.q} (${c.malla.ai}, ${c.malla.vi})`;
    $('#acDesc').textContent = f.que;
    $('#acSig').textContent = `Siguiente evento: ${f.sig}.`;
    $('#acFases').innerHTML = '<thead><tr><th>Estado</th><th>Aurículas</th><th>Ventrículos</th><th>¿Qué pasa?</th><th>Siguiente evento</th></tr></thead><tbody>' +
      FASES.map((f, i) => {
        const a = AC.marcapasos[i], v = AC.respuestaV[a];
        return `<tr class="${i === c.fase ? 'actual' : ''}"><td>${f.q}</td><td>${a} (${AC.nombreEstado[a]})</td><td>${v} (${AC.nombreEstado[v]})</td><td>${f.que}</td><td>${f.sig}</td></tr>`;
      }).join('') + '</tbody>';
    $('#acSeq').textContent = secuencia || '—';
    $('#acPrev').disabled = historial.length < 2;
  }

  function siguiente() {
    const n = AC.paso(actual());
    historial.push(n);
    if (historial.length > 200) historial.shift();
    secuencia += n.simbolo;
    if (secuencia.length > 40) secuencia = secuencia.slice(-40);
    dibujarAC();
  }
  function anterior() {
    if (historial.length < 2) return;
    historial.pop();
    secuencia = secuencia.slice(0, -1);
    dibujarAC();
  }
  function pausar() { clearInterval(reloj); reloj = null; $('#acPlay').textContent = 'Reproducir'; }
  function reproducir() {
    if (reloj) return pausar();
    $('#acPlay').textContent = 'Pausa';
    siguiente();
    reloj = setInterval(siguiente, 1200);
  }
  function reiniciar() { pausar(); historial = [AC.inicial()]; secuencia = ''; dibujarAC(); }

  $('#acNext').addEventListener('click', () => { pausar(); siguiente(); });
  $('#acPrev').addEventListener('click', () => { pausar(); anterior(); });
  $('#acPlay').addEventListener('click', reproducir);
  $('#acReset').addEventListener('click', reiniciar);
  $('#acSend').addEventListener('click', () => {
    if (!secuencia) { alertaSuave('Primero avanza la simulación unos pasos.'); return; }
    pausar();
    // La simulación empieza en (AD, VS) = q1; desde q0 se llega a q1 con "T"
    const faseInicio = historial[historial.length - 1 - secuencia.length] ? historial[historial.length - 1 - secuencia.length].fase : 0;
    input.value = AC.simboloFase[(faseInicio + 3) % 4] + secuencia;
    irA('afd');
    setTimeout(pasoAPaso, 300);
  });
  function alertaSuave(msg) {
    const s = $('#acSeq');
    s.textContent = msg;
    setTimeout(() => { s.textContent = secuencia || '—'; }, 2000);
  }

  /* ---------------- Inicio ---------------- */
  dibujarDiagrama();
  limpiar();
  dibujarAC();
  const hash = location.hash.slice(1);
  if (['inicio', 'afd', 'ac'].includes(hash)) irA(hash);
})();
