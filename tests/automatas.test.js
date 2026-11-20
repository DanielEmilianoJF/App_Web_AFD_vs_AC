// Ejecutar con: node tests/automatas.test.js
const assert = require('assert');
const { AFD, AC } = require('../js/automatas.js');

const casos = [
  ['ptvT', true, 'q1'],
  ['T', true, 'q1'],
  ['p', true, 'q2'],
  ['t', true, 'q3'],
  ['v', true, 'q4'],
  ['TptvT', true, 'q1'],
  ['ptvTptvT', true, 'q1'],
  ['p t v T', true, 'q1'],
  ['', false, 'q0'],
  ['pp', false, 'q5'],
  ['pv', false, 'q5'],
  ['ptvx', false, 'q5'],
  ['PTVT', false, 'q5'],
  ['ptvTt', false, 'q5']
];
for (const [cad, ok, fin] of casos) {
  const r = AFD.procesar(cad);
  assert.strictEqual(r.aceptada, ok, `aceptación de "${cad}"`);
  assert.strictEqual(r.final, fin, `estado final de "${cad}"`);
}
assert.strictEqual(AFD.procesar('ptvTptvT').latidos, 2);
assert.strictEqual(AFD.procesar('pv').falla, 1);

for (let i = 0; i < 200; i++) {
  assert.ok(AFD.procesar(AFD.generarValida()).aceptada);
  assert.ok(!AFD.procesar(AFD.generarInvalida()).aceptada);
}

// El AC genera la secuencia p t v T ... y siempre configuraciones válidas
let c = AC.inicial();
let generada = '';
assert.ok(AC.validarConfiguracion(c.malla).valida);
for (let i = 0; i < 12; i++) {
  c = AC.paso(c);
  generada += c.simbolo;
  assert.ok(AC.validarConfiguracion(c.malla).valida, `paso ${i}`);
}
assert.strictEqual(generada, 'ptvTptvTptvT');
assert.ok(AFD.procesar('T' + generada).aceptada, 'el AFD acepta lo que genera el AC');
assert.ok(!AC.validarConfiguracion({ ai: 'AD', ad: 'AD', vi: 'VD', vd: 'VS' }).valida);
assert.ok(!AC.validarConfiguracion({ ai: 'AS', ad: 'AD', vi: 'VD', vd: 'VS' }).valida);

console.log('✔ Todas las pruebas pasaron');
