/**
 * Primary mechanics interactives: Volume, Flow, Pressure, Time (slides 5-8).
 */
(function () {
  const PH = window.PlotHelpers;

  /* ---------------- Volume (slide 5) ---------------- */
  (function volumeSlide() {
    const vtSlider = document.getElementById('volume-vt-slider');
    const tiSlider = document.getElementById('volume-ti-slider');
    const vtOut = document.getElementById('volume-vt-output');
    const tiOut = document.getElementById('volume-ti-output');
    const container = document.getElementById('volume-chart');
    const flowContainer = document.getElementById('volume-flow-chart');
    if (!vtSlider || !container) return;

    const TE = 2.0; // fixed, so changing Ti visibly reshapes the curve instead of just rescaling the axis
    const TAU = 0.5; // fixed illustrative passive expiratory time constant (R/C aren't introduced until later slides)

    function render() {
      const vt = parseFloat(vtSlider.value);
      const ti = parseFloat(tiSlider.value);
      vtOut.textContent = vt + ' mL';
      tiOut.textContent = ti.toFixed(2) + ' s';

      // Inspiration: linear rise (constant inspiratory flow). Expiration: passive
      // exponential decay back toward zero (constant time constant TAU), not a
      // straight line — real expiratory flow is never constant.
      const n = 40;
      const volPts = [[0, 0], [ti, vt]];
      for (let i = 1; i <= n; i++) {
        const t = ti + (i / n) * TE;
        volPts.push([t, vt * Math.exp(-(t - ti) / TAU)]);
      }
      const chart = PH.makeChart(container, {
        width: 300, height: 260,
        xDomain: [0, 4.5], yDomain: [0, 800],
        xLabel: 'Time (s)', yLabel: 'Volume (mL)',
        xTicks: 4, yTicks: 4
      });
      chart.addPath(PH.linePath(volPts.map(p => [chart.x(p[0]), chart.y(p[1])])), { stroke: 'var(--accent-2)' });
      chart.addLine(chart.x(ti), chart.y(0), chart.x(ti), chart.y(vt), { stroke: 'var(--ink-soft)' });
      chart.addText(chart.x(ti) + 4, chart.y(vt) - 6, 'end-inspiration', {});

      // The flow that, integrated, produces the volume curve above: a constant
      // inspiratory flow (Vt/Ti), then a passive exponential decay in expiratory
      // flow, matching the curved (not straight-line) fall in volume above.
      const inspFlow = (vt / 1000) / ti; // L/s
      const peakExpFlow = (vt / 1000) / TAU; // L/s, flow magnitude the instant exhalation starts
      const flowPts = [[0, 0], [0, inspFlow], [ti, inspFlow], [ti, -peakExpFlow]];
      for (let i = 1; i <= n; i++) {
        const t = ti + (i / n) * TE;
        flowPts.push([t, -peakExpFlow * Math.exp(-(t - ti) / TAU)]);
      }
      flowPts.push([4.5, 0]);
      const flowChart = PH.makeChart(flowContainer, {
        width: 300, height: 260,
        xDomain: [0, 4.5], yDomain: [-1.8, 1.8], // fixed: covers the full slider range so changes stay honestly proportioned
        xLabel: 'Time (s)', yLabel: 'Flow (L/s)',
        xTicks: 4, yTicks: 4
      });
      flowChart.addLine(flowChart.x(0), flowChart.y(0), flowChart.x(4.5), flowChart.y(0), { stroke: 'var(--ink-soft)' });
      flowChart.addPath(PH.linePath(flowPts.map(p => [flowChart.x(p[0]), flowChart.y(p[1])])), { stroke: 'var(--resistive)' });
      flowChart.addLine(flowChart.x(ti), flowChart.y(-1.8), flowChart.x(ti), flowChart.y(1.8), { stroke: 'var(--ink-soft)' });
    }
    vtSlider.addEventListener('input', render);
    tiSlider.addEventListener('input', render);
    render();
  })();

  /* ---------------- Flow (slide 6) ---------------- */
  (function flowSlide() {
    const peakSlider = document.getElementById('flow-peak-slider');
    const peakOut = document.getElementById('flow-peak-output');
    const flowContainer = document.getElementById('flow-chart');
    const volContainer = document.getElementById('flow-volume-chart');
    const btnSquare = document.getElementById('flow-shape-square');
    const btnDecel = document.getElementById('flow-shape-decel');
    if (!peakSlider || !flowContainer) return;

    let shape = 'square';
    const Ti = 1.0;

    function flowAt(t, peakLps) {
      if (t > Ti) return 0;
      if (shape === 'square') return peakLps;
      return peakLps * (1 - t / Ti); // decelerating ramp to 0 at Ti
    }

    function render() {
      const peakLpm = parseFloat(peakSlider.value);
      peakOut.textContent = peakLpm + ' L/min';
      const peakLps = peakLpm / 60;

      const n = 40;
      const flowPts = [];
      const volPts = [];
      let vol = 0;
      let prevFlow = flowAt(0, peakLps);
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * Ti;
        const f = flowAt(t, peakLps);
        if (i > 0) {
          const dt = Ti / n;
          vol += ((f + prevFlow) / 2) * dt; // trapezoidal integration, litres
        }
        prevFlow = f;
        flowPts.push([t, f]);
        volPts.push([t, vol * 1000]); // mL
      }
      const vtResult = vol * 1000;

      const flowChart = PH.makeChart(flowContainer, {
        width: 300, height: 230,
        xDomain: [0, Ti], yDomain: [0, 1.4],
        xLabel: 'Time (s)', yLabel: 'Flow (L/s)', xTicks: 4, yTicks: 4
      });
      flowChart.addPath(PH.linePath(flowPts.map(p => [flowChart.x(p[0]), flowChart.y(p[1])])), { stroke: 'var(--resistive)' });

      const volChart = PH.makeChart(volContainer, {
        width: 300, height: 230,
        xDomain: [0, Ti], yDomain: [0, 1400], // fixed: max possible Vt (square flow, 80 L/min x 1s) so changes stay honestly proportioned
        xLabel: 'Time (s)', yLabel: 'Volume (mL)', xTicks: 4, yTicks: 4
      });
      volChart.addPath(PH.linePath(volPts.map(p => [volChart.x(p[0]), volChart.y(p[1])])), { stroke: 'var(--elastic)' });
      volChart.addText(volChart.x(Ti * 0.4), volChart.y(1400) + 12, 'Resulting Vᴛ ≈ ' + Math.round(vtResult) + ' mL', {});
    }

    function setShape(newShape) {
      shape = newShape;
      btnSquare.classList.toggle('active', shape === 'square');
      btnDecel.classList.toggle('active', shape === 'decel');
      render();
    }

    btnSquare.addEventListener('click', () => setShape('square'));
    btnDecel.addEventListener('click', () => setShape('decel'));
    peakSlider.addEventListener('input', render);
    render();
  })();

  /* ---------------- Pressure (slide 7) ---------------- */
  (function pressureSlide() {
    const peakSlider = document.getElementById('pressure-peak-slider');
    const peakOut = document.getElementById('pressure-peak-output');
    const container = document.getElementById('pressure-chart');
    const btnVC = document.getElementById('pressure-mode-vc');
    const btnPC = document.getElementById('pressure-mode-pc');
    const note = document.getElementById('pressure-mode-note');
    if (!peakSlider || !container) return;

    let mode = 'vc';
    const Ti = 1.0;

    function render() {
      const peak = parseFloat(peakSlider.value);
      peakOut.textContent = peak + ' cmH₂O';

      const n = 30;
      const pts = [];
      if (mode === 'vc') {
        for (let i = 0; i <= n; i++) {
          const t = (i / n) * Ti;
          const p = peak * Math.pow(t / Ti, 0.6);
          pts.push([t, p]);
        }
        pts.push([Ti, peak * 0.72]); // drop toward plateau
        pts.push([Ti + 0.15, peak * 0.72]);
        pts.push([Ti + 0.15, 0]);
      } else {
        pts.push([0, 0]);
        pts.push([0.04, peak]);
        pts.push([Ti, peak]);
        pts.push([Ti, 0]);
      }

      const chart = PH.makeChart(container, {
        width: 640, height: 240,
        xDomain: [0, Ti + 0.3], yDomain: [0, 45],
        xLabel: 'Time (s)', yLabel: 'Pressure (cmH₂O)', xTicks: 4, yTicks: 5
      });
      chart.addPath(PH.linePath(pts.map(p => [chart.x(p[0]), chart.y(p[1])])), { stroke: 'var(--accent-3)' });
    }

    function setMode(newMode) {
      mode = newMode;
      btnVC.classList.toggle('active', mode === 'vc');
      btnPC.classList.toggle('active', mode === 'pc');
      note.textContent = mode === 'vc'
        ? 'Volume Control: constant flow → pressure rises through inspiration to a peak, then falls at end-inspiration if a pause is applied (plateau).'
        : 'Pressure Control: pressure is set and held → waveform is square; flow instead decelerates to deliver the breath.';
      render();
    }

    btnVC.addEventListener('click', () => setMode('vc'));
    btnPC.addEventListener('click', () => setMode('pc'));
    peakSlider.addEventListener('input', render);
    render();
  })();

  /* ---------------- Time (slide 8) ---------------- */
  (function timeSlide() {
    const rrSlider = document.getElementById('time-rr-slider');
    const ieSlider = document.getElementById('time-ie-slider');
    const rrOut = document.getElementById('time-rr-output');
    const ieOut = document.getElementById('time-ie-output');
    const cycleOut = document.getElementById('time-cycle-output');
    const tiOut = document.getElementById('time-ti-output');
    const teOut = document.getElementById('time-te-output');
    const bar = document.getElementById('time-timeline');
    if (!rrSlider || !bar) return;

    function render() {
      const rr = parseFloat(rrSlider.value);
      const ieX = parseFloat(ieSlider.value); // 1:x
      rrOut.textContent = rr + ' /min';
      ieOut.textContent = '1:' + ieX.toFixed(1);

      const cycle = 60 / rr;
      const ti = cycle / (1 + ieX);
      const te = cycle - ti;

      cycleOut.textContent = cycle.toFixed(2) + ' s';
      tiOut.textContent = ti.toFixed(2) + ' s';
      teOut.textContent = te.toFixed(2) + ' s';

      const tiPct = (ti / cycle) * 100;
      bar.innerHTML =
        `<div class="timeline-seg ti" style="width:${tiPct}%">Tᵢ ${ti.toFixed(2)}s</div>` +
        `<div class="timeline-seg te" style="width:${100 - tiPct}%">Tₑ ${te.toFixed(2)}s</div>`;
    }
    rrSlider.addEventListener('input', render);
    ieSlider.addEventListener('input', render);
    render();
  })();
})();
