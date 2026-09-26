const DEFAULT_API_BASE = window.CALCULATOR_API_BASE_URL || 'http://127.0.0.1:8000';
const API_STORAGE_KEY = 'calculator-api-base-url';
const THEME_STORAGE_KEY = 'calculator-theme';
const SYSTEM_DARK_THEME = window.matchMedia('(prefers-color-scheme: dark)');

const ELEMENTS = {
  expression: document.querySelector('#expression'),
  result: document.querySelector('#result'),
  resultExpression: document.querySelector('#result-expression'),
  calculatorForm: document.querySelector('#calculator-form'),
  calculatorError: document.querySelector('#calculator-error'),
  calculateButton: document.querySelector('#calculate-button'),
  keypad: document.querySelector('#keypad'),
  scientificKeypad: document.querySelector('#scientific-keypad'),
  backspaceButton: document.querySelector('#backspace-button'),
  themeToggle: document.querySelector('#theme-toggle'),
  themeIcon: document.querySelector('#theme-icon'),
  themeLabel: document.querySelector('#theme-label'),
  themeColor: document.querySelector('meta[name="theme-color"]'),
  historyList: document.querySelector('#history-list'),
  historyState: document.querySelector('#history-state'),
  refreshHistory: document.querySelector('#refresh-history'),
  connectionStatus: document.querySelector('#connection-status'),
  connectionLabel: document.querySelector('#connection-label'),
  settings: document.querySelector('#settings'),
  settingsForm: document.querySelector('#settings-form'),
  settingsError: document.querySelector('#settings-error'),
  apiUrl: document.querySelector('#api-url')
};

class ApiError extends Error {
  constructor(message, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.isNetworkError = isNetworkError;
  }
}

function savedApiBase() {
  try {
    return localStorage.getItem(API_STORAGE_KEY) || DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

function savedTheme() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

let themePreference = savedTheme();

function activeTheme() {
  return themePreference || (SYSTEM_DARK_THEME.matches ? 'dark' : 'light');
}

function updateTheme() {
  const dark = activeTheme() === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  ELEMENTS.themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  ELEMENTS.themeIcon.textContent = dark ? '☀' : '☾';
  ELEMENTS.themeLabel.textContent = dark ? 'Light theme' : 'Dark theme';
  ELEMENTS.themeColor.content = dark ? '#0c171c' : '#f1f4f5';
}

function normalizeApiBase(value) {
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error('Enter a complete HTTP or HTTPS URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('Enter an HTTP or HTTPS URL without credentials, query parameters, or fragments.');
  }

  return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`;
}

let apiBase;
try {
  apiBase = normalizeApiBase(savedApiBase());
} catch {
  apiBase = normalizeApiBase(DEFAULT_API_BASE);
}
ELEMENTS.apiUrl.value = apiBase;

let historyRequestVersion = 0;
let calculating = false;

function setConnection(state) {
  ELEMENTS.connectionStatus.dataset.state = state;
  const labels = {
    connecting: 'Connecting to backend',
    online: 'Backend connected',
    offline: 'Backend unavailable'
  };
  ELEMENTS.connectionLabel.textContent = labels[state];
}

function showCalculatorError(message) {
  ELEMENTS.calculatorError.textContent = message;
  ELEMENTS.calculatorError.hidden = false;
}

function clearCalculatorError() {
  ELEMENTS.calculatorError.textContent = '';
  ELEMENTS.calculatorError.hidden = true;
}

function resetResult() {
  ELEMENTS.result.textContent = '—';
  ELEMENTS.resultExpression.textContent = '';
}

function setCalculating(value) {
  calculating = value;
  ELEMENTS.expression.disabled = value;
  ELEMENTS.backspaceButton.disabled = value;
  ELEMENTS.calculateButton.setAttribute('aria-busy', String(value));
  ELEMENTS.calculateButton.textContent = value ? '···' : '=';
  ELEMENTS.keypad.querySelectorAll('button').forEach((button) => {
    button.disabled = value;
  });
  ELEMENTS.scientificKeypad.querySelectorAll('button').forEach((button) => {
    button.disabled = value;
  });
  ELEMENTS.settingsForm.querySelector('button').disabled = value;
}

function visibleExpression(value) {
  return String(value).replaceAll('*', '×').replaceAll('/', '÷').replaceAll('-', '−');
}

function apiExpression(value) {
  return value.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
}

async function request(path, options = {}) {
  const controller = new AbortController();
  // Hosted HTTPS APIs can take about a minute to wake after an idle period.
  const timeoutMs = apiBase.startsWith('https://') ? 90000 : 12000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response;
    try {
      response = await fetch(`${apiBase}${path}`, {
        ...options,
        headers: {
          Accept: 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });
    } catch (error) {
      const message = error?.name === 'AbortError' || controller.signal.aborted
        ? 'Request timed out. Check the backend and try again.'
        : 'Could not connect to the backend. Check the API URL and server.';
      throw new ApiError(message, true);
    }

    setConnection('online');
    if (response.status === 204) {
      return { success: true };
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        throw new ApiError('Request timed out. Check the backend and try again.', true);
      }
      throw new ApiError('The backend did not return valid JSON.');
    }

    if (!payload || typeof payload !== 'object') {
      throw new ApiError('The backend returned an invalid response.');
    }

    if (!response.ok || payload.success === false) {
      const message = payload.error?.message || payload.message || `Request failed (HTTP ${response.status}).`;
      throw new ApiError(message);
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function setHistoryState(message, isError = false) {
  ELEMENTS.historyState.textContent = message;
  ELEMENTS.historyState.dataset.error = String(isError);
  ELEMENTS.historyState.hidden = false;
}

function formatTime(value) {
  if (!value) {
    return 'Time unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function historyAction(label, className, recordId, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = String(recordId);
  button.setAttribute('aria-label', `${label} calculation record ${recordId}`);
  return button;
}

function renderHistory(history) {
  ELEMENTS.historyList.replaceChildren();

  if (history.length === 0) {
    setHistoryState('No history yet');
    return;
  }

  const fragment = document.createDocumentFragment();
  history.forEach((record) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const main = document.createElement('div');
    main.className = 'history-item-main';

    const expression = document.createElement('div');
    expression.className = 'history-expression';
    expression.textContent = visibleExpression(record.expression);
    expression.title = visibleExpression(record.expression);

    const result = document.createElement('div');
    result.className = 'history-result';
    result.textContent = `= ${record.result_text ?? record.result}`;

    const time = document.createElement('div');
    time.className = 'history-time';
    time.textContent = formatTime(record.created_at);

    main.append(expression, result, time);

    const actions = document.createElement('div');
    actions.className = 'history-actions';
    actions.append(
      historyAction('Reuse', 'reuse-button', record.id, 'reuse'),
      historyAction('Delete', 'delete-button', record.id, 'delete')
    );

    item.append(main, actions);
    fragment.append(item);
  });

  ELEMENTS.historyList.append(fragment);
  ELEMENTS.historyState.hidden = true;
}

async function refreshHistory() {
  const version = ++historyRequestVersion;
  ELEMENTS.refreshHistory.disabled = true;
  ELEMENTS.historyList.replaceChildren();
  setHistoryState('Loading history...');

  try {
    const payload = await request('/api/history');
    if (version !== historyRequestVersion) {
      return;
    }
    if (!Array.isArray(payload.history)) {
      throw new ApiError('The history response has an invalid format.');
    }
    renderHistory(payload.history);
  } catch (error) {
    if (version !== historyRequestVersion) {
      return;
    }
    if (error.isNetworkError) {
      setConnection('offline');
    }
    setHistoryState(`Could not load history: ${error.message}`, true);
  } finally {
    if (version === historyRequestVersion) {
      ELEMENTS.refreshHistory.disabled = false;
    }
  }
}

function insertAtCursor(text) {
  if (calculating) {
    return;
  }

  const input = ELEMENTS.expression;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.setRangeText(text, start, end, 'end');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function insertFunctionAtCursor(name) {
  if (calculating) {
    return;
  }

  const input = ELEMENTS.expression;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const selected = input.value.slice(start, end);
  input.setRangeText(`${name}(${selected})`, start, end, 'end');
  if (start === end) {
    const argumentStart = start + name.length + 1;
    input.setSelectionRange(argumentStart, argumentStart);
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function groupAtCursor() {
  if (calculating) {
    return;
  }

  const input = ELEMENTS.expression;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const selected = input.value.slice(start, end);
  input.setRangeText(`(${selected})`, start, end, 'end');
  if (start === end) {
    input.setSelectionRange(start + 1, start + 1);
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function squareAtCursor() {
  if (calculating) {
    return;
  }

  const input = ELEMENTS.expression;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const selected = input.value.slice(start, end);
  input.setRangeText(selected ? `(${selected})^2` : '^2', start, end, 'end');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function clearExpression() {
  if (calculating) {
    return;
  }
  ELEMENTS.expression.value = '';
  ELEMENTS.expression.dispatchEvent(new Event('input', { bubbles: true }));
  ELEMENTS.expression.focus();
}

function backspace() {
  if (calculating) {
    return;
  }
  const input = ELEMENTS.expression;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  if (start !== end) {
    input.setRangeText('', start, end, 'end');
  } else if (start > 0) {
    input.setRangeText('', start - 1, start, 'end');
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function previousNonSpace(value, beforeIndex) {
  for (let index = beforeIndex; index >= 0; index -= 1) {
    if (!/\s/.test(value[index])) {
      return value[index];
    }
  }
  return null;
}

function toggleSign() {
  if (calculating) {
    return;
  }

  const input = ELEMENTS.expression;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;

  if (start !== end) {
    const selected = input.value.slice(start, end);
    input.setRangeText(`-(${selected})`, start, end, 'end');
  } else {
    const prefix = input.value.slice(0, start);
    const match = prefix.match(/(?:\d+(?:\.\d*)?|\.\d+)$/);

    if (!match) {
      input.setRangeText('-', start, end, 'end');
    } else {
      const numberStart = start - match[0].length;
      const signIndex = numberStart - 1;
      const sign = input.value[signIndex];
      const beforeSign = previousNonSpace(input.value, signIndex - 1);
      const isUnarySign = ['+', '-', '−'].includes(sign)
        && (beforeSign === null || '+-−*/×÷(^'.includes(beforeSign));

      if (isUnarySign && (sign === '-' || sign === '−')) {
        input.setRangeText('', signIndex, numberStart, 'end');
      } else if (isUnarySign && sign === '+') {
        input.setRangeText('-', signIndex, numberStart, 'end');
      } else {
        input.setRangeText('-', numberStart, numberStart, 'end');
      }
    }
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

async function calculate() {
  if (calculating) {
    return;
  }

  const expression = apiExpression(ELEMENTS.expression.value.trim());
  clearCalculatorError();
  resetResult();

  if (!expression) {
    showCalculatorError('Enter an expression first.');
    ELEMENTS.expression.focus();
    return;
  }

  setCalculating(true);
  ELEMENTS.resultExpression.textContent = 'Calculating on backend...';

  try {
    const payload = await request('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression })
    });

    if (!Object.hasOwn(payload, 'result_text') && !Object.hasOwn(payload, 'result')) {
      throw new ApiError('The backend response did not include a result.');
    }

    ELEMENTS.result.textContent = String(payload.result_text ?? payload.result);
    ELEMENTS.resultExpression.textContent = visibleExpression(payload.expression || expression);
    refreshHistory();
  } catch (error) {
    if (error.isNetworkError) {
      setConnection('offline');
    }
    resetResult();
    showCalculatorError(error.message);
  } finally {
    setCalculating(false);
  }
}

async function deleteHistory(id, button) {
  button.disabled = true;
  button.textContent = 'Deleting...';
  try {
    await request(`/api/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await refreshHistory();
  } catch (error) {
    if (error.isNetworkError) {
      setConnection('offline');
    }
    button.disabled = false;
    button.textContent = 'Delete';
    setHistoryState(`Could not delete record: ${error.message}`, true);
  }
}

ELEMENTS.calculatorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  calculate();
});

ELEMENTS.expression.addEventListener('input', () => {
  clearCalculatorError();
  resetResult();
});

ELEMENTS.keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) {
    return;
  }

  if (button.dataset.insert) {
    insertAtCursor(button.dataset.insert);
  } else if (button.dataset.action === 'clear') {
    clearExpression();
  } else if (button.dataset.action === 'sign') {
    toggleSign();
  }
});

ELEMENTS.scientificKeypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) {
    return;
  }

  if (button.dataset.function) {
    insertFunctionAtCursor(button.dataset.function);
  } else if (button.dataset.insert) {
    insertAtCursor(button.dataset.insert);
  } else if (button.dataset.action === 'square') {
    squareAtCursor();
  } else if (button.dataset.action === 'group') {
    groupAtCursor();
  }
});

ELEMENTS.themeToggle.addEventListener('click', () => {
  themePreference = activeTheme() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  } catch {
    // Theme still works for this session when storage is unavailable.
  }
  updateTheme();
});

SYSTEM_DARK_THEME.addEventListener('change', () => {
  if (themePreference === null) {
    updateTheme();
  }
});

ELEMENTS.backspaceButton.addEventListener('click', backspace);
ELEMENTS.refreshHistory.addEventListener('click', refreshHistory);

ELEMENTS.historyList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  if (button.dataset.action === 'delete') {
    deleteHistory(button.dataset.id, button);
  } else if (button.dataset.action === 'reuse') {
    const item = button.closest('.history-item');
    const text = item.querySelector('.history-expression').textContent;
    ELEMENTS.expression.value = text;
    ELEMENTS.expression.dispatchEvent(new Event('input', { bubbles: true }));
    ELEMENTS.expression.focus();
    ELEMENTS.expression.setSelectionRange(text.length, text.length);
  }
});

ELEMENTS.settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  ELEMENTS.settingsError.textContent = '';

  try {
    apiBase = normalizeApiBase(ELEMENTS.apiUrl.value);
    ELEMENTS.apiUrl.value = apiBase;
    try {
      localStorage.setItem(API_STORAGE_KEY, apiBase);
    } catch {
      // The current session can still use the configured address.
    }
    ELEMENTS.settings.open = false;
    setConnection('connecting');
    clearCalculatorError();
    resetResult();
    refreshHistory();
  } catch (error) {
    ELEMENTS.settingsError.textContent = error.message;
  }
});

document.addEventListener('keydown', (event) => {
  const target = event.target;
  if (target === ELEMENTS.expression) {
    if (event.key === 'Enter') {
      event.preventDefault();
      calculate();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      clearExpression();
    }
    return;
  }

  if (target.closest('input, textarea, button, summary')) {
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    calculate();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    clearExpression();
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    backspace();
  } else if (/^[0-9.+\-*/()×÷−^]$/.test(event.key)) {
    event.preventDefault();
    insertAtCursor(event.key);
  }
});

updateTheme();
refreshHistory();

