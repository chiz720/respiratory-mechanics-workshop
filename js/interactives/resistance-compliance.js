/**
 * Derived mechanics interactives: Resistance, Compliance, R-vs-C comparison (slides 10-12).
 */
(function () {
  const PH = window.PlotHelpers;
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function setZone(readoutEl, value, okMax, warnMax) {
    readoutEl.classList.remove('ok', 'warn', 'danger');
    if (value <= okMax) readoutEl.classList.add('ok');
    else if (value <= warnMax) readoutEl.classList.add('warn');
    else readoutEl.classList.add('danger');
  }

  /* ---------------- Resistance (slide 10) ---------------- */
  (function resistanceSlide() {
    const dpSlider = document.getElementById('r-deltap-slider');
    const flowSlider = document.getElementById('r-flow-slider');
    const dpOut = document.getElementById('r-deltap-output');
    const flowOut = document.getElementById('r-flow-output');
    const valOut = document.getElementById('r-value-output');
    const readout = document.getElementById('r-value-readout');
    const tubeViz = document.getElementById('r-tube-viz');
    if (!dpSlider || !tubeViz) return;

    function render() {
      const dp = parseFloat(dpSlider.value);
      const flow = parseFloat(flowSlider.value);
      dpOut.textContent = dp + ' cmH₂O';
      flowOut.textContent = flow.toFixed(2) + ' L/s';
      const r = dp / flow;
      valOut.textContent = r.toFixed(1);
      setZone(readout, r, 10, 20);

      const width = 320, height = 160;
      tubeViz.innerHTML = '';
      const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, class: 'ph-svg' });
      const lumen = Math.max(6, Math.min(46, 50 - r * 1.3));
      const outerTop = height / 2 - 44, outerBottom = height / 2 + 44;
      svg.appendChild(svgEl('rect', { x: 20, y: outerTop, width: width - 40, height: outerBottom - outerTop, rx: 10, fill: 'none', stroke: '#94a3b8', 'stroke-width': 3 }));
      svg.appendChild(svgEl('rect', { x: 26, y: height / 2 - lumen / 2, width: width - 52, height: lumen, rx: 6, fill: '#f59e0b', opacity: 0.55 }));
      svg.appendChild(svgEl('text', { x: width / 2, y: height - 12, 'text-anchor': 'middle', class: 'ph-annotation', fill: '#475569' }));
      const label = svg.querySelector('text');
      label.textContent = 'Airway lumen (illustrative)';
      const arrow = svgEl('text', { x: 8, y: height / 2 + 5, 'text-anchor': 'start', class: 'ph-annotation', fill: '#0f766e', 'font-size': 16 });
      arrow.textContent = '→';
      svg.appendChild(arrow);
      tubeViz.appendChild(svg);
    }
    dpSlider.addEventListener('input', render);
    flowSlider.addEventListener('input', render);
    render();
  })();

  /* ---------------- Compliance (slide 11) ---------------- */
  (function complianceSlide() {
    const dvSlider = document.getElementById('c-deltav-slider');
    const dpSlider = document.getElementById('c-deltap-slider');
    const dvOut = document.getElementById('c-deltav-output');
    const dpOut = document.getElementById('c-deltap-output');
    const valOut = document.getElementById('c-value-output');
    const readout = document.getElementById('c-value-readout');
    const lungViz = document.getElementById('c-lung-viz');
    const pvContainer = document.getElementById('c-pv-chart');
    if (!dvSlider || !lungViz) return;

    function render() {
      const dv = parseFloat(dvSlider.value);
      const dp = parseFloat(dpSlider.value);
      dvOut.textContent = dv + ' mL';
      dpOut.textContent = dp + ' cmH₂O';
      const c = dv / dp;
      valOut.textContent = c.toFixed(1);
      readout.classList.remove('ok', 'warn', 'danger');
      if (c >= 50) readout.classList.add('ok');
      else if (c >= 30) readout.classList.add('warn');
      else readout.classList.add('danger');

      const width = 220, height = 160;
      lungViz.innerHTML = '';
      const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, class: 'ph-svg' });
      const r = Math.max(20, Math.min(70, 20 + c * 0.6));
      svg.appendChild(svgEl('circle', { cx: width / 2, cy: height / 2, r, fill: '#2563eb', opacity: 0.35, stroke: '#2563eb', 'stroke-width': 2 }));
      const label = svgEl('text', { x: width / 2, y: height - 8, 'text-anchor': 'middle', class: 'ph-annotation', fill: '#475569' });
      label.textContent = 'Inflation for given ΔP (illustrative)';
      svg.appendChild(label);
      lungViz.appendChild(svg);

      const chart = PH.makeChart(pvContainer, {
        width: 260, height: 180,
        xDomain: [0, 35], yDomain: [0, 800],
        xLabel: 'Pressure (cmH₂O)', yLabel: 'Volume (mL)', xTicks: 4, yTicks: 4
      });
      chart.addPath(PH.linePath([[chart.x(0), chart.y(0)], [chart.x(dp), chart.y(dv)]]), { stroke: 'var(--elastic)' });
      chart.addDot(chart.x(dp), chart.y(dv), {});
    }
    dvSlider.addEventListener('input', render);
    dpSlider.addEventListener('input', render);
    render();
  })();

  /* ---------------- R vs C comparison (slide 12) ---------------- */
  (function comparisonSlide() {
    const rSlider = document.getElementById('cmp-r-slider');
    const cSlider = document.getElementById('cmp-c-slider');
    const rOut = document.getElementById('cmp-r-output');
    const cOut = document.getElementById('cmp-c-output');
    const container = document.getElementById('cmp-chart');
    const ppeakOut = document.getElementById('cmp-ppeak-output');
    const pplatOut = document.getElementById('cmp-pplat-output');
    const gapOut = document.getElementById('cmp-gap-output');
    if (!rSlider || !container) return;

    const flow = 0.5; // L/s, fixed
    const Ti = 1.0;   // s, fixed -> Vt = 500 mL
    const vt = flow * Ti * 1000;

    function render() {
      const r = parseFloat(rSlider.value);
      const c = parseFloat(cSlider.value);
      rOut.textContent = r;
      cOut.textContent = c;

      const resistiveP = flow * r;
      const elasticP = vt / c;
      const ppeak = resistiveP + elasticP;
      const pplat = elasticP;

      ppeakOut.textContent = ppeak.toFixed(1);
      pplatOut.textContent = pplat.toFixed(1);
      gapOut.textContent = (ppeak - pplat).toFixed(1);

      const chart = PH.makeChart(container, {
        width: 640, height: 240,
        xDomain: [0, Ti + 0.35], yDomain: [0, 55],
        xLabel: 'Time (s)', yLabel: 'Pressure (cmH₂O)', xTicks: 4, yTicks: 5
      });

      const pts = [
        [0, 0], [0, resistiveP],
        [Ti, ppeak],
        [Ti, pplat],
        [Ti + 0.25, pplat]
      ];
      chart.addPath(PH.linePath(pts.map(p => [chart.x(p[0]), chart.y(p[1])])), { stroke: 'var(--accent-3)' });
      chart.addLine(chart.x(0), chart.y(pplat), chart.x(Ti + 0.25), chart.y(pplat), {});
      chart.addText(chart.x(Ti + 0.27), chart.y(pplat) + 3, 'Pplat', {});
      chart.addText(chart.x(Ti) + 4, chart.y(ppeak) - 4, 'Ppeak', {});
    }
    rSlider.addEventListener('input', render);
    cSlider.addEventListener('input', render);
    render();
  })();
})();
