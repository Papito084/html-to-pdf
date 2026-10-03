# HTML to PDF Converter

Herramienta profesional de renderizado en el navegador que convierte documentos web (HTML/CSS) en archivos PDF rasterizados, manteniendo la fidelidad visual, la inyección de estilos y el layout en formato estandarizado.

## 🏗️ Arquitectura y Funcionamiento Interno
- **Renderizado del DOM Virtual:** 
  - La aplicación hace uso de `html2canvas` para analizar recursivamente el árbol DOM (Document Object Model) y aplicar algoritmos de renderizado de CSS que clonan la estructura visual sobre un lienzo (`<canvas>`).
- **Codificación a Formato Documento (PDF):** 
  - A través de `jsPDF`, se instancia un motor de generación de documentos portátiles que captura la data-URI generada en el Canvas, escalando y paginando el contenido para adaptarlo automáticamente a la resolución de una página A4.
- **Aislamiento y Seguridad (Zero-Trust):** 
  - Al utilizar la `FileReader API` y buffers en memoria del navegador, todo el ciclo de vida de la conversión ocurre en un hilo local del cliente. El código fuente nunca pasa por un backend centralizado, eliminando riesgos de intercepción de datos confidenciales.

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

## 🚀 Instalación y Puesta en Marcha
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Papito084/html-to-pdf.git
   ```
2. Arquitectura descentralizada: no necesita Node.js ni Webpack. Solo se requiere iniciar `index.html` en un navegador web.
3. Los módulos están desacoplados, permitiendo que la lógica de conversión en `app.js` sea escalable a otros pipelines (React/Vue/Angular) si el proyecto crece.
