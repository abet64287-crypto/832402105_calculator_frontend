# Frontend Code Style

Sources: [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html) and [MDN Code Style Guide](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Code_style_guide). I use a small set of their conventions for this plain HTML, CSS, and JavaScript project.

## JavaScript

- Use UTF-8, two-space indentation, and semicolons.
- Prefer `const`; use `let` when a value must change. Do not use `var`.
- Use `camelCase` for variables and functions, and `UPPER_SNAKE_CASE` for constants.
- Keep event handling, API requests, and DOM updates in separate functions where practical.
- Use `async`/`await` for requests and show a useful message when a request fails.
- Send expressions to the backend for calculation. Do not calculate final answers in the browser or run input with `eval`.
- Add expressions, results, and error messages to the page with `textContent` rather than inserting untrusted HTML.

## HTML and CSS

- Use semantic elements, associated form labels, and clear button names.
- Keep keyboard controls usable and focus indicators visible. Announce changed results and errors through suitable status regions.
- Use lowercase, hyphenated CSS class names and keep the layout usable on narrow screens.
- Do not rely on color alone to explain status or errors.

## Checks

- Check basic operations, compound expressions, keyboard input, history, deleting one record, and network errors.
- Check scientific keys, theme switching, and a narrow viewport.
- Keep history in the backend database. Browser storage is only for interface settings such as the API address and theme.
