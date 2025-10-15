# Gradient Descent Practice (No frameworks)

A tiny, front-end only practice app to help students take a single gradient descent step on simple 2D surfaces.

- Plain HTML/CSS/JS
- Single page: `index.html` at the repo root
- No build step; open directly in a browser

## What it does

- Shows a surface `f(x, y)` and its gradient `∇f(x, y)` (as a column vector)
- Provides a learning rate `α` and starting point `(x₀, y₀)`
- Students compute one step: `(x₁, y₁) = (x₀, y₀) − α · ∇f(x₀, y₀)`
- Click "Reveal Answer" to see the computed next point and working
- Click "New Question" to cycle through randomized examples

## Try it locally

Just open the `index.html` file in your browser (no server needed):

- On most systems you can double-click `index.html`.
- Or from a terminal:

```bash
xdg-open index.html 2>/dev/null || open index.html || start index.html
```

If your browser blocks local file access for some reason, you can serve the folder:

```bash
# Optional: serve on http://localhost:8080
python3 -m http.server 8080
```

Then visit http://localhost:8080.

## Next steps (ideas)

- Add input fields so students can plug in their own `(x₀, y₀)` or `α`
- Add validation mode where students enter `(x₁, y₁)` and get feedback
- Track multiple steps and plot the path on a contour plot (still no frameworks)
- Allow custom functions (with a safe parser) and symbolic gradient display