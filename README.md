# Autómatas del Corazón

Aplicación web que compara dos modelos discretos del ciclo cardiaco:

- **Autómata Finito Determinista (AFD):** valida cadenas sobre Σ = {p, t, v, T} con animación paso a paso, diagrama de estados, tabla δ y un electrocardiograma generado a partir de la cadena.
- **Autómata Celular (AC):** malla 2×2 (aurículas y ventrículos) que evoluciona con un marcapasos. Tiene controles para avanzar, retroceder, reproducir y reiniciar, un modo editor para validar configuraciones y la opción de enviar la secuencia generada al AFD.
- **Estadísticas:** tasa de aceptación, símbolos más usados, fases donde fallan las cadenas, tiempo del corazón en cada fase y datos curiosos de la sesión.

Proyecto basado en el póster *"Análisis comparativo entre autómatas celulares y autómatas finitos deterministas para modelar el ciclo cardiaco"*, Facultad de Ingeniería, UACH.

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| HTML5 | Estructura de la página y pestañas |
| CSS3 (variables, Grid, Flexbox, animaciones) | Diseño responsivo, tema claro/oscuro y animaciones del corazón |
| JavaScript (ES6, sin frameworks) | Lógica de los autómatas, animaciones e interacción |
| SVG | Diagrama de estados, electrocardiograma y gráficas de estadísticas (hechas a mano, sin librerías) |
| localStorage | Guarda el historial, las estadísticas y el tema en el navegador del usuario |
| Google Fonts | Tipografías Poppins, Inter y JetBrains Mono |
| Node.js (solo para pruebas) | `node tests/automatas.test.js` verifica la lógica de ambos autómatas |
| Netlify | Hospedaje estático |

No requiere instalar nada ni compilar: es un sitio estático.

## Estructura

```
index.html            Página principal
css/styles.css        Estilos
js/automatas.js       Lógica pura del AFD y del AC (sin interfaz)
js/charts.js          Gráficas SVG
js/app.js             Interfaz y animaciones
img/                  Logos UACH y Facultad de Ingeniería
tests/                Pruebas de la lógica
```

## Probar en tu computadora

Abre `index.html` en el navegador, o ejecuta `npx serve .` en la carpeta.

## Subir a GitHub

```bash
cd app-automatas
git init
git add .
git commit -m "Primera versión de Autómatas del Corazón"
git branch -M main
git remote add origin https://github.com/DanielEmilianoJF/NOMBRE-DEL-REPO.git
git push -u origin main
```

## Publicar en Netlify

1. Entra a app.netlify.com y elige **Add new site → Import an existing project → GitHub**.
2. Selecciona el repositorio.
3. Deja vacío el *Build command* y pon `.` como *Publish directory*.
4. Presiona **Deploy**. Cada `git push` vuelve a publicar el sitio.

Otra opción sin GitHub: arrastra la carpeta completa a app.netlify.com/drop.
