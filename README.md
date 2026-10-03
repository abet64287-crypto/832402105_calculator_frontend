# 832402105 Calculator Frontend

This is the web client for my calculator assignment. It sends expressions to the separate backend, shows the returned results, and reads calculation history. The frontend does not calculate final answers or store history records.

- Frontend repository: <https://github.com/abet64287-crypto/832402105_calculator_frontend>
- Backend repository: <https://github.com/abet64287-crypto/832402105_calculator_backend>

## Stack and runtime

The frontend uses plain HTML, CSS, and JavaScript in a modern browser. There are no npm packages to install. The example local static server requires Python 3.10+; any other static file server also works. Calculation and history require the backend API.

## Run locally

Start the backend first using its README. Its default address is `http://127.0.0.1:8000`. From this repository's root, run:

~~~sh
python -m http.server 5173 --directory src
~~~

Open <http://127.0.0.1:5173>. The page reads `GET /api/history` at startup and shows **Backend connected** when the API responds. There is no frontend database initialization. In the local backend setup, SQLite creates its database file and `calculation_history` table at startup; see the backend README for its database settings.

## API connection and settings

`src/config.js` contains the local API default. The GitHub Pages workflow creates a separate published `config.js` using a repository variable, so the source file can keep the local address. **API settings** on the page can also change the URL. A manually saved URL takes priority over the default.

The browser saves only the API URL and theme preference in `localStorage`. It sends `POST /api/calculate` for a new result, reads `GET /api/history` for records, and calls `DELETE /api/history/{id}` to remove one record before refreshing the list. Successful calculations are saved by the backend in its database. The page displays `result_text` when provided, which avoids rounding a long decimal or large integer for display.

For different frontend and backend origins, configure `CALCULATOR_ALLOWED_ORIGINS` on the backend. A public HTTPS frontend needs an HTTPS API endpoint; local development can use HTTP.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy-pages.yml` copies `src/` into the Pages artifact when `main` changes or the workflow is run manually. Asset paths are relative, so they work under the repository path. On October 3, workflow run `37127417185` succeeded, <https://abet64287-crypto.github.io/832402105_calculator_frontend/> returned HTTP 200, and its published `config.js` pointed to `https://43-129-177-221.sslip.io`. This hostname reaches the same Tencent Cloud server as my purchased domain. A direct request without a proxy returned HTTP 200 with normal TLS validation. On a device and Wi-Fi network that could not open my purchased domain, the updated Pages site showed **Backend connected**, calculated `sin(pi/2)=1`, added it to history, and deleted it.

The deployment uses the repository variable `CALCULATOR_API_BASE_URL=https://43-129-177-221.sslip.io` and **GitHub Actions** as the Pages source. To redeploy, push `main` or use `Actions → Deploy frontend to GitHub Pages → Run workflow`. The variable must be an HTTPS origin without `/api`, another path, credentials, a query string, or a database URL; the build fails if it is missing. The current API health URL is <https://43-129-177-221.sslip.io/api/health>. The original <https://api.calculator-demo.site/api/health> remains configured on the server, but some direct network paths reset it. I still need to repeat more expression and theme cases on the deployed page.

The backend allows `https://abet64287-crypto.github.io` for this Pages site; a public CORS preflight returned HTTP 204 with that allowed origin. The origin does not contain the `/832402105_calculator_frontend/` path. If the page still uses an old API URL, update **API settings**; its saved browser value overrides the workflow default.

Remote HTTPS requests time out after 20 seconds and local HTTP requests after 12 seconds. Keep the backend available during the evaluation period.

## Features

- Type an expression or use the keypad. The interface shows `×` and `÷` while the API receives `*` and `/`.
- Use `Enter` to calculate, `Backspace` to delete a character, `Esc` to clear, and `±` to change a number's sign.
- Use **Reuse** to put a history expression back in the input, or **Delete** to remove one record through the API.
- Open **Scientific** for `sin`, `cos`, `tan`, `sqrt`, `ln`, `log`, `abs`, powers, square, `pi`, `e`, and parentheses. Trigonometric arguments use radians; `log` is base 10. The buttons edit the expression, and the backend performs the calculation.
- Switch between light and dark themes. The initial theme follows the system until a choice is saved.
- Read errors for invalid expressions, division by zero, timeouts, and backend connection problems.

## Files

- `src/index.html`: page structure and labels.
- `src/styles.css`: responsive layout and visual states.
- `src/config.js`: local API default.
- `src/app.js`: input, requests, results, history, settings, and theme.
- `scripts/build-pages.mjs`: Pages artifact and published API setting.
- `src/blog-screenshots/`: images used by the English assignment blog and served by Pages.
- `codestyle.md`: code conventions and sources.

## Quick checks

With the backend running, calculate `12+8`, `1+2*3`, `(1+2)*3`, `3*-2`, and `0.1+0.2`. Each successful expression should appear in history. `1/0` and `1+` should show errors without adding records. Refresh, delete one history item, and refresh again. Stop the backend and try another calculation; the page should show a connection error instead of a new answer.

For the extensions, try `sqrt(81)`, `sin(pi/2)`, and `2^3^2`; the backend should return `9`, `1`, and `512`. `sqrt(-1)` should show an error without adding history. Switch themes and refresh to check that the choice remains.
