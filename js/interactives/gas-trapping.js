/**
 * Expiratory Flow & Gas Trapping interactive (slide after tau-in-Action).
 *
 * Draws a real ventilator flow-time SCALAR across two consecutive breaths
 * (inspiration positive, expiration negative, zero baseline in the middle)
 * instead of an isolated expiratory curve. Passive expiratory flow decays
 * exponentially: Flow(t) = -(Vt/tau) x e^(-(t-Ti)/tau). This is exactly how
 * clinicians spot air trapping on a real monitor: the expiratory limb gets
 * cut off mid-decay by the next breath's inspiratory upstroke instead of
 * returning to the zero baseline.
 */
(function () {
  const PH = window.PlotHelpers;

  const rSlider = document.getElementById('gt-r-slider');
  const cSlider = document.getElementById('gt-c-slider');
  const teSlider = document.getElementById('gt-te-slider');
  const vtSlider = document.getElementById('gt-vt-slider');
  const rOut = document.getElementById('gt-r-output');
  const cOut = document.getElementById('gt-c-output');
  const teOut = document.getElementById('gt-te-output');
  const vtOut = document.getElementById('gt-vt-output');
  const container = document.getElementById('gt-chart');
  const tauOut = document.getElementById('gt-tau-output');
  const exhaledOut = document.getElementById('gt-exhaled-output');
  const trappedOut = document.getElementById('gt-trapped-output');
  if (!rSlider || !container) return;

  const TI = 1.0; // fixed inspiratory time (s) - this slide's focus is the expiratory limb

  function render() {
    const r = parseFloat(rSlider.value);
    const c = parseFloat(cSlider.value);
    const te = parseFloat(teSlider.value);
    const vt = parseFloat(vtSlider.value);
    rOut.textContent = r;
    cOut.textContent = c;
    teOut.textContent = te.toFixed(2) + ' s';
    vtOut.textContent = vt + ' mL';

    const tau = (r * c) / 1000; // s
    const inspFlow = (vt / 1000) / TI; // L/s, positive
    const pefr = (vt / 1000) / tau; // L/s, peak passive expiratory flow magnitude
    const flowAtCutoff = pefr * Math.exp(-te / tau); // magnitude still flowing when next breath starts
    const exhaledPct = 1 - Math.exp(-te / tau);
    const exhaledVol = vt * exhaledPct;
    const trappedVol = vt - exhaledVol;
    const trappedPct = (trappedVol / vt) * 100;
    const adequate = te >= 3 * tau;

    tauOut.textContent = tau.toFixed(2) + ' s';
    exhaledOut.textContent = Math.round(exhaledVol) + ' mL';
    trappedOut.textContent = Math.round(trappedVol) + ' mL (' + trappedPct.toFixed(0) + '%)';
    trappedOut.className = adequate ? 'ok' : trappedPct > 25 ? 'danger' : 'warn';

    const xMax = 1.5 * TI + te;
    const yMax = Math.max(inspFlow, pefr) * 1.15;
    const chart = PH.makeChart(container, {
      width: 1000, height: 360,
      padding: { top: 24, right: 26, bottom: 46, left: 66 },
      xDomain: [0, xMax], yDomain: [-yMax, yMax],
      xLabel: 'Time (s)', yLabel: 'Flow (L/s)', xTicks: 5, yTicks: 4
    });

    chart.addLine(chart.x(0), chart.y(0), chart.x(xMax), chart.y(0), { stroke: 'var(--ink-soft)' });

    const pts = [[0, 0], [0, inspFlow], [TI, inspFlow], [TI, -pefr]];
    const n = 50;
    for (let i = 0; i <= n; i++) {
      const t = TI + (i / n) * te;
      pts.push([t, -pefr * Math.exp(-(t - TI) / tau)]);
    }
    pts.push([TI + te, inspFlow]);
    pts.push([xMax, inspFlow]);

    chart.addPath(PH.linePath(pts.map(p => [chart.x(p[0]), chart.y(p[1])])), { stroke: 'var(--accent-2)' });

    const cutColor = adequate ? 'var(--ok)' : 'var(--danger)';
    chart.addLine(chart.x(TI + te), chart.y(-yMax), chart.x(TI + te), chart.y(yMax), { stroke: cutColor, 'stroke-dasharray': '4 3' });
    chart.addDot(chart.x(TI + te), chart.y(-flowAtCutoff), { fill: cutColor, r: 5 });
    chart.addText(chart.x(TI + te) + 8, chart.y(-flowAtCutoff) + (adequate ? 14 : -8),
      adequate ? 'returns to zero' : 'still flowing: ' + flowAtCutoff.toFixed(2) + ' L/s',
      { fill: cutColor, 'font-weight': 'bold' });

    chart.addText(chart.x(TI * 0.5), chart.y(inspFlow) - 8, 'Inspiration', { 'text-anchor': 'middle' });
    chart.addText(chart.x(TI + te * 0.4), chart.y(-pefr * 0.5), 'Expiration', { 'text-anchor': 'middle' });
    chart.addText(chart.x(xMax) - 4, chart.y(inspFlow) - 8, 'Next breath', { 'text-anchor': 'end' });
  }

  [rSlider, cSlider, teSlider, vtSlider].forEach(s => s.addEventListener('input', render));
  render();
})();
