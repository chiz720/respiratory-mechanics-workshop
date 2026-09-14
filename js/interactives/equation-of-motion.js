/**
 * Equation of Motion interactive (slide 15):
 * P = (Flow x R) + (Volume / C) + PEEP, shown as a stacked bar.
 */
(function () {
  const PH = window.PlotHelpers;

  const flowSlider = document.getElementById('eom-flow-slider');
  const rSlider = document.getElementById('eom-r-slider');
  const vtSlider = document.getElementById('eom-vt-slider');
  const cSlider = document.getElementById('eom-c-slider');
  const peepSlider = document.getElementById('eom-peep-slider');
  const flowOut = document.getElementById('eom-flow-output');
  const rOut = document.getElementById('eom-r-output');
  const vtOut = document.getElementById('eom-vt-output');
  const cOut = document.getElementById('eom-c-output');
  const peepOut = document.getElementById('eom-peep-output');
  const container = document.getElementById('eom-chart');
  const eqOut = document.getElementById('eom-equation-output');
  if (!flowSlider || !container) return;

  function render() {
    const flow = parseFloat(flowSlider.value);
    const r = parseFloat(rSlider.value);
    const vt = parseFloat(vtSlider.value);
    const c = parseFloat(cSlider.value);
    const peep = parseFloat(peepSlider.value);

    flowOut.textContent = flow.toFixed(2) + ' L/s';
    rOut.textContent = r;
    vtOut.textContent = vt + ' mL';
    cOut.textContent = c;
    peepOut.textContent = peep + ' cmH₂O';

    const resistiveP = flow * r;
    const elasticP = vt / c;
    const peak = resistiveP + elasticP + peep;
    const yMax = Math.max(90, peak * 1.05); // mostly-fixed scale so single-slider changes stay honestly proportioned

    const chart = PH.makeChart(container, {
      width: 640, height: 300,
      xDomain: [0, 1], yDomain: [0, yMax],
      xLabel: '', yLabel: 'Pressure (cmH₂O)', xTicks: 0, yTicks: 5
    });

    const barCx = chart.padding.left + chart.plotW / 2;
    const barW = 110;
    const segments = [
      { from: 0, to: peep, color: 'var(--peep)', label: 'PEEP ' + peep.toFixed(1) },
      { from: peep, to: peep + elasticP, color: 'var(--elastic)', label: 'Elastic ' + elasticP.toFixed(1) },
      { from: peep + elasticP, to: peak, color: 'var(--resistive)', label: 'Resistive ' + resistiveP.toFixed(1) }
    ];
    segments.forEach(seg => {
      const yTop = chart.y(seg.to);
      const yBottom = chart.y(seg.from);
      chart.addRect(barCx - barW / 2, yTop, barW, yBottom - yTop, { fill: seg.color, opacity: 0.85 });
      chart.addText(barCx + barW / 2 + 10, (yTop + yBottom) / 2 + 3, seg.label, {});
    });
    chart.addLine(barCx - barW / 2 - 6, chart.y(peak), barCx + barW / 2 + 6, chart.y(peak), { stroke: 'var(--ink)' });
    chart.addText(barCx - barW / 2 - 10, chart.y(peak) - 6, 'Ppeak = ' + peak.toFixed(1), { 'text-anchor': 'end', 'font-weight': 'bold' });

    eqOut.innerHTML =
      `P = (${flow.toFixed(2)} &times; ${r}) + (${vt} / ${c}) + ${peep} &nbsp;=&nbsp; ` +
      `${resistiveP.toFixed(1)} + ${elasticP.toFixed(1)} + ${peep} &nbsp;=&nbsp; <strong>${peak.toFixed(1)} cmH&#8322;O</strong>`;
  }

  [flowSlider, rSlider, vtSlider, cSlider, peepSlider].forEach(s => s.addEventListener('input', render));
  render();
})();
