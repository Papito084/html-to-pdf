Add-Type -AssemblyName System.Drawing

# Imagen del intento redondeado anterior (la que gustaba)
$srcPng  = 'C:\Users\alexr\.gemini\antigravity\brain\6e590d6c-4b33-4491-8a32-d7ba52566632\html_pdf_icon_rounded_1780930218339.png'
$dstIco  = 'C:\Users\alexr\OneDrive\Documentos\Codigo\HTML-to-PDF\icon.ico'
$htmlFile = 'C:\Users\alexr\OneDrive\Documentos\Codigo\HTML-to-PDF\index.html'
$shortcut = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'HTML a PDF.lnk')

$size   = 256
$radius = 72   # ~28% del tamaño - redondeado visible pero no circular

# ── 1. Aplicar esquinas redondeadas ───────────────────────────
$src = [System.Drawing.Image]::FromFile($srcPng)
$dst = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$g = [System.Drawing.Graphics]::FromImage($dst)
$g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$g.Clear([System.Drawing.Color]::Transparent)

# Rounded rectangle path
$d    = $radius * 2
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0,            0,            $d, $d, 180, 90)
$path.AddArc($size - $d,   0,            $d, $d, 270, 90)
$path.AddArc($size - $d,   $size - $d,   $d, $d,   0, 90)
$path.AddArc(0,            $size - $d,   $d, $d,  90, 90)
$path.CloseFigure()

$g.SetClip($path)
$g.DrawImage($src, 0, 0, $size, $size)
$g.ResetClip()
$g.Dispose()
$src.Dispose()

# ── 2. Guardar PNG con alpha ──────────────────────────────────
$ms = New-Object System.IO.MemoryStream
$dst.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Close()
$dst.Dispose()

# ── 3. Escribir ICO 32-bit con transparencia ──────────────────
$fw = [System.IO.File]::Create($dstIco)
$bw = New-Object System.IO.BinaryWriter($fw)
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]1)
$bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([byte]0)
$bw.Write([uint16]1); $bw.Write([uint16]32)
$bw.Write([uint32]$pngBytes.Length)
$bw.Write([uint32]22)
$bw.Write($pngBytes)
$bw.Close(); $fw.Close()

Write-Host "ICO redondeado creado: $dstIco"

# ── 4. Actualizar acceso directo ──────────────────────────────
if (Test-Path $shortcut) { Remove-Item $shortcut }
$wsh = New-Object -ComObject WScript.Shell
$lnk = $wsh.CreateShortcut($shortcut)
$lnk.TargetPath   = $htmlFile
$lnk.Description  = 'Convertidor HTML a PDF'
$lnk.IconLocation = "$dstIco,0"
$lnk.Save()

# ── 5. Limpiar caché de iconos ────────────────────────────────
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600
Get-Item "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache*.db" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Start-Process explorer
Write-Host "Listo."
