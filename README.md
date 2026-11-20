# Autómatas del Corazón

Aplicación web que compara dos modelos discretos del ciclo cardiaco:

- **Autómata Finito Determinista (AFD):** valida cadenas sobre Σ = {p, t, v, T} con animación paso a paso, diagrama de estados, tabla δ y un electrocardiograma generado a partir de la cadena.
- **Autómata Celular (AC):** malla 2×2 (aurículas y ventrículos) que evoluciona guiada por un marcapasos. Incluye controles para avanzar, retroceder, reproducir y reiniciar, un modo editor para validar configuraciones y la opción de enviar la secuencia generada al AFD.
- **Estadísticas:** tasa de aceptación, símbolos más usados, fases donde fallan las cadenas, tiempo del corazón en cada fase y datos curiosos de la sesión.

Proyecto basado en el póster *"Análisis comparativo entre autómatas celulares y autómatas finitos deterministas para modelar el ciclo cardiaco"*, Facultad de Ingeniería, UACH.

## Tecnologías utilizadas

### HTML5
Define la estructura de toda la aplicación en un solo archivo (`index.html`). Contiene el encabezado con los logos de la UACH y de la Facultad de Ingeniería, la barra de pestañas (Inicio, Autómata Finito, Autómata Celular y Estadísticas) y cada sección con sus tarjetas, botones, campo de entrada y tablas. Se usaron atributos de accesibilidad (`role`, `aria-label`, `aria-live`) para que los lectores de pantalla puedan recorrer la aplicación.

### CSS3
Da todo el diseño visual (`css/styles.css`):
- **Variables CSS** para definir la paleta de colores en un solo lugar y permitir el **tema claro y oscuro**.
- **CSS Grid y Flexbox** para acomodar las tarjetas, el teclado de símbolos y la malla 2×2 del autómata celular.
- **Media queries** para que la aplicación se adapte a celular, tableta y computadora.
- **Animaciones y transiciones** (`@keyframes`) para el corazón que late en la portada, la contracción de las cavidades en sístole, el resaltado de estados y la aparición de cada sección.

### JavaScript (ES6, sin frameworks)
Contiene toda la lógica y la interacción, separada en tres archivos:
- `js/automatas.js`: la **lógica pura de los dos autómatas**. Define el AFD como la tupla A = (Q, Σ, δ, q0, F) con su tabla de transición, procesa una cadena símbolo por símbolo y explica por qué se acepta o se rechaza. También define el autómata celular AC = (L, S, N, δ): la malla, los estados de cada cavidad, la vecindad vertical, la regla del marcapasos y la validación de configuraciones.
- `js/app.js`: la **interfaz**. Controla las pestañas, el teclado de símbolos, la animación paso a paso (con `async/await` y temporizadores), los controles Play, Anterior, Siguiente y Reiniciar del autómata celular, el modo editor, el historial y el cálculo de las estadísticas.
- `js/charts.js`: genera las **gráficas** de la sección de estadísticas (dona y barras).

### SVG (gráficos vectoriales)
Se generan desde JavaScript, sin librerías externas, para:
- Dibujar el **diagrama de estados** del AFD con flechas y etiquetas, resaltando el estado y la transición activos durante la animación.
- Trazar el **electrocardiograma** de cada cadena: la onda P para `p`, la repolarización auricular para `t`, el complejo QRS para `v` y la onda T para `T`. Cuando la cadena es inválida, el trazo se corta.
- Construir las **gráficas de estadísticas**, que se ven nítidas en cualquier tamaño de pantalla.

### localStorage (Web Storage API)
Guarda en el navegador de cada usuario el historial de cadenas validadas, las estadísticas acumuladas y la preferencia de tema claro u oscuro, para que no se pierdan al recargar la página.

### Google Fonts
Proporciona las tipografías: **Poppins** para títulos, **Inter** para el texto y **JetBrains Mono** para los símbolos, estados y cadenas.

### Node.js (pruebas)
El archivo `tests/automatas.test.js` usa el módulo `assert` de Node.js para comprobar automáticamente que ambos autómatas funcionan bien: que el AFD acepte y rechace las cadenas correctas, que el autómata celular produzca siempre configuraciones válidas, y que la secuencia generada por el autómata celular sea aceptada por el AFD.

### Git y GitHub
Control de versiones del código y almacenamiento del repositorio.

### Netlify
Hospedaje del sitio. El archivo `netlify.toml` le indica a Netlify que publique la carpeta tal cual, sin compilar nada. Cada cambio que se sube a GitHub se publica automáticamente.

## Estructura del proyecto

```
index.html            Estructura de la página
css/styles.css        Estilos, temas y animaciones
js/automatas.js       Lógica del AFD y del autómata celular
js/app.js             Interfaz e interacción
js/charts.js          Gráficas SVG
img/                  Logos UACH y Facultad de Ingeniería
tests/                Pruebas de la lógica
netlify.toml          Configuración de Netlify
```

## Autores

Emiliano Piñón Marín y Daniel Emiliano Jiménez Frade (Facultad de Ingeniería, UACH). Gabriel Arenas Ballesteros (Facultad de Medicina y Ciencias Biomédicas).
