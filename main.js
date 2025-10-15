// Gradient Descent Practice — plain JS
// Contract:
// - Render many questions (scroll list). Each shows: f(x,y), ∇f(x,y) column vector, α, starting point column vector
// - Each question has its own Reveal button to show one-step update details

// Utilities
const $ = (sel, root = document) => root.querySelector(sel);
const fmt = (n) => {
  // format numbers to 4 decimal places, trim trailing zeros
  const s = (Math.round(n * 10000) / 10000).toFixed(4);
  return s.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
};

// Define a few sample questions. We keep this simple to start.
// Each question defines: fStr (surface), gxStr/gyStr (symbolic components), gradFn (function), alpha, x0, y0
const QUESTIONS = [
  {
    fStr: 'f(x, y) = x^2 + y^2',
    gxStr: '2x',
    gyStr: '2y',
    gradFn: ({ x, y }) => ({ gx: 2 * x, gy: 2 * y }),
    alpha: 0.1,
    x0: 3,
    y0: -4,
  },
  {
    fStr: 'f(x, y) = (x - 1)^2 + (y + 2)^2',
    gxStr: '2(x − 1)',
    gyStr: '2(y + 2)',
    gradFn: ({ x, y }) => ({ gx: 2 * (x - 1), gy: 2 * (y + 2) }),
    alpha: 0.2,
    x0: -1,
    y0: 3,
  },
  {
    fStr: 'f(x, y) = x^2 + 3y^2',
    gxStr: '2x',
    gyStr: '6y',
    gradFn: ({ x, y }) => ({ gx: 2 * x, gy: 6 * y }),
    alpha: 0.05,
    x0: 2,
    y0: 1,
  },
  {
    fStr: 'f(x, y) = 0.5x^2 + 2y^2',
    gxStr: 'x',
    gyStr: '4y',
    gradFn: ({ x, y }) => ({ gx: x, gy: 4 * y }),
    alpha: 0.15,
    x0: -2,
    y0: -2,
  },
  // Saddle: f = x^2 - y^2
  {
    fStr: 'f(x, y) = x^2 − y^2',
    gxStr: '2x',
    gyStr: '−2y',
    gradFn: ({ x, y }) => ({ gx: 2 * x, gy: -2 * y }),
    alpha: 0.1,
    x0: 1.5,
    y0: -1,
  },
  // Rotated paraboloid-ish cross term: f = x^2 + xy + y^2
  {
    fStr: 'f(x, y) = x^2 + xy + y^2',
    gxStr: '2x + y',
    gyStr: 'x + 2y',
    gradFn: ({ x, y }) => ({ gx: 2 * x + y, gy: x + 2 * y }),
    alpha: 0.1,
    x0: -2,
    y0: 1,
  },
  // Banana-shaped valley approximation (quadratic proxy near (1,1)): f = (x-1)^2 + 10(y-1)^2
  {
    fStr: 'f(x, y) = (x − 1)^2 + 10(y − 1)^2',
    gxStr: '2(x − 1)',
    gyStr: '20(y − 1)',
    gradFn: ({ x, y }) => ({ gx: 2 * (x - 1), gy: 20 * (y - 1) }),
    alpha: 0.04,
    x0: 0,
    y0: 2,
  },
  // Sinusoidal surface (non-convex locally): f = sin x + cos y
  {
    fStr: 'f(x, y) = sin(x) + cos(y)',
    gxStr: 'cos(x)',
    gyStr: '−sin(y)',
    gradFn: ({ x, y }) => ({ gx: Math.cos(x), gy: -Math.sin(y) }),
    alpha: 0.2,
    x0: 1,
    y0: 2,
  },
  // Mixed polynomial: f = x^3/3 + y^2
  {
    fStr: 'f(x, y) = (1/3)x^3 + y^2',
    gxStr: 'x^2',
    gyStr: '2y',
    gradFn: ({ x, y }) => ({ gx: x * x, gy: 2 * y }),
    alpha: 0.05,
    x0: -1,
    y0: -1.5,
  },
];

function chooseQuestion() {
  const idx = Math.floor(Math.random() * QUESTIONS.length);
  return { idx, ...QUESTIONS[idx] };
}

const colVec = (a, b) => `\n  <span class="colvec"><span class="row">${a}</span><span class="row">${b}</span></span>\n`;

function renderQuestionCard(q, index) {
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h3>Question ${index + 1}</h3>
    <div class="formula">${q.fStr}</div>
    <div class="formula">∇f(x, y) = ${colVec(q.gxStr, q.gyStr)}</div>
    <div class="params">
      <p>Learning rate: <span class="code">α = ${fmt(q.alpha)}</span></p>
      <p>Starting point: ${colVec(fmt(q.x0), fmt(q.y0))}</p>
    </div>
    <div class="controls">
      <button class="primary reveal">Reveal Answer</button>
    </div>
    <div class="answer hidden"></div>
  `;

  const revealBtn = card.querySelector('.reveal');
  const ansEl = card.querySelector('.answer');
  revealBtn.addEventListener('click', () => {
    const step = computeStep(q);
    ansEl.classList.remove('hidden');
    ansEl.innerHTML = `
      <div>∇f(${fmt(q.x0)}, ${fmt(q.y0)}) = ${colVec(fmt(step.gx), fmt(step.gy))}</div>
      <div>(x₁, y₁) = ${colVec(fmt(q.x0), fmt(q.y0))} − ${fmt(q.alpha)} · ${colVec(fmt(step.gx), fmt(step.gy))}</div>
      <div>So, x₁ = ${fmt(q.x0)} − ${fmt(q.alpha)}·${fmt(step.gx)} = <strong>${fmt(step.x1)}</strong></div>
      <div>and y₁ = ${fmt(q.y0)} − ${fmt(q.alpha)}·${fmt(step.gy)} = <strong>${fmt(step.y1)}</strong></div>
      <hr style="border-color:#e5e7eb;">
      <div><strong>Answer:</strong> (x₁, y₁) = (<span class="code">${fmt(step.x1)}</span>, <span class="code">${fmt(step.y1)}</span>)</div>
    `;
  });

  return card;
}

function computeStep(q) {
  const { gx, gy } = q.gradFn({ x: q.x0, y: q.y0 });
  const x1 = q.x0 - q.alpha * gx;
  const y1 = q.y0 - q.alpha * gy;
  return { gx, gy, x1, y1 };
}

function renderAnswer(q, step) {
  const el = $('#answer');
  el.classList.remove('hidden');
  el.innerHTML = `
    <div>∇f(${fmt(q.x0)}, ${fmt(q.y0)}) = ${colVec(fmt(step.gx), fmt(step.gy))}</div>
    <div>(x₁, y₁) = ${colVec(fmt(q.x0), fmt(q.y0))} − ${fmt(q.alpha)} · ${colVec(fmt(step.gx), fmt(step.gy))}</div>
    <div>So, x₁ = ${fmt(q.x0)} − ${fmt(q.alpha)}·${fmt(step.gx)} = <strong>${fmt(step.x1)}</strong></div>
    <div>and y₁ = ${fmt(q.y0)} − ${fmt(q.alpha)}·${fmt(step.gy)} = <strong>${fmt(step.y1)}</strong></div>
    <hr style="border-color:#0b213f;">
    <div><strong>Answer:</strong> (x₁, y₁) = (<span class="code">${fmt(step.x1)}</span>, <span class="code">${fmt(step.y1)}</span>)</div>
  `;
}

function shuffled(array) { return array.map(v => [Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(([,v])=>v); }

function renderTenQuestions() {
  const container = $('#questions');
  container.innerHTML = '';
  const pool = shuffled(QUESTIONS);
  const selected = pool.length >= 10 ? pool.slice(0, 10) : [...pool, ...shuffled(QUESTIONS)].slice(0,10);
  selected.forEach((q, i) => {
    const card = renderQuestionCard(q, i);
    container.appendChild(card);
  });
}

function init() {
  renderTenQuestions();
}

document.addEventListener('DOMContentLoaded', init);
