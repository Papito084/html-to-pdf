/* ============================================================
   HTML → PDF Converter — JavaScript Logic
   Estrategia: blob URL + iframe en (0,0) con opacity casi 0
   → el navegador pinta el iframe → html2canvas lo captura OK
   → jsPDF genera el PDF página a página
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────
let currentTab     = 'code';
let loadedFileHTML = '';
let toastTimer     = null;

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('html-input');
  textarea.addEventListener('input', updateCharCount);

  // Ctrl+Enter → convertir
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      convertToPDF();
    }
  });

  // Tab → 2 espacios en el editor
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = textarea.selectionStart;
      const en = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, s) + '  ' + textarea.value.substring(en);
      textarea.selectionStart = textarea.selectionEnd = s + 2;
      updateCharCount();
    }
  });
});

// ─── Tabs ─────────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`tab-${tab}`).setAttribute('aria-selected', 'true');
  document.getElementById(`panel-${tab}`).classList.add('active');
}

// ─── Code Editor ──────────────────────────────────────────────
function updateCharCount() {
  const n = document.getElementById('html-input').value.length;
  document.getElementById('char-count').textContent = n.toLocaleString('es-ES') + ' caracteres';
}

function clearCode() {
  document.getElementById('html-input').value = '';
  updateCharCount();
  hidePreview();
  showToast('Editor limpiado', 'info');
}

function loadExample() {
  const example = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ejemplo de PDF</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f8f9fa;
      color: #1a1a2e;
      padding: 40px;
    }
    .header {
      background: linear-gradient(135deg, #6c63ff, #38bdf8);
      color: white;
      padding: 32px 40px;
      border-radius: 16px;
      margin-bottom: 32px;
    }
    .header h1 { font-size: 2.2rem; margin-bottom: 6px; }
    .header p  { opacity: 0.85; font-size: 1rem; }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.25);
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 0.8rem;
      margin-top: 10px;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      border-left: 4px solid;
    }
    .card-blue   { border-color: #6c63ff; }
    .card-cyan   { border-color: #38bdf8; }
    .card-purple { border-color: #a78bfa; }
    .card-value { font-size: 2rem; font-weight: 800; margin-bottom: 4px; }
    .card-label { font-size: 0.85rem; color: #666; }
    .section-title {
      font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;
      padding-bottom: 8px; border-bottom: 2px solid #eee; color: #1a1a2e;
    }
    table {
      width: 100%; border-collapse: collapse; background: white;
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 28px;
    }
    thead tr { background: linear-gradient(135deg, #6c63ff, #5854d6); color: white; }
    thead th  { padding: 14px 20px; text-align: left; font-weight: 600; font-size: 0.9rem; }
    tbody tr:nth-child(even) { background: #f8f9fa; }
    tbody td { padding: 13px 20px; font-size: 0.88rem; border-bottom: 1px solid #f0f0f0; }
    .status { display:inline-block; padding:3px 12px; border-radius:999px; font-size:0.75rem; font-weight:600; }
    .ok    { background:#d1fae5; color:#065f46; }
    .pend  { background:#fef3c7; color:#92400e; }
    .fail  { background:#fee2e2; color:#991b1b; }
    .footer-note { text-align:center; color:#999; font-size:0.78rem; padding-top:24px; border-top:1px solid #eee; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Informe de Resultados</h1>
    <p>Generado automáticamente con HTML → PDF Converter</p>
    <div class="badge">✅ Versión Demo</div>
  </div>
  <div class="card-grid">
    <div class="card card-blue">
      <div class="card-value" style="color:#6c63ff">1,284</div>
      <div class="card-label">Registros procesados</div>
    </div>
    <div class="card card-cyan">
      <div class="card-value" style="color:#38bdf8">97.3%</div>
      <div class="card-label">Tasa de éxito</div>
    </div>
    <div class="card card-purple">
      <div class="card-value" style="color:#a78bfa">2.4s</div>
      <div class="card-label">Tiempo medio</div>
    </div>
  </div>
  <div class="section-title">📋 Detalle de operaciones</div>
  <table>
    <thead>
      <tr><th>#</th><th>Operación</th><th>Responsable</th><th>Fecha</th><th>Estado</th></tr>
    </thead>
    <tbody>
      <tr><td>001</td><td>Exportación de datos</td><td>Sistema</td><td>08/06/2026</td><td><span class="status ok">✓ OK</span></td></tr>
      <tr><td>002</td><td>Validación de registros</td><td>Módulo A</td><td>08/06/2026</td><td><span class="status ok">✓ OK</span></td></tr>
      <tr><td>003</td><td>Procesamiento batch</td><td>Módulo B</td><td>08/06/2026</td><td><span class="status pend">⏳ Pendiente</span></td></tr>
      <tr><td>004</td><td>Sincronización remota</td><td>API externa</td><td>08/06/2026</td><td><span class="status fail">✗ Error</span></td></tr>
      <tr><td>005</td><td>Generación de informes</td><td>Reportes</td><td>08/06/2026</td><td><span class="status ok">✓ OK</span></td></tr>
    </tbody>
  </table>
  <div class="footer-note">Generado con ❤️ usando HTML → PDF Converter</div>
</body>
</html>`;

  document.getElementById('html-input').value = example;
  updateCharCount();
  showToast('Ejemplo cargado. ¡Pulsa Convertir!', 'success');
  refreshPreview();
}

// ─── File Panel ───────────────────────────────────────────────
function triggerFileInput() { document.getElementById('file-input').click(); }

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) loadFile(file);
}

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('dropzone').classList.add('drag-over');
}

function handleDragLeave(event) {
  event.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('dropzone').classList.remove('drag-over');
  const files = event.dataTransfer.files;
  if (!files || files.length === 0) return;
  const file = files[0];
  if (!file.name.match(/\.(html|htm)$/i)) {
    showToast('⚠️ Solo se aceptan archivos .html y .htm', 'error');
    return;
  }
  loadFile(file);
}

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    loadedFileHTML = e.target.result;
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = formatBytes(file.size);
    const lines = loadedFileHTML.split('\n').slice(0, 60).join('\n');
    document.getElementById('file-code-preview-content').textContent =
      lines + (loadedFileHTML.split('\n').length > 60 ? '\n...' : '');
    document.getElementById('dropzone').style.display    = 'none';
    document.getElementById('file-preview').style.display = 'block';
    showToast(`📂 "${file.name}" cargado correctamente`, 'success');
  };
  reader.onerror = () => showToast('❌ Error al leer el archivo', 'error');
  reader.readAsText(file, 'UTF-8');
}

function removeFile() {
  loadedFileHTML = '';
  document.getElementById('file-input').value = '';
  document.getElementById('dropzone').style.display    = 'block';
  document.getElementById('file-preview').style.display = 'none';
  hidePreview();
  showToast('Archivo eliminado', 'info');
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─── Preview ──────────────────────────────────────────────────
function refreshPreview() {
  const html = getHTMLContent();
  if (!html.trim()) return;
  const section = document.getElementById('preview-section');
  const iframe  = document.getElementById('preview-iframe');
  section.style.display = 'block';
  iframe.srcdoc = html;
}

function hidePreview() {
  document.getElementById('preview-section').style.display = 'none';
}

function getHTMLContent() {
  return currentTab === 'code'
    ? document.getElementById('html-input').value.trim()
    : loadedFileHTML.trim();
}

// ─── Opciones ─────────────────────────────────────────────────
function getOptions() {
  // parseMargin: devuelve el valor numérico del input.
  // IMPORTANTE: no usar `|| default` porque 0 es falsy y se convertiría en default.
  const pm = (id, def = 10) => {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? def : v;          // solo usa default si el campo está vacío/inválido
  };
  return {
    filename:     (document.getElementById('pdf-filename').value.trim() || 'documento') + '.pdf',
    format:       document.getElementById('pdf-format').value,
    orientation:  document.getElementById('pdf-orientation').value,
    scale:        parseInt(document.getElementById('pdf-scale').value, 10) || 2,
    marginTop:    pm('margin-top'),
    marginRight:  pm('margin-right'),
    marginBottom: pm('margin-bottom'),
    marginLeft:   pm('margin-left'),
    background:   document.getElementById('opt-background').checked,
    compress:     document.getElementById('opt-compress').checked,
  };
}


// ─── PRECARGA DE FUENTES EXTERNAS ────────────────────────────
// html2canvas renderiza texto con las fuentes del DOCUMENTO PADRE
// (no del iframe). Si el HTML usa Google Fonts (u otras fuentes
// externas) y estas no están en el padre, el texto se ve mal:
// letras solapadas, palabras juntas, espaciado incorrecto.
//
// Esta función:
//   1. Extrae las URLs de Google Fonts del HTML
//   2. Descarga el CSS de fuentes
//   3. Descarga cada fichero de fuente
//   4. Los registra en document.fonts del DOCUMENTO PADRE
//
// Así cuando html2canvas llama a ctx.measureText('Lato'), la
// encuentra y mide correctamente → texto perfecto.
async function preloadFontsFromHTML(html) {
  // Buscar todos los <link> de Google Fonts en el HTML
  const linkRe = /<link[^>]*href=["'](https:\/\/fonts\.googleapis\.com\/css[^"']+)["'][^>]*>/gi;
  const googleFontUrls = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    googleFontUrls.push(m[1]);
  }
  if (googleFontUrls.length === 0) return; // sin fuentes externas

  for (const cssUrl of googleFontUrls) {
    try {
      const res = await fetch(cssUrl);
      if (!res.ok) continue;
      const css = await res.text();

      // Parsear cada bloque @font-face
      const blockRe = /@font-face\s*\{([^}]+)\}/g;
      const loaders  = [];
      let block;

      while ((block = blockRe.exec(css)) !== null) {
        const content  = block[1];
        const srcM     = /src:\s*url\(["']?([^"')]+)["']?\)/.exec(content);
        const famM     = /font-family:\s*["']?([^;"']+)["']?/.exec(content);
        const wgtM     = /font-weight:\s*([^;]+)/.exec(content);
        const styleM   = /font-style:\s*([^;]+)/.exec(content);

        if (!srcM || !famM) continue;

        const fontUrl = srcM[1].trim();
        const family  = famM[1].trim().replace(/['"]/g, '');
        const weight  = wgtM   ? wgtM[1].trim()   : '400';
        const style   = styleM ? styleM[1].trim()  : 'normal';

        // Cargar la fuente en el documento PADRE
        const ff = new FontFace(family, `url('${fontUrl}')`, { weight, style });
        loaders.push(
          ff.load()
            .then(f => { document.fonts.add(f); })
            .catch(() => { /* si falla una fuente, continuamos */ })
        );
      }

      if (loaders.length > 0) await Promise.all(loaders);
    } catch (e) {
      console.warn('[PDF] No se pudieron precargar fuentes:', e.message);
    }
  }

  // Esperar a que todas las fuentes estén disponibles en el padre
  await document.fonts.ready;
}


// ─── CONVERSIÓN PRINCIPAL ─────────────────────────────────────
async function convertToPDF() {
  const html = getHTMLContent();
  if (!html) {

    showToast('⚠️ No hay código HTML. Pega código o sube un archivo.', 'error');
    return;
  }

  const {
    filename, format, orientation, scale,
    marginTop, marginRight, marginBottom, marginLeft,
    background, compress,
  } = getOptions();

  setConverting(true);

  // Dimensiones de página en mm → px a 96 dpi
  const FORMATS = {
    a4:     { w: 210, h: 297 },
    letter: { w: 216, h: 279 },
    a3:     { w: 297, h: 420 },
    a5:     { w: 148, h: 210 },
    legal:  { w: 216, h: 356 },
  };
  const fmt     = FORMATS[format] || FORMATS.a4;
  const isLS    = orientation === 'landscape';
  const pageWmm = isLS ? fmt.h : fmt.w;
  const pageHmm = isLS ? fmt.w : fmt.h;
  const MM2PX   = 96 / 25.4;
  const pageWpx = Math.round(pageWmm * MM2PX);

  const extraCSS = `<style id="__pdffix__">
    /* Fidelidad de color */
    * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }

    /* ── Reset de estilos de "visualización en browser" ──────────────
       El HTML puede tener body con fondo gris, padding, flex centrado,
       sombras, etc. Para el PDF queremos el contenido puro, sin nada
       de eso alrededor. */
    html, body {
      background: white !important;
      background-color: white !important;
      padding: 0 !important;
      margin: 0 !important;
      min-height: unset !important;
      display: block !important;   /* anula flex/grid del body */
      width: 100% !important;
    }
    /* El contenedor principal (ej. .page, .cv, .resume, .container…)
       puede tener margin:auto para centrarse; lo anulamos */
    body > * {
      margin-left: 0 !important;
      margin-right: 0 !important;
      margin-top: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      box-shadow: none !important;   /* las sombras se ven mal en PDF */
    }
  </style>`;

  const preparedHTML = injectStyles(html, extraCSS);

  let iframe = null;

  try {
    // ── Paso 1: comprobar librerías ──────────────────────────
    if (typeof html2canvas !== 'function') {
      throw new Error('html2canvas no está cargado. Comprueba tu conexión a internet y recarga la página.');
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF no está cargado. Comprueba tu conexión a internet y recarga la página.');
    }

    // ── Paso 1b: precargar fuentes en el documento PADRE ─────
    // html2canvas renderiza con las fuentes del padre, no del iframe.
    // Si no las precargamos aquí, usa fallbacks → texto solapado.
    showToast('⏳ Cargando fuentes…', 'info');
    await preloadFontsFromHTML(html);

    // ── Paso 2: crear iframe de captura ──────────────────────
    showToast('⏳ Paso 1/3 — Renderizando HTML…', 'info');


    iframe = document.createElement('iframe');
    iframe.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      `width:${pageWpx}px`,
      'height:1px',
      'border:none',
      'z-index:2147483647',
      'opacity:0.0001',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(iframe);

    // Cargar HTML + esperar a que el documento esté listo
    await new Promise((resolve) => {
      iframe.addEventListener('load', () => {
        // Esperar también a que las fuentes web terminen de cargar
        // (clave para evitar que html2canvas capture con fuentes fallback
        //  y produzca palabras juntas / kerning incorrecto)
        const iwin = iframe.contentWindow;
        if (iwin && iwin.document && iwin.document.fonts) {
          iwin.document.fonts.ready
            .then(resolve)
            .catch(resolve);            // si falla, seguimos de todos modos
        } else {
          resolve();
        }
      }, { once: true });

      // Fallback: si onload o fonts.ready no disparan en 5 s, continuamos
      setTimeout(resolve, 5000);

      iframe.srcdoc = preparedHTML;
    });

    // Pausa adicional para imágenes y últimos retoques de layout
    await sleep(400);

    // Acceder al documento interno
    const iDoc = iframe.contentDocument
               || (iframe.contentWindow && iframe.contentWindow.document);

    if (!iDoc || !iDoc.documentElement) {
      throw new Error('No se pudo acceder al documento del iframe.');
    }

    // ── Paso 3: medir contenido ──────────────────────────────
    const onePageH = Math.round(pageHmm * MM2PX); // px exactos de 1 página PDF

    const captureH = Math.max(iDoc.documentElement.scrollHeight, 100);
    iframe.style.height = captureH + 'px';
    await sleep(200); // repintar con la nueva altura

    // ── Paso 4: captura html2canvas ──────────────────────────
    showToast('⏳ Paso 2/3 — Capturando contenido…', 'info');

    const canvas = await Promise.race([
      html2canvas(iDoc.documentElement, {
        scale,
        useCORS:         true,
        allowTaint:      true,
        backgroundColor: '#ffffff',
        logging:         false,
        width:           pageWpx,
        height:          captureH,
        windowWidth:     pageWpx,
        windowHeight:    captureH,
        scrollX:         0,
        scrollY:         0,
      }),
      new Promise((_, reject) =>
        setTimeout(() =>
          reject(new Error('html2canvas tardó más de 30s. Prueba a reducir la escala a 1x.')),
          30000
        )
      ),
    ]);


    // El iframe ya no hace falta
    document.body.removeChild(iframe);
    iframe = null;

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('El canvas está vacío. El HTML puede tener errores de sintaxis.');
    }

    // ── Paso 5: generar PDF con jsPDF ────────────────────────
    showToast('⏳ Paso 3/3 — Generando PDF…', 'info');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format, orientation, compress });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    const contentW    = pdfW - marginLeft - marginRight;
    const contentH    = pdfH - marginTop  - marginBottom;
    const pxPerMm     = canvas.width / contentW;
    const canvasPageH = contentH * pxPerMm;   // px de canvas por página
    const quality     = compress ? 0.72 : 0.95;

    // ─── FIX: 1 sola página cuando el contenido la roza ─────────────
    // Si el canvas desborda menos del 20% de una página (ej. un CV de
    // 1 hoja que por el renderizado de fuentes mide 1140px en vez de 1123px),
    // escalamos la imagen para que quepa exactamente en 1 página PDF
    // sin cortar contenido ni añadir una segunda página casi vacía.
    if (canvas.height <= canvasPageH * 1.20) {
      // Renderizado completo en 1 página (escalado proporcional si es necesario)
      const imgHeightMm = (canvas.height / canvas.width) * contentW;
      const finalH      = Math.min(imgHeightMm, contentH); // nunca más alto que la página
      const imgData     = canvas.toDataURL('image/jpeg', quality);
      pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, contentW, finalH);
      pdf.save(filename);
      showToast(`✅ "${filename}" descargado — 1 página`, 'success');
      refreshPreview();
      return;
    }

    // Múltiples páginas: división normal
    const totalPages = Math.ceil(canvas.height / canvasPageH);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      const srcY = Math.round(page * canvasPageH);
      const srcH = Math.min(Math.round(canvasPageH), canvas.height - srcY);

      // Franja del canvas para esta página
      const slice = document.createElement('canvas');
      slice.width  = canvas.width;
      slice.height = Math.round(canvasPageH);
      const ctx = slice.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      pdf.addImage(
        slice.toDataURL('image/jpeg', quality),
        'JPEG',
        marginLeft, marginTop,
        contentW,   contentH
      );
    }

    pdf.save(filename);
    showToast(`✅ "${filename}" descargado — ${totalPages} página(s)`, 'success');
    refreshPreview();


  } catch (err) {
    console.error('[PDF Error]', err);
    showToast('❌ Error: ' + err.message, 'error');
  } finally {
    // Siempre limpiar el iframe y desbloquear el botón
    if (iframe && iframe.parentNode) {
      document.body.removeChild(iframe);
    }
    setConverting(false);
  }
}


// ─── Helpers ──────────────────────────────────────────────────
function injectStyles(html, cssBlock) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, cssBlock + '</head>');
  return cssBlock + html;
}

function setConverting(isConverting) {
  const btn     = document.getElementById('btn-convert');
  const content = btn.querySelector('.btn-convert-content');
  const loader  = btn.querySelector('.btn-convert-loader');
  btn.disabled          = isConverting;
  content.style.display = isConverting ? 'none' : 'flex';
  loader.style.display  = isConverting ? 'flex' : 'none';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className   = `toast ${type}`;
  void toast.offsetWidth; // reflow
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}
