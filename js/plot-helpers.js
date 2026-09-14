/**
 * PlotHelpers — tiny shared SVG charting + slider-wiring utilities.
 * No dependencies. Used by every interactive module in js/interactives/.
 */
(function () {
  const SVGNS = 'http://www.w3.org/2000/svg';

  // These properties are also set by our CSS classes (.ph-line, .ph-refline, ...).
  // A stylesheet class rule always beats a plain SVG presentation attribute, so any
  // per-call override of these must go through the inline `style` attribute instead,
  // which outranks both.
  const STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity'];

  function el(tag, attrs) {
    const node = document.createElementNS(SVGNS, tag);
    attrs = attrs || {};
    let style = '';
    for (const key in attrs) {
      if (key === 'text') {
        node.textContent = attrs.text;
      } else if (STYLE_PROPS.indexOf(key) !== -1) {
        style += key + ':' + attrs[key] + ';';
      } else {
        node.setAttribute(key, attrs[key]);
      }
    }
    if (style) node.setAttribute('style', style);
    return node;
  }

  /**
   * Build an SVG chart with linear x/y scales and axes.
   * @param {HTMLElement} container
   * @param {object} opts { width, height, padding:{top,right,bottom,left}, xDomain:[min,max], yDomain:[min,max], xLabel, yLabel, xTicks, yTicks, xFmt, yFmt }
   */
  function makeChart(container, opts) {
    opts = opts || {};
    const width = opts.width || 480;
    const height = opts.height || 280;
    const padding = Object.assign({ top: 16, right: 18, bottom: 38, left: 54 }, opts.padding || {});
    const xDomain = opts.xDomain || [0, 1];
    const yDomain = opts.yDomain || [0, 1];
    const xLabel = opts.xLabel || '';
    const yLabel = opts.yLabel || '';
    const xTicks = opts.xTicks || 5;
    const yTicks = opts.yTicks || 5;
    const roundTick = v => Math.round(v * 100) / 100;
    const xFmt = opts.xFmt || roundTick;
    const yFmt = opts.yFmt || roundTick;

    container.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, class: 'ph-svg', preserveAspectRatio: 'xMidYMid meet' });
    container.appendChild(svg);

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const x = v => padding.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotW;
    const y = v => padding.top + plotH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotH;

    const gridGroup = el('g', { class: 'ph-grid' });
    svg.appendChild(gridGroup);
    for (let i = 0; i <= xTicks; i++) {
      const xv = xDomain[0] + (i / xTicks) * (xDomain[1] - xDomain[0]);
      const px = x(xv);
      gridGroup.appendChild(el('line', { x1: px, y1: padding.top, x2: px, y2: padding.top + plotH, class: 'ph-gridline' }));
      gridGroup.appendChild(el('text', { x: px, y: padding.top + plotH + 16, class: 'ph-tick-label', 'text-anchor': 'middle', text: xFmt(xv) }));
    }
    for (let i = 0; i <= yTicks; i++) {
      const yv = yDomain[0] + (i / yTicks) * (yDomain[1] - yDomain[0]);
      const py = y(yv);
      gridGroup.appendChild(el('line', { x1: padding.left, y1: py, x2: padding.left + plotW, y2: py, class: 'ph-gridline' }));
      gridGroup.appendChild(el('text', { x: padding.left - 8, y: py + 4, class: 'ph-tick-label', 'text-anchor': 'end', text: yFmt(yv) }));
    }

    const axisGroup = el('g', { class: 'ph-axes' });
    axisGroup.appendChild(el('line', { x1: padding.left, y1: padding.top + plotH, x2: padding.left + plotW, y2: padding.top + plotH, class: 'ph-axis-line' }));
    axisGroup.appendChild(el('line', { x1: padding.left, y1: padding.top, x2: padding.left, y2: padding.top + plotH, class: 'ph-axis-line' }));
    svg.appendChild(axisGroup);

    if (xLabel) {
      svg.appendChild(el('text', { x: padding.left + plotW / 2, y: height - 4, class: 'ph-axis-label', 'text-anchor': 'middle', text: xLabel }));
    }
    if (yLabel) {
      const t = el('text', { x: 14, y: padding.top + plotH / 2, class: 'ph-axis-label', 'text-anchor': 'middle', text: yLabel });
      t.setAttribute('transform', `rotate(-90 14 ${padding.top + plotH / 2})`);
      svg.appendChild(t);
    }

    const dataGroup = el('g', { class: 'ph-data' });
    svg.appendChild(dataGroup);

    return {
      svg, x, y, plotW, plotH, padding, width, height, dataGroup,
      clearData() { dataGroup.innerHTML = ''; },
      addPath(d, attrs) {
        const p = el('path', Object.assign({ d, class: 'ph-line' }, attrs || {}));
        dataGroup.appendChild(p);
        return p;
      },
      addLine(x1, y1, x2, y2, attrs) {
        const l = el('line', Object.assign({ x1, y1, x2, y2, class: 'ph-refline' }, attrs || {}));
        dataGroup.appendChild(l);
        return l;
      },
      addDot(cx, cy, attrs) {
        const c = el('circle', Object.assign({ cx, cy, r: 4, class: 'ph-dot' }, attrs || {}));
        dataGroup.appendChild(c);
        return c;
      },
      addText(cx, cy, text, attrs) {
        const t = el('text', Object.assign({ x: cx, y: cy, class: 'ph-annotation', text }, attrs || {}));
        dataGroup.appendChild(t);
        return t;
      },
      addRect(rx, ry, rw, rh, attrs) {
        const r = el('rect', Object.assign({ x: rx, y: ry, width: rw, height: rh, class: 'ph-rect' }, attrs || {}));
        dataGroup.appendChild(r);
        return r;
      }
    };
  }

  function linePath(points) {
    return points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ');
  }

  function areaPath(points, yZeroPixel) {
    if (!points.length) return '';
    const top = linePath(points);
    const last = points[points.length - 1];
    const first = points[0];
    return `${top} L${last[0].toFixed(2)},${yZeroPixel.toFixed(2)} L${first[0].toFixed(2)},${yZeroPixel.toFixed(2)} Z`;
  }

  function closedPath(points) {
    if (!points.length) return '';
    return linePath(points) + ' Z';
  }

  /** Wire a <input type="range"> to a live output + callback. Calls cb immediately. */
  function bindRange(input, output, fmt, cb) {
    const update = () => {
      const v = parseFloat(input.value);
      if (output) output.textContent = fmt ? fmt(v) : String(v);
      cb(v);
    };
    input.addEventListener('input', update);
    update();
    return update;
  }

  window.PlotHelpers = { el, makeChart, linePath, areaPath, closedPath, bindRange };
})();
