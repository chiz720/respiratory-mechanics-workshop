# Respiratory Mechanics — Reactive Slide Deck

A [reveal.js](https://revealjs.com) slide deck for a mechanical ventilation workshop, covering:

1. **Primary mechanics** — Volume, Pressure, Flow, Time, Mean Airway Pressure, Dead Space Ventilation
2. **Derived mechanics** — Resistance, Compliance
3. **The Equation of Motion**
4. **Time Constant** (τ = R × C) and Gas Trapping
5. **Mechanical Power**

Most slides are interactive: drag the sliders and the graphs (built with hand-rolled SVG, no charting library) redraw live. Everything is static HTML/CSS/JS — no build step, so it can be served directly from GitHub Pages.

## Preview locally

Reveal.js needs to load its scripts/CSS over HTTP (not `file://`), so serve the folder with any static server, e.g.:

```bash
# Python (built in on most systems)
python -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000` and use the arrow keys / on-screen controls to navigate.

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this folder to it (`git init` has already been run locally):
   ```bash
   git add .
   git commit -m "Initial workshop deck"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Source → Deploy from a branch**, choose `main` and `/ (root)`.
3. Your deck will be live at `https://<username>.github.io/<repo-name>/` within a minute or two.

## Project structure

```
index.html                    Slide deck shell (28 slides)
css/style.css                 Theme + interactive-panel styling
js/plot-helpers.js            Shared SVG chart-building utilities
js/interactives/
  waveforms.js                 Volume, Flow, Pressure, Time (primary mechanics)
  mean-airway-pressure.js      Paw = K×(PIP-PEEP)×(Ti/TCT)+PEEP, square vs ramp waveform
  dead-space.js                VE vs VA, dead-space-fixed / Vt-vs-RR efficiency
  resistance-compliance.js     Resistance, Compliance, R-vs-C comparison
  equation-of-motion.js        Live decomposition of P = (Flow×R) + (Volume/C) + PEEP
  time-constant.js             τ = R×C exponential curve + Te-adequacy check
  gas-trapping.js              Expiratory flow decay + trapped-volume estimate
  mechanical-power.js          PV loop + simplified mechanical power estimate
```

## Editing content

- Slide text/markup lives directly in `index.html` as `<section>` elements.
- Each interactive module is self-contained and looks up its own DOM elements by `id` — if you rename an `id` in `index.html`, update the matching selector in the relevant file under `js/interactives/`.
- Formulas used (all simplified for teaching, not clinical calculators):
  - R = ΔP / Flow, C = ΔV / ΔP
  - P = (Flow × R) + (Volume / C) + PEEP
  - τ (s) = R (cmH₂O/L/s) × C (L/cmH₂O)
  - Mechanical Power (J/min) ≈ 0.098 × RR × Vt(L) × (Ppeak − 0.5 × ΔP) — simplified constant-flow, volume-control equation (Gattinoni 2016)
  - Paw ≈ K × (PIP − PEEP) × (Ti/TCT) + PEEP — K≈1.0 square/PC waveform, K≈0.5 ascending-ramp/VC waveform (Pilbeam's Mechanical Ventilation, 8th ed.)
  - V̇E = Vt × RR, V̇A = (Vt − Vd) × RR, τ (s) for gas trapping = R × C / 1000 with trapped volume = Vt × e^(−Te/τ)

Content for the Mean Airway Pressure and Dead Space Ventilation slides is grounded in *Pilbeam's Mechanical Ventilation: Physiological and Clinical Applications*, 8th ed. (Elsevier, 2023).
