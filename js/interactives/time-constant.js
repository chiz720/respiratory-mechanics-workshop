/**
 * Time Constant interactive (slide 18): tau = R x C, exponential passive
 * exhalation curve with 1-5 tau markers and a Te-adequacy check.
 */
(function () {
  const PH = window.PlotHelpers;

  const rSlider = document.getElementById('tc-r-slider');
  const cSlider = document.getElementById('tc-c-slider');
  const teSlider = document.getElementById('tc-te-slider');
  const rOut = document.getElementById('tc-r-output');
  const cOut = document.getElementById('tc-c-output');
  const teOut = document.getElementById('tc-te-output');
  const container = document.getElementById('tc-chart');
  const tauOut = document.getElementById('tc-tau-output');
  const tau3Out = document.getElementById('tc-3tau-output');
  const checkReadout = document.getElementById('tc-te-check');
  const checkOut = document.getElementById('tc-te-check-output');
  if (!rSlider || !container) return;

  const PCTS = [63, 86, 95, 98, 99];

  function render() {
    const r = parseFloat(rSlider.value);
    const c = parseFloat(cSlider.value);
    const te = parseFloat(teSlider.value);
    rOut.textContent = r;
    cOut.textContent = c;
    teOut.textContent = te.toFixed(2) + ' s';

    const tau = (r * c) / 1000; // seconds
    const tau3 = 3 * tau;
    tauOut.textContent = tau.toFixed(2) + ' s';
    tau3Out.textContent = tau3.toFixed(2) + ' s';

    const adequate = te >= tau3;
    checkOut.textContent = adequate ? 'Adequate (≥3τ)' : 'May be inadequate (<3τ)';
    checkReadout.classList.remove('ok', 'danger');
    checkReadout.classList.add(adequate ? 'ok' : 'danger');

    const xMax = Math.max(5 * tau, te) * 1.15;
    const chart = PH.makeChart(container, {
      width: 640, height: 280,
      xDomain: [0, xMax], yDomain: [0, 100],
      xLabel: 'Time since start of passive exhalation (s)', yLabel: '% of volume change complete', xTicks: 5, yTicks: 5
    });

    const n = 60;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * xMax;
      const pct = 100 * (1 - Math.exp(-t / tau));
      pts.push([chart.x(t), chart.y(pct)]);
    }
    chart.addPath(PH.linePath(pts), { stroke: 'var(--accent-2)' });

    for (let k = 1; k <= 5; k++) {
      const t = k * tau;
      if (t > xMax) continue;
      const pct = PCTS[k - 1];
      chart.addLine(chart.x(t), chart.y(0), chart.x(t), chart.y(pct), {});
      chart.addText(chart.x(t), chart.y(pct) - 6, k + 'τ (' + pct + '%)', { 'text-anchor': 'middle' });
    }

    chart.addLine(chart.x(te), chart.y(0), chart.x(te), chart.y(100), { stroke: adequate ? 'var(--ok)' : 'var(--danger)', 'stroke-width': 2, 'stroke-dasharray': 'none' });
    chart.addText(chart.x(te), chart.y(100) + 12, 'Available Tₑ', { 'text-anchor': 'middle', fill: adequate ? 'var(--ok)' : 'var(--danger)' });
  }

  [rSlider, cSlider, teSlider].forEach(s => s.addEventListener('input', render));
  render();
})();
