/* ==========================================================
   Lógica de los dos autómatas (sin interfaz).
   Basada en el póster "Análisis comparativo entre autómatas
   celulares y autómatas finitos deterministas para modelar el
   ciclo cardiaco" (Facultad de Ingeniería, UACH).
   ========================================================== */
(function (global) {
  'use strict';

  /* ---------------- Autómata Finito Determinista ----------------
     A = (Q, Σ, δ, q0, F)                                           */
  const AFD = {
    alfabeto: ['p', 't', 'v', 'T'],
    simbolos: {
      p: 'Despolarización auricular (onda P)',
      t: 'Repolarización auricular',
      v: 'Despolarización ventricular (complejo QRS)',
      T: 'Repolarización ventricular (onda T)'
    },
    estados: ['q0', 'q1', 'q2', 'q3', 'q4', 'q5'],
    descripcion: {
      q0: 'Inicio (reposo)',
      q1: 'Aurícula en diástole, ventrículo en sístole (AD, VS)',
      q2: 'Período refractario auricular y ventricular (AR, VR)',
      q3: 'Aurícula en sístole, ventrículo en diástole (AS, VD)',
      q4: 'Período refractario auricular y ventricular (AR, VR)',
      q5: 'Estado de error (símbolo inesperado)'
    },
    corto: { q0: 'Inicio', q1: 'AD · VS', q2: 'AR · VR', q3: 'AS · VD', q4: 'AR · VR', q5: 'Error' },
    inicial: 'q0',
    aceptacion: ['q1', 'q2', 'q3', 'q4'],
    error: 'q5',
    // Tabla de transición δ (cualquier otro símbolo lleva a q5)
    delta: {
      q0: { p: 'q2', t: 'q3', v: 'q4', T: 'q1' },
      q1: { p: 'q2', t: 'q5', v: 'q5', T: 'q5' },
      q2: { p: 'q5', t: 'q3', v: 'q5', T: 'q5' },
      q3: { p: 'q5', t: 'q5', v: 'q4', T: 'q5' },
      q4: { p: 'q5', t: 'q5', v: 'q5', T: 'q1' },
      q5: { p: 'q5', t: 'q5', v: 'q5', T: 'q5' }
    },

    /** Quita espacios y comas para que "p t v T" o "p,t,v,T" también funcionen. */
    limpiar(cadena) {
      return String(cadena || '').replace(/[\s,;]+/g, '');
    },

    transicion(estado, simbolo) {
      const fila = this.delta[estado];
      return (fila && fila[simbolo]) || this.error;
    },

    /** Procesa la cadena completa y devuelve el recorrido. */
    procesar(cadenaOriginal) {
      const cadena = this.limpiar(cadenaOriginal);
      const pasos = [];
      let estado = this.inicial;
      let falla = -1;
      for (let i = 0; i < cadena.length; i++) {
        const s = cadena[i];
        const siguiente = this.transicion(estado, s);
        pasos.push({ i, simbolo: s, desde: estado, hacia: siguiente, valido: this.alfabeto.includes(s) });
        if (siguiente === this.error && falla === -1) falla = i;
        estado = siguiente;
      }
      const aceptada = this.aceptacion.includes(estado);
      let motivo;
      if (cadena.length === 0) motivo = 'La cadena está vacía: el autómata se queda en q0, que no es de aceptación.';
      else if (aceptada) motivo = 'La secuencia de eventos es fisiológicamente válida.';
      else {
        const p = pasos[falla];
        motivo = this.alfabeto.includes(p.simbolo)
          ? `En la posición ${falla + 1}, el símbolo "${p.simbolo}" no puede ocurrir estando en ${p.desde} (${this.corto[p.desde]}).`
          : `En la posición ${falla + 1}, "${p.simbolo}" no pertenece al alfabeto Σ = {p, t, v, T}.`;
      }
      return {
        cadena,
        pasos,
        recorrido: [this.inicial].concat(pasos.map(p => p.hacia)),
        final: estado,
        aceptada,
        falla,
        estadoAntesDeFalla: falla >= 0 ? pasos[falla].desde : null,
        latidos: pasos.filter(p => p.desde === 'q4' && p.hacia === 'q1').length,
        motivo
      };
    },

    /** Genera una cadena válida aleatoria siguiendo el ciclo cardiaco. */
    generarValida(largo) {
      const n = Math.max(1, largo || 4 + Math.floor(Math.random() * 9));
      let estado = this.inicial;
      let out = '';
      for (let i = 0; i < n; i++) {
        const opciones = this.alfabeto.filter(s => this.transicion(estado, s) !== this.error);
        const s = opciones[Math.floor(Math.random() * opciones.length)];
        out += s;
        estado = this.transicion(estado, s);
      }
      return out;
    },

    /** Genera una cadena que probablemente sea inválida. */
    generarInvalida() {
      const base = this.generarValida(3 + Math.floor(Math.random() * 5));
      const pos = Math.floor(Math.random() * base.length) + 1;
      const extra = ['x', 'p', 'v', 't', 'T'][Math.floor(Math.random() * 5)];
      const cand = base.slice(0, pos) + extra + base.slice(pos);
      return this.procesar(cand).aceptada ? cand + 'pp' : cand;
    }
  };

  /* ---------------- Autómata Celular ----------------
     AC = (L, S, N, δ)
     L: malla 2x2 (fila superior aurículas, inferior ventrículos)
     S: SA = {AD, AS, AR}, SV = {VD, VS, VR}
     N: vecindad vertical (cada ventrículo mira a la aurícula de arriba)
     δ: las aurículas siguen al marcapasos (señal global);
        cada ventrículo responde a la aurícula superior.            */
  const AC = {
    celdas: [
      { id: 'ai', nombre: 'Aurícula izquierda', tipo: 'A' },
      { id: 'ad', nombre: 'Aurícula derecha', tipo: 'A' },
      { id: 'vi', nombre: 'Ventrículo izquierdo', tipo: 'V' },
      { id: 'vd', nombre: 'Ventrículo derecho', tipo: 'V' }
    ],
    estadosA: ['AD', 'AS', 'AR'],
    estadosV: ['VD', 'VS', 'VR'],
    nombreEstado: {
      AD: 'Diástole', AS: 'Sístole', AR: 'Refractario',
      VD: 'Diástole', VS: 'Sístole', VR: 'Refractario'
    },
    // Fases del marcapasos (coinciden con q1..q4 del AFD)
    marcapasos: ['AD', 'AR', 'AS', 'AR'],
    // Símbolo eléctrico que produce cada transición de fase (fase -> fase+1)
    simboloFase: ['p', 't', 'v', 'T'],
    estadoAFDFase: ['q1', 'q2', 'q3', 'q4'],
    // Regla de sincronización aurícula -> ventrículo
    respuestaV: { AD: 'VS', AS: 'VD', AR: 'VR' },

    inicial() {
      // "La malla inicia en reposo en la aurícula y contracción del ventrículo (AD, VS)"
      return { fase: 0, t: 0, malla: { ai: 'AD', ad: 'AD', vi: 'VS', vd: 'VS' } };
    },

    /** Un paso de tiempo: las cuatro celdas se actualizan en paralelo. */
    paso(config) {
      const fase = (config.fase + 1) % 4;
      const sA = this.marcapasos[fase];
      const nueva = {
        ai: sA,
        ad: sA,
        // el ventrículo depende de la aurícula directamente superior
        vi: this.respuestaV[sA],
        vd: this.respuestaV[sA]
      };
      return { fase, t: config.t + 1, malla: nueva, simbolo: this.simboloFase[config.fase] };
    },

    /** Revisa si una configuración arbitraria cumple las reglas fisiológicas. */
    validarConfiguracion(malla) {
      const errores = [];
      const columnas = [['ai', 'vi', 'izquierdo'], ['ad', 'vd', 'derecho']];
      for (const [a, v, lado] of columnas) {
        const esperado = this.respuestaV[malla[a]];
        if (malla[v] !== esperado) {
          errores.push(`Lado ${lado}: si la aurícula está en ${this.nombreEstado[malla[a]]} (${malla[a]}), el ventrículo debe estar en ${this.nombreEstado[esperado]} (${esperado}), no en ${malla[v]}.`);
        }
      }
      if (malla.ai !== malla.ad) errores.push('Las dos aurículas deben estar en la misma fase (las marca el mismo marcapasos).');
      if (malla.vi !== malla.vd) errores.push('Los dos ventrículos deben contraerse de forma coordinada.');
      return { valida: errores.length === 0, errores };
    }
  };

  global.AFD = AFD;
  global.AC = AC;
  if (typeof module !== 'undefined' && module.exports) module.exports = { AFD, AC };
})(typeof window !== 'undefined' ? window : globalThis);
