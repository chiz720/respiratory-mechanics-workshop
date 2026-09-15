/**
 * Dead Space Ventilation interactive (slide after Time):
 * VE = Vt x RR ; VA = (Vt - Vd) x RR.
 * Demonstrates that raising RR alone wastes a growing share of each
 * breath on fixed dead space, while raising Vt (within lung-protective
 * limits) grows alveolar ventilation more efficiently.
 */
(function () {
  const PH = window.PlotHelpers;

  const vtSlider = document.getElementById('ds-vt-slider');
  const rrSlider = document.getElementById('ds-rr-slider');
  const vdSlider = document.getElementById('ds-vd-slider');
  const vtOut = document.getElementById('ds-vt-output');
  const rrOut = document.getElementById('ds-rr-output');
  const vdOut = document.getElementById('ds-vd-output');
  const container = document.getElementById('ds-chart');
  const veOut = document.getElementById('ds-ve-output');
  const vaOut = document.getElementById('ds-va-output');
  const wastedOut = document.getElementById('ds-wasted-output');
  const ratioOut = document.getElementById('ds-ratio-output');
  const ratioReadout = document.getElementById('ds-ratio-readout');
  const btnSlow = document.getElementById('ds-preset-slow');
  const btnFast = document.getElementById('ds-preset-fast');
  if (!vtSlider || !container) return;

  function render() {
    const vt = parseFloat(vtSlider.value);
    const rr = parseFloat(rrSlider.value);
    const vd = parseFloat(vdSlider.value);
    vtOut.textContent = vt + ' mL';
    rrOut.textContent = rr + ' /min';
    vdOut.textContent = vd + ' mL';

    const ve = (vt * rr) / 1000;
    const va = Math.max(0, (vt - vd) * rr) / 1000;
    const wasted = ve - va;
    const ratio = vd / vt;

    veOut.textContent = ve.toFixed(1) + ' L/min';
    vaOut.textContent = va.toFixed(1) + ' L/min';
    wastedOut.textContent = wasted.toFixed(1) + ' L/min';
    ratioOut.textContent = ratio.toFixed(2);
    ratioReadout.classList.remove('ok', 'warn', 'danger');
    ratioReadout.classList.add(ratio < 0.3 ? 'ok' : ratio <= 0.6 ? 'warn' : 'danger');

    const chart = PH.makeChart(container, {
      width: 640, height: 260,
      xDomain: [0, 1], yDomain: [0, 35],
      xLabel: '', yLabel: 'Ventilation (L/min)', xTicks: 0, yTicks: 6
    });
    const barCx = chart.padding.left + chart.plotW / 2;
    const barW = 140;
    const yVaTop = chart.y(va);
    const yVeTop = chart.y(ve);
    const yZero = chart.y(0);
    chart.addRect(barCx - barW / 2, yVaTop, barW, yZero - yVaTop, { fill: 'var(--ok)', opacity: 0.8 });
    chart.addRect(barCx - barW / 2, yVeTop, barW, yVaTop - yVeTop, { fill: 'var(--danger)', opacity: 0.75 });
    chart.addText(barCx + barW / 2 + 10, (yVaTop + yZero) / 2 + 4, 'Alveolar (useful) ' + va.toFixed(1) + ' L/min', {});
    chart.addText(barCx + barW / 2 + 10, (yVeTop + yVaTop) / 2 + 4, 'Dead space (wasted) ' + wasted.toFixed(1) + ' L/min', {});
    chart.addLine(barCx - barW / 2 - 6, yVeTop, barCx + barW / 2 + 6, yVeTop, { stroke: 'var(--ink)' });
    chart.addText(barCx - barW / 2 - 10, yVeTop - 6, 'VE = ' + ve.toFixed(1), { 'text-anchor': 'end', 'font-weight': 'bold' });
  }

  btnSlow.addEventListener('click', () => {
    vtSlider.value = 700; rrSlider.value = 11;
    render();
  });
  btnFast.addEventListener('click', () => {
    vtSlider.value = 300; rrSlider.value = 26;
    render();
  });

  [vtSlider, rrSlider, vdSlider].forEach(s => s.addEventListener('input', render));
  render();
})();
