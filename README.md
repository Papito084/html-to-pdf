# HTML to PDF Converter

Herramienta profesional de renderizado en el navegador que convierte documentos web (HTML/CSS) en archivos PDF rasterizados, manteniendo la fidelidad visual, la inyección de estilos y el layout en formato estandarizado.

## 🏗️ Arquitectura y Funcionamiento Interno
- **Renderizado del DOM Virtual:** 
  - La aplicación hace uso de `html2canvas` para analizar recursivamente el árbol DOM (Document Object Model) y aplicar algoritmos de renderizado de CSS que clonan la estructura visual sobre un lienzo (`<canvas>`).
- **Codificación a Formato Documento (PDF):** 
  - A través de `jsPDF`, se instancia un motor de generación de documentos portátiles que captura la data-URI generada en el Canvas, escalando y paginando el contenido para adaptarlo automáticamente a la resolución de una página A4.
- **Aislamiento y Seguridad (Zero-Trust):** 
  - Al utilizar la `FileReader API` y buffers en memoria del navegador, todo el ciclo de vida de la conversión ocurre en un hilo local del cliente. El código fuente nunca pasa por un backend centralizado, eliminando riesgos de intercepción de datos confidenciales.
- **Modularidad y Portabilidad:**
  - Los módulos están fuertemente desacoplados, permitiendo que la lógica de conversión en `app.js` sea escalable a otros pipelines (React/Vue/Angular) si el proyecto crece. Al poseer una arquitectura descentralizada, no requiere de entornos pesados como Node.js ni Webpack.

## 📂 Estructura del Proyecto

```text
html-to-pdf/
├── index.html          # Interfaz de usuario e importación de librerías CDN
├── app.js              # Manejador de eventos y lógica de parseo PDF
├── styles.css          # Variables CSS (Custom Properties) y Responsive Grid
├── icon.png            # Iconografía nativa HQ (Transparencia Alpha)
├── icon.ico            # Formato de binario de icono multipropósito
├── make_shortcut.ps1   # Script PowerShell de instalación de escritorio
└── README.md
```

## 🚀 Puesta en Marcha

### Uso Rápido (En la Web)
Puedes utilizar la herramienta directamente sin instalación previa a través del despliegue en [GitHub Pages](https://papito084.github.io/html-to-pdf/).

### Ejecución en Local
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Papito084/html-to-pdf.git
   cd html-to-pdf
   ```
2. **Abrir en el navegador:**
   Al ser una arquitectura ligera sin dependencias de compilación (zero-build), basta con abrir `index.html` en cualquier navegador moderno:
   - **En Windows (PowerShell):** `start index.html`
   - **En macOS:** `open index.html`
   - **En Linux:** `xdg-open index.html`

*(Opcionalmente, puedes ejecutar `make_shortcut.ps1` para generar un acceso directo de escritorio en Windows).*
