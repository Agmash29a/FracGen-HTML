/*
 * FracGen — browser interface
 *
 * This replaces FORM_MainScreen.frm and FORM_Settings.frm, without any
 * dependencies, transpilation, network requests, or JavaScript frameworks.
 *
 * Original concepts retained:
 *   Settings, GenerateSet(), FractalSet, ColourScheme, M, K,
 *   x1/x2/y1/y2, cx/cy, XWidth/YWidth, and the palette parameters.
 */
(function (global) {
  'use strict';

  const F = global.FracGen;
  const $ = (id) => document.getElementById(id);
  const form = $('settingsForm');
  const canvas = $('fractalCanvas');
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: false });

  let Settings = { ...F.CONSTANTS };
  let previousViews = [];
  let activePresetIndex = 0;
  let renderToken = 0;
  let lastRendered = null;
  let selection = null;

  const INTEGER_FIELDS = new Set([
    'FractalSet', 'ColourScheme', 'M', 'K', 'XWidth', 'YWidth',
    'LINE_x1', 'LINE_y1', 'LINE_z1', 'LINE_x2', 'LINE_y2', 'LINE_z2',
    'xc', 'yc', 'ZIndex', 'r', 'RGB_R', 'RGB_G', 'RGB_B'
  ]);
  const BYTE_FIELDS = [
    'LINE_x1', 'LINE_y1', 'LINE_z1', 'LINE_x2', 'LINE_y2', 'LINE_z2',
    'xc', 'yc', 'ZIndex', 'RGB_R', 'RGB_G', 'RGB_B'
  ];

  // **** Assign default settings **** (FORM_MainScreen.Form_Load)
  function assignSettings(values) {
    Settings = { ...F.CONSTANTS, ...values };
    for (const [key, value] of Object.entries(Settings)) {
      const input = $(key);
      if (input) input.value = String(value);
    }
    refreshFormula();
    refreshSwatch();
    refreshCoordinates();
  }

  function getSettings() {
    // **** Validate new settings **** (FORM_Settings.BUTTON_Update_Click)
    const result = {};
    for (const key of Object.keys(F.CONSTANTS)) {
      const input = $(key);
      if (!input) continue;
      const trimmed = input.value.trim();
      const value = Number(trimmed);
      if (trimmed === '' || !Number.isFinite(value)) {
        throw new Error(`${key} must be a finite number.`);
      }
      if (INTEGER_FIELDS.has(key) && !Number.isInteger(value)) {
        throw new Error(`${key} must be a whole number.`);
      }
      result[key] = value;
    }

    if (result.M < 1 || result.M > F.CONSTANTS.MAX_M) {
      throw new Error('M must be between 1 and 1999.');
    }
    if (result.K < 1 || result.K > 2000) {
      throw new Error('K must be between 1 and 2000.');
    }
    if (result.XWidth < 100 || result.XWidth > 1800 ||
        result.YWidth < 100 || result.YWidth > 1800) {
      throw new Error('Image width and height must be between 100 and 1800 pixels.');
    }
    if (result.XWidth * result.YWidth > 2500000) {
      throw new Error('Please keep the image under 2.5 million pixels.');
    }
    if (!(result.x1 < result.x2) || !(result.y1 < result.y2)) {
      throw new Error('The minimum complex-plane coordinates must be smaller than the maximums.');
    }
    if (![0, 1, 2, 3, 4].includes(result.FractalSet) ||
        ![0, 1, 2, 3, 4, 5, 6].includes(result.ColourScheme)) {
      throw new Error('Choose a valid fractal and colour scheme.');
    }
    for (const key of BYTE_FIELDS) {
      if (result[key] < 0 || result[key] > 255) {
        throw new Error(`${key} must be between 0 and 255.`);
      }
    }
    if (result.r < 0 || result.r > 126) {
      throw new Error('r must be between 0 and 126 (original VB6 convention).');
    }
    return result;
  }

  function refreshFormula() {
    const index = Number($('FractalSet').value);
    const type = F.SET_TYPES[index] || F.SET_TYPES[0];
    $('formulaText').textContent = type.formula;
    $('juliaFields').hidden = index === 0;
  }

  function refreshSwatch() {
    try {
      const draft = { ...Settings };
      draft.K = Math.max(1, Number($('K').value) || 1);
      draft.ColourScheme = Number($('ColourScheme').value);
      for (const field of Object.keys(draft)) {
        if ($(field) && $(field).value.trim() !== '' && Number.isFinite(Number($(field).value))) {
          draft[field] = Number($(field).value);
        }
      }
      $('paletteStrip').style.background = F.ColourSwatch(draft);
    } catch (_) {
      $('paletteStrip').style.background = '#aaa';
    }
  }

  function formatNumber(value) {
    if (Math.abs(value) < 1e-14) return '0';
    if (Math.abs(value) < 0.0001 || Math.abs(value) >= 10000) return value.toExponential(5);
    return Number(value.toPrecision(8)).toString();
  }

  function refreshCoordinates() {
    $('realRange').textContent = `${formatNumber(Settings.x1)} → ${formatNumber(Settings.x2)}`;
    $('imagRange').textContent = `${formatNumber(Settings.y1)} → ${formatNumber(Settings.y2)}`;
  }

  function showError(message) {
    $('formError').hidden = !message;
    $('formError').textContent = message || '';
  }

  function setStatus(message, busy = false) {
    $('statusText').textContent = message;
    $('statusIndicator').classList.toggle('busy', busy);
    $('liveDot').style.background = busy ? '#c49d63' : '#8d65cb';
  }

  function updatePresetButtons() {
    document.querySelectorAll('.preset').forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === activePresetIndex));
    });
  }

  function updateHistoryButton() {
    $('undoButton').disabled = previousViews.length === 0;
  }

  function addHistory() {
    previousViews.push({ ...Settings });
    if (previousViews.length > 35) previousViews.shift();
    updateHistoryButton();
  }

  function applyView(nextSettings, presetIndex = null) {
    addHistory();
    activePresetIndex = presetIndex;
    assignSettings(nextSettings);
    updatePresetButtons();
    GenerateSet();
  }

  // **** Copy the finished fractal into the page background ****
  //
  // The original DrawColouredPixel() palette remains untouched. Make a SMALL
  // alpha-masked copy of the image: the black portions become transparent,
  // while bright fractal filaments keep their colour, so they can live on a
  // white page. No second fractal is calculated and the PNG export is intact.
  function UpdateAmbientBackground() {
    try {
      const preview = document.createElement('canvas');
      const scale = Math.min(1, 480 / Math.max(canvas.width, canvas.height));
      preview.width = Math.max(1, Math.round(canvas.width * scale));
      preview.height = Math.max(1, Math.round(canvas.height * scale));

      const previewContext = preview.getContext('2d');
      if (!previewContext) return;
      previewContext.drawImage(canvas, 0, 0, preview.width, preview.height);

      const imageData = previewContext.getImageData(0, 0, preview.width, preview.height);
      F.MakeAmbientImageData(imageData);
      previewContext.putImageData(imageData, 0, 0);
      document.documentElement.style.setProperty(
        '--ambient-artwork',
        `url("${preview.toDataURL('image/png')}")`
      );
    } catch (error) {
      // The background is optional and must never interrupt fractal rendering.
      console.warn('Ambient background could not be updated:', error);
    }
  }

  function UpdateAmbientSettings() {
    const enabled = $('ambientEnabled').checked;
    const intensity = Number($('ambientStrength').value) / 100;
    const style = $('ambientStyle').value;

    $('ambientStrength').disabled = !enabled;
    $('ambientStyle').disabled = !enabled;
    $('ambientStrengthValue').textContent = `${Math.round(intensity * 100)}%`;
    $('workspace').dataset.ambientStyle = style;

    // On a white page, low opacity avoids overpowering the text.
    document.documentElement.style.setProperty(
      '--ambient-opacity',
      enabled ? (0.18 + 0.58 * intensity).toFixed(3) : '0'
    );
    document.documentElement.style.setProperty(
      '--ambient-panel-opacity',
      enabled ? (0.12 + 0.45 * intensity).toFixed(3) : '0'
    );
  }

  // **** Generate a Mandelbrot or Julia set **** (FORM_MainScreen.GenerateSet)
  // Rendering is broken into short scanline batches to keep the UI responsive.
  function GenerateSet() {
    let newSettings;
    try {
      newSettings = getSettings();
    } catch (error) {
      showError(error.message);
      return;
    }

    showError('');
    Settings = newSettings;
    refreshCoordinates();
    renderToken += 1;                  // cancels any older animation-frame job
    const thisRender = renderToken;
    const started = performance.now();
    let y = 0;

    // **** Clear screen and refresh ****
    canvas.width = Settings.XWidth;
    canvas.height = Settings.YWidth;
    // White exterior is added by JustTheSet; the canvas otherwise stays black.
    const imageData = context.createImageData(Settings.XWidth, Settings.YWidth);
    $('canvasWrap').style.aspectRatio = `${Settings.XWidth} / ${Settings.YWidth}`;
    $('imageTitle').textContent = F.SET_TYPES[Settings.FractalSet].label;
    $('imageFormula').textContent = F.SET_TYPES[Settings.FractalSet].formula;
    $('imageResolution').textContent = `${Settings.XWidth} × ${Settings.YWidth} px`;
    $('saveButton').disabled = true;
    $('saveAgainButton').disabled = true;
    $('renderOverlay').hidden = false;
    $('progressTrack').hidden = false;
    $('cancelButton').hidden = false;
    $('progressFill').style.width = '0%';
    lastRendered = null;
    setStatus('Generating… 0%', true);

    function nextFrame() {
      if (thisRender !== renderToken) return;
      const firstRow = y;
      const deadline = performance.now() + 13;

      do {
        F.GenerateScanline(y, imageData, Settings);
        y += 1;
      } while (y < Settings.YWidth && performance.now() < deadline);

      context.putImageData(imageData, 0, 0, 0, firstRow, Settings.XWidth, y - firstRow);
      const percent = Math.floor((y / Settings.YWidth) * 100);
      $('progressFill').style.width = `${percent}%`;
      $('overlayProgress').textContent = `${percent}% complete · ${y} of ${Settings.YWidth} lines`;
      setStatus(`Generating… ${percent}%`, true);

      if (y < Settings.YWidth) {
        requestAnimationFrame(nextFrame);
      } else {
        const elapsed = ((performance.now() - started) / 1000).toFixed(2);
        $('renderOverlay').hidden = true;
        $('progressTrack').hidden = true;
        $('cancelButton').hidden = true;
        $('saveButton').disabled = false;
        $('saveAgainButton').disabled = false;
        lastRendered = { ...Settings };
        UpdateAmbientBackground();
        setStatus(`Rendered in ${elapsed}s · ${Settings.XWidth.toLocaleString()} × ${Settings.YWidth.toLocaleString()} pixels`);
      }
    }
    requestAnimationFrame(nextFrame);
  }

  function cancelGeneration() {
    renderToken += 1;
    $('cancelButton').hidden = true;
    $('renderOverlay').hidden = true;
    $('progressTrack').hidden = true;
    setStatus('Generation cancelled. The partial image is shown.');
  }

  function saveBlob(blob, filename) {
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1500);
  }

  function SaveImage() {
    if (!lastRendered) return;
    canvas.toBlob((blob) => {
      if (blob) saveBlob(blob, `FracGen-${F.SET_TYPES[lastRendered.FractalSet].label.replaceAll(/[^a-z\d]+/gi, '-')}.png`);
    }, 'image/png');
  }

  function SaveSettings() {
    let values;
    try { values = getSettings(); } catch (error) { showError(error.message); return; }
    const record = {
      application: 'FracGen-HTML',
      version: 1,
      original: 'https://github.com/Agmash29a/FracGen',
      settings: values
    };
    saveBlob(new Blob([JSON.stringify(record, null, 2) + '\n'], { type: 'application/json' }), 'FracGen-settings.json');
  }

  function getCanvasPixel(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: F.clamp((event.clientX - rect.left) * canvas.width / rect.width, 0, canvas.width),
      y: F.clamp((event.clientY - rect.top) * canvas.height / rect.height, 0, canvas.height)
    };
  }

  function zoom(factor, x = Settings.XWidth / 2, y = Settings.YWidth / 2) {
    const view = F.ZoomAt(Settings, x, y, factor);
    if (view.x1 === view.x2 || view.y1 === view.y2) return;
    applyView(view);
  }

  function updateSelectionBox(a, b) {
    const left = Math.min(a.x, b.x) / canvas.width * 100;
    const top = Math.min(a.y, b.y) / canvas.height * 100;
    const width = Math.abs(a.x - b.x) / canvas.width * 100;
    const height = Math.abs(a.y - b.y) / canvas.height * 100;
    Object.assign($('zoomBox').style, {
      left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`
    });
  }

  function onPointerDown(event) {
    if (event.button !== 0 || !lastRendered) return;
    const start = getCanvasPixel(event);
    selection = { start, current: start, pointerId: event.pointerId };
    $('zoomBox').hidden = false;
    updateSelectionBox(start, start);
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const point = getCanvasPixel(event);
    if (selection && event.pointerId === selection.pointerId) {
      selection.current = point;
      updateSelectionBox(selection.start, point);
    }
    const z = F.PixelToComplex(point.x, point.y, Settings);
    $('mousePosition').textContent = `Cursor: ${formatNumber(z.x)} ${z.y < 0 ? '−' : '+'} ${formatNumber(Math.abs(z.y))}i`;
  }

  function onPointerUp(event) {
    if (!selection || event.pointerId !== selection.pointerId) return;
    const { start, current } = selection;
    selection = null;
    $('zoomBox').hidden = true;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    const dx = Math.abs(start.x - current.x);
    const dy = Math.abs(start.y - current.y);
    if (dx < 8 || dy < 8) return;
    const view = F.ZoomToRectangle(Settings, start.x, start.y, current.x, current.y);
    if (view.x1 < view.x2 && view.y1 < view.y2) applyView(view);
  }

  function initialise() {
    if (!context) { showError('Your browser does not support HTML5 Canvas 2D.'); return; }

    for (const item of F.SET_TYPES) {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.label;
      $('FractalSet').appendChild(opt);
    }
    F.SCHEMES.forEach((name, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = name;
      $('ColourScheme').appendChild(opt);
    });

    // Build presets using DOM APIs, avoiding untrusted HTML injection.
    F.PRESETS.forEach((preset, index) => {
      const button = document.createElement('button');
      button.className = 'preset';
      button.type = 'button';
      const dot = document.createElement('span');
      dot.className = 'preset-dot';
      dot.style.background = preset.colour;
      const title = document.createElement('strong');
      title.textContent = preset.name;
      const subtitle = document.createElement('small');
      subtitle.textContent = preset.subtitle;
      button.append(dot, title, subtitle);
      button.addEventListener('click', () => {
        // Original preset also restores the original resolution and palette.
        applyView({ ...F.CONSTANTS, ...preset.settings }, index);
      });
      $('presets').appendChild(button);
    });

    // Ambient options affect only presentation, not M, K or the fractal image.
    $('ambientEnabled').addEventListener('change', UpdateAmbientSettings);
    $('ambientStrength').addEventListener('input', UpdateAmbientSettings);
    $('ambientStyle').addEventListener('change', UpdateAmbientSettings);
    UpdateAmbientSettings();

    assignSettings(F.CONSTANTS);
    updatePresetButtons();
    updateHistoryButton();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      let next;
      try { next = getSettings(); } catch (error) { showError(error.message); return; }
      if (Object.keys(F.CONSTANTS).some((key) => next[key] !== Settings[key])) addHistory();
      activePresetIndex = null;
      updatePresetButtons();
      GenerateSet();
    });
    form.addEventListener('input', () => { refreshSwatch(); });
    $('FractalSet').addEventListener('change', refreshFormula);
    $('resetButton').addEventListener('click', () => applyView(F.CONSTANTS, 0));
    $('saveButton').addEventListener('click', SaveImage);
    $('saveAgainButton').addEventListener('click', SaveImage);
    $('saveSettingsButton').addEventListener('click', SaveSettings);
    $('cancelButton').addEventListener('click', cancelGeneration);
    $('zoomInButton').addEventListener('click', () => zoom(0.65));
    $('zoomOutButton').addEventListener('click', () => zoom(1.5));
    $('undoButton').addEventListener('click', () => {
      if (!previousViews.length) return;
      const prior = previousViews.pop();
      activePresetIndex = null;
      assignSettings(prior);
      updatePresetButtons();
      updateHistoryButton();
      GenerateSet();
    });
    document.querySelectorAll('[data-resolution]').forEach((button) => {
      button.addEventListener('click', () => {
        const [width, height] = button.dataset.resolution.split('x').map(Number);
        $('XWidth').value = width;
        $('YWidth').value = height;
      });
    });

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', () => { selection = null; $('zoomBox').hidden = true; });
    canvas.addEventListener('pointerleave', () => {
      if (!selection) $('mousePosition').textContent = 'Hover over the image to inspect coordinates';
    });
    canvas.addEventListener('wheel', (event) => {
      if (!lastRendered) return;
      event.preventDefault();
      const point = getCanvasPixel(event);
      zoom(event.deltaY > 0 ? 1.4 : 0.70, point.x, point.y);
    }, { passive: false });

    document.addEventListener('keydown', (event) => {
      if (event.target.closest('input, select, textarea, button')) return;
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); GenerateSet(); }
      if (event.key === 'Escape') { cancelGeneration(); }
      if (event.key === 'Backspace' && previousViews.length) {
        event.preventDefault(); $('undoButton').click();
      }
    });

    GenerateSet();
  }

  initialise();
})(globalThis);
