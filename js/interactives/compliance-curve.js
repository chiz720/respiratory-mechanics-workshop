/**
 * Sigmoid Compliance Curve interactive (slide after Compliance).
 *
 * The respiratory system's pressure-volume relationship is a logistic
 * (S-shaped) curve, not a straight line: V(P) = Vmax / (1 + e^(-k(P-Pmid))).
 * Compliance = dV/dP is the LOCAL slope of that curve, so it is small near
 * the bottom (atelectasis-prone) and top (overdistension-prone) flat
 * portions and largest through the steep middle "sweet spot". Computed here
 * as a literal finite-difference ΔV/ΔP across a small pressure window
 * centered on the operating pressure, matching how it's drawn (a tangent
 * chord) and how it's defined.
 */
(function () {
  const PH = window.PlotHelpers;

  const pSlider = document.getElementById('cc-p-slider');
  const pOut = document.getElementById('cc-p-output');
  const container = document.getElementById('cc-chart');
  const vOut = document.getElementById('cc-v-output');
  const complianceOut = document.getElementById('cc-compliance-output');
  const zoneOut = document.getElementById('cc-zone-output');
  const btnNormal = document.getElementById('cc-mode-normal');
  const btnArds = document.getElementById('cc-mode-ards');
  if (!pSlider || !container) return;

  const CURVES = {
    normal: { vmax: 1000, pmid: 15, k: 0.15 },
    ards: { vmax: 500, pmid: 20, k: 0.12 }
  };
  let mode = 'normal';

  function volumeAt(p, curve) {
    return curve.vmax / (1 + Math.exp(-curve.k * (p - curve.pmid)));
  }

  function render() {
    const p = parseFloat(pSlider.value);
    pOut.textContent = p + ' cmH₂O';
    const curve = CURVES[mode];

    const v = volumeAt(p, curve);
    const h = 3; // cmH2O half-window for the finite-difference slope
    const vLo = volumeAt(Math.max(0, p - h), curve);
    const vHi = volumeAt(Math.min(40, p + h), curve);
    const dP = Math.min(40, p + h) - Math.max(0, p - h);
    const compliance = (vHi - vLo) / dP;

    const peakCompliance = curve.k * curve.vmax * 0.25; // slope at the inflection point (P = pmid)
    const ratio = compliance / peakCompliance;

    vOut.textContent = Math.round(v) + ' mL';
    complianceOut.textContent = compliance.toFixed(1) + ' mL/cmH₂O';
    zoneOut.className = ratio >= 0.7 ? 'ok' : ratio >= 0.3 ? 'warn' : 'danger';
    zoneOut.textContent = ratio >= 0.7
      ? 'optimal'
      : (p < curve.pmid ? 'low (atelectasis)' : 'low (overdistension)');

    const yMax = 1100;
    const chart = PH.makeChart(container, {
      width: 1000, height: 300,
      padding: { top: 24, right: 26, bottom: 46, left: 66 },
      xDomain: [0, 40], yDomain: [0, yMax],
      xLabel: 'Pressure (cmH₂O)', yLabel: 'Volume (mL)', xTicks: 5, yTicks: 5
    });

    const n = 80;
    const curvePts = [];
    for (let i = 0; i <= n; i++) {
      const pp = (i / n) * 40;
      curvePts.push([chart.x(pp), chart.y(volumeAt(pp, curve))]);
    }
    chart.addPath(PH.linePath(curvePts), { stroke: 'var(--accent-2)' });

    // Zone labels, positioned relative to this curve's own midpoint.
    const lowP = Math.max(3, curve.pmid - 14);
    const highP = Math.min(37, curve.pmid + 14);
    chart.addText(chart.x(lowP), chart.y(yMax) + 6, 'atelectasis risk', { 'text-anchor': 'middle', fill: 'var(--danger)' });
    chart.addText(chart.x(curve.pmid), chart.y(yMax) + 6, 'sweet spot', { 'text-anchor': 'middle', fill: 'var(--ok)', 'font-weight': 'bold' });
    chart.addText(chart.x(highP), chart.y(yMax) + 6, 'overdistension risk', { 'text-anchor': 'middle', fill: 'var(--danger)' });

    // Tangent chord through the operating point, visualizing "change in volume over change in pressure".
    const tx1 = Math.max(0, p - h), tx2 = Math.min(40, p + h);
    chart.addPath(PH.linePath([[chart.x(tx1), chart.y(vLo)], [chart.x(tx2), chart.y(vHi)]]), { stroke: 'var(--accent-3)', 'stroke-width': 3 });
    chart.addDot(chart.x(p), chart.y(v), { fill: 'var(--accent-3)', r: 6 });
  }

  function setMode(newMode) {
    mode = newMode;
    btnNormal.classList.toggle('active', mode === 'normal');
    btnArds.classList.toggle('active', mode === 'ards');
    render();
  }

  btnNormal.addEventListener('click', () => setMode('normal'));
  btnArds.addEventListener('click', () => setMode('ards'));
  pSlider.addEventListener('input', render);
  render();
})();
