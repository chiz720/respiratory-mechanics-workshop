/**
 * Mean Airway Pressure interactive (slide after Pressure):
 * Paw = K x (PIP - PEEP) x (Ti/TCT) + PEEP
 * K = 1.0 for a square (pressure-control-like) waveform, 0.5 for an
 * ascending-ramp (volume-control-like) waveform (Pilbeam's Mechanical
 * Ventilation, 8th ed.).
 */
(function () {
  const PH = window.PlotHelpers;

  const pipSlider = document.getElementById('maw-pip-slider');
  const peepSlider = document.getElementById('maw-peep-slider');
  const rrSlider = document.getElementById('maw-rr-slider');
  const ieSlider = document.getElementById('maw-ie-slider');
  const pipOut = document.getElementById('maw-pip-output');
  const peepOut = document.getElementById('maw-peep-output');
  const rrOut = document.getElementById('maw-rr-output');
  const ieOut = document.getElementById('maw-ie-output');
  const container = document.getElementById('maw-chart');
  const pawOut = document.getElementById('maw-paw-output');
  const tiOut = document.getElementById('maw-ti-output');
  const btnSquare = document.getElementById('maw-mode-square');
  const btnRamp = document.getElementById('maw-mode-ramp');
  if (!pipSlider || !container) return;

  let mode = 'ramp';

  // Format a Ti/TCT fraction as a conventional I:E ratio label, correctly
  // covering both normal ratios (Ti < Te, e.g. "1:2") and inverse ratios
  // (Ti > Te, e.g. "2:1", used in pressure-controlled inverse ratio ventilation).
  function formatIE(f) {
    if (Math.abs(f - 0.5) < 0.005) return '1:1';
    return f < 0.5
      ? '1:' + ((1 - f) / f).toFixed(1)
      : (f / (1 - f)).toFixed(1) + ':1';
  }

  function render() {
    const pip = parseFloat(pipSlider.value);
    const peep = parseFloat(peepSlider.value);
    const rr = parseFloat(rrSlider.value);
    const f = parseFloat(ieSlider.value); // Ti/TCT fraction
    pipOut.textContent = pip + ' cmH₂O';
    peepOut.textContent = peep + ' cmH₂O';
    rrOut.textContent = rr + ' /min';
    ieOut.textContent = formatIE(f);

    const tct = 60 / rr;
    const ti = tct * f;
    const k = mode === 'square' ? 1.0 : 0.5;
    const paw = k * (pip - peep) * f + peep;

    tiOut.textContent = ti.toFixed(2) + ' s (of ' + tct.toFixed(2) + ' s cycle)';
    pawOut.textContent = paw.toFixed(1) + ' cmH₂O';

    const pts = mode === 'square'
      ? [[0, peep], [0, pip], [ti, pip], [ti, peep], [tct, peep]]
      : [[0, peep], [ti, pip], [ti, peep], [tct, peep]];

    const chart = PH.makeChart(container, {
      width: 640, height: 260,
      xDomain: [0, tct], yDomain: [0, 50],
      xLabel: 'Time (s)', yLabel: 'Pressure (cmH₂O)', xTicks: 4, yTicks: 5
    });
    const pxPts = pts.map(p => [chart.x(p[0]), chart.y(p[1])]);
    chart.addPath(PH.areaPath(pxPts, chart.y(0)), { fill: 'var(--accent-2)', opacity: 0.18, stroke: 'none' });
    chart.addPath(PH.linePath(pxPts), { stroke: 'var(--accent-2)' });
    chart.addLine(chart.x(0), chart.y(paw), chart.x(tct), chart.y(paw), { stroke: 'var(--accent-3)', 'stroke-width': 2 });
    chart.addText(chart.x(tct) - 4, chart.y(paw) - 6, 'Paw = ' + paw.toFixed(1), { 'text-anchor': 'end', fill: 'var(--accent-3)', 'font-weight': 'bold' });
  }

  function setMode(newMode) {
    mode = newMode;
    btnSquare.classList.toggle('active', mode === 'square');
    btnRamp.classList.toggle('active', mode === 'ramp');
    render();
  }

  btnSquare.addEventListener('click', () => setMode('square'));
  btnRamp.addEventListener('click', () => setMode('ramp'));
  [pipSlider, peepSlider, rrSlider, ieSlider].forEach(s => s.addEventListener('input', render));
  render();
})();
