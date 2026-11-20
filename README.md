# AFD vs Autómata Celular: ciclo cardiaco

**Aplicación en línea:** https://app-web-afd-vs-ac.netlify.app

Aplicación web que compara dos modelos discretos del ciclo cardiaco:

- **Autómata Finito Determinista (AFD):** valida cadenas sobre Σ = {p, t, v, T}. Muestra el significado de cada onda, el diagrama de estados (con el mismo acomodo que el póster), una animación paso a paso y el electrocardiograma que genera la cadena.
- **Autómata Celular (AC):** malla 2×2 (aurículas arriba, ventrículos abajo) que evoluciona guiada por un marcapasos. Explica qué pasa en cada estado, muestra las reglas de transición y permite enviar la secuencia generada al AFD.

Forma parte de la investigación *"Análisis comparativo entre autómatas celulares y autómatas finitos deterministas para modelar el ciclo cardiaco"*, presentada como póster en el Congreso Nacional de la Sociedad Matemática Mexicana (SMM). Facultad de Ingeniería, UACH.

## Tecnologías utilizadas

### HTML5
Define la estructura de toda la aplicación en un solo archivo (`index.html`): el encabezado con los logos de la UACH y de la Facultad de Ingeniería, el menú con las tres secciones (Inicio, Autómata Finito Determinista y Autómata Celular) y el contenido de cada una: textos, tablas, botones y el campo para escribir la cadena.

### CSS3
Da el diseño visual (`css/styles.css`): colores, recuadros con bordes rectos, tablas, botones y los colores de cada estado del corazón (azul para diástole, rojo para sístole y amarillo para refractario). Con **CSS Grid** se acomodan las columnas y la malla 2×2, y con **media queries** la página se adapta a la pantalla del celular.

### JavaScript (ES6, sin frameworks)
Contiene toda la lógica y la interacción, separada en dos archivos:
- `js/automatas.js`: la **lógica de los dos autómatas**. Define el AFD como la tupla A = (Q, Σ, δ, q0, F) con su tabla de transición, procesa la cadena símbolo por símbolo y explica por qué se acepta o se rechaza. También define el autómata celular AC = (L, S, N, δ): la malla, los estados de cada cavidad, la regla del marcapasos y la regla de vecindad vertical.
- `js/app.js`: la **interfaz**. Cambia entre secciones, valida la cadena al presionar el botón, hace la animación paso a paso, dibuja el diagrama y el electrocardiograma, y controla los botones Anterior, Reproducir, Siguiente y Reiniciar del autómata celular.

### SVG (gráficos vectoriales)
Se generan desde JavaScript, sin librerías externas, para:
- Dibujar el **diagrama de estados** del AFD con flechas y etiquetas, resaltando el estado y la transición activos durante la animación.
- Trazar el **electrocardiograma** de cada cadena: la onda P para `p`, la repolarización auricular para `t`, el complejo QRS para `v` y la onda T para `T`. Cuando la cadena es inválida, el trazo se corta.

### Node.js (pruebas)
El archivo `tests/automatas.test.js` usa el módulo `assert` de Node.js para comprobar automáticamente que ambos autómatas funcionan bien: que el AFD acepte y rechace las cadenas correctas, que el autómata celular produzca siempre configuraciones válidas, y que la secuencia generada por el autómata celular sea aceptada por el AFD.

### Git y GitHub
Control de versiones del código y almacenamiento del repositorio.

### Netlify
Hospedaje del sitio. El archivo `netlify.toml` le indica a Netlify que publique la carpeta tal cual, sin compilar nada. Cada cambio que se sube a GitHub se publica automáticamente.

## Estructura del proyecto

```
index.html            Estructura de la página
css/styles.css        Estilos
js/automatas.js       Lógica del AFD y del autómata celular
js/app.js             Interfaz e interacción
img/                  Logos UACH y Facultad de Ingeniería
tests/                Pruebas de la lógica
netlify.toml          Configuración de Netlify
```

## Autores

Emiliano Piñón Marín y Daniel Emiliano Jiménez Frade (Facultad de Ingeniería, UACH). Gabriel Arenas Ballesteros (Facultad de Medicina y Ciencias Biomédicas).
