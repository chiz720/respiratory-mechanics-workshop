/**
 * Mechanical Power interactive (slide 21): simplified constant-flow,
 * volume-control formula (Gattinoni 2016) + a stylised PV loop.
 */
(function () {
  const PH = window.PlotHelpers;

  const vtSlider = document.getElementById('mp-vt-slider');
  const ppeakSlider = document.getElementById('mp-ppeak-slider');
  const peepSlider = document.getElementById('mp-peep-slider');
  const rrSlider = document.getElementById('mp-rr-slider');
  const vtOut = document.getElementById('mp-vt-output');
  const ppeakOut = document.getElementById('mp-ppeak-output');
  const peepOut = document.getElementById('mp-peep-output');
  const rrOut = document.getElementById('mp-rr-output');
  const loopContainer = document.getElementById('mp-pvloop-chart');
  const valueOut = document.getElementById('mp-value-output');
  const zoneOut = document.getElementById('mp-zone-output');
  const zoneReadout = document.getElementById('mp-zone-readout');
  if (!vtSlider || !loopContainer) return;

  function render() {
    const vt = parseFloat(vtSlider.value);
    const ppeak = parseFloat(ppeakSlider.value);
    const peep = parseFloat(peepSlider.value);
    const rr = parseFloat(rrSlider.value);

    vtOut.textContent = vt + ' mL';
    ppeakOut.textContent = ppeak + ' cmH₂O';
    peepOut.textContent = peep + ' cmH₂O';
    rrOut.textContent = rr + ' /min';

    const deltaP = Math.max(1, ppeak - peep);
    const vtL = vt / 1000;
    const mp = 0.098 * rr * vtL * (ppeak - 0.5 * deltaP);

    valueOut.textContent = mp.toFixed(1) + ' J/min';
    zoneReadout.classList.remove('ok', 'warn', 'danger');
    if (mp < 17) { zoneOut.textContent = 'Lower (illustrative)'; zoneReadout.classList.add('ok'); }
    else if (mp <= 25) { zoneOut.textContent = 'Watch (illustrative)'; zoneReadout.classList.add('warn'); }
    else { zoneOut.textContent = 'Higher (illustrative)'; zoneReadout.classList.add('danger'); }

    const chart = PH.makeChart(loopContainer, {
      width: 380, height: 280,
      xDomain: [0, 50], yDomain: [0, 800],
      xLabel: 'Pressure (cmH₂O)', yLabel: 'Volume (mL)', xTicks: 5, yTicks: 4
    });

    const nInsp = 12, nExp = 20;
    const pts = [];
    for (let i = 0; i <= nInsp; i++) {
      const f = i / nInsp;
      pts.push([peep + deltaP * f, vt * f]);
    }
    for (let i = 1; i <= nExp; i++) {
      const f = 1 - i / nExp;
      const p = peep + deltaP * Math.pow(f, 1.6);
      pts.push([p, vt * f]);
    }
    const pxPts = pts.map(p => [chart.x(p[0]), chart.y(p[1])]);
    chart.addPath(PH.closedPath(pxPts), { fill: 'var(--accent-2)', opacity: 0.25, stroke: 'var(--accent-2)', 'stroke-width': 2 });
    chart.addText(chart.x(peep + deltaP * 0.5), chart.y(vt * 0.5), 'Energy / breath', { 'text-anchor': 'middle' });
  }

  [vtSlider, ppeakSlider, peepSlider, rrSlider].forEach(s => s.addEventListener('input', render));
  render();
})();
