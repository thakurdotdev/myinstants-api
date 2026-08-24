import { Elysia } from "elysia";

const DOCS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyInstants API Reference</title>
  <meta name="description" content="High-performance REST API for MyInstants soundboard by Pankaj Thakur.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔊</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #000000;
      --surface: #09090b;
      --surface-subtle: #121215;
      --surface-hover: #18181b;
      --surface-code: #050507;
      --border: #27272a;
      --border-subtle: #1c1c20;
      --text: #ededed;
      --text-muted: #8e8e93;
      --text-faint: #52525b;
      --green: #10b981;
      --green-subtle: rgba(16, 185, 129, 0.08);
      --green-border: rgba(16, 185, 129, 0.2);
      --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'Geist Mono', monospace;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scrollbar-gutter: stable;
      overflow-x: hidden;
      background-color: var(--bg);
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding: 0 16px 80px;
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
    }

    .nav {
      max-width: 860px;
      margin: 0 auto;
      padding: 20px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-title {
      font-weight: 600;
      font-size: 15px;
      letter-spacing: -0.02em;
      color: var(--text);
    }

    .brand-author {
      font-size: 12px;
      color: var(--text-muted);
    }

    .brand-author a {
      color: var(--text);
      text-decoration: none;
      border-bottom: 1px solid var(--border);
      transition: border-color 0.15s;
    }

    .brand-author a:hover {
      border-color: var(--text);
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--green);
      font-family: var(--font-mono);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 6px var(--green);
    }

    .main {
      max-width: 860px;
      margin: 0 auto;
      padding-top: 36px;
      width: 100%;
      min-width: 0;
    }

    .hero {
      margin-bottom: 36px;
    }

    .hero-title {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
      color: #ffffff;
    }

    .hero-desc {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 18px;
      max-width: 640px;
    }

    .base-url-bar {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 6px 12px;
      font-family: var(--font-mono);
      font-size: 12px;
      max-width: 100%;
    }

    .base-label {
      color: var(--text-faint);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .base-url {
      color: var(--text);
      word-break: break-all;
    }

    .icon-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 2px;
      transition: color 0.15s;
    }

    .icon-btn:hover {
      color: var(--text);
    }

    .section-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-faint);
      font-weight: 600;
      margin-bottom: 16px;
      font-family: var(--font-mono);
    }

    /* Endpoint Card */
    .endpoint {
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      margin-bottom: 24px;
      overflow: hidden;
      width: 100%;
      min-width: 0;
    }

    .endpoint-header {
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
      gap: 12px;
      flex-wrap: wrap;
    }

    .endpoint-identity {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-mono);
    }

    .method-get {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--green-subtle);
      color: var(--green);
      border: 1px solid var(--green-border);
    }

    .endpoint-path {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
    }

    .endpoint-body {
      padding: 18px;
      min-width: 0;
    }

    .endpoint-description {
      color: var(--text-muted);
      font-size: 13px;
      margin-bottom: 16px;
    }

    /* Params Table */
    .table-container {
      margin-bottom: 16px;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      overflow-x: auto;
      width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }

    th {
      background: #0d0d10;
      color: var(--text-faint);
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 7px 12px;
      border-bottom: 1px solid var(--border-subtle);
    }

    td {
      padding: 7px 12px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-muted);
    }

    tr:last-child td {
      border-bottom: none;
    }

    .param-name {
      font-family: var(--font-mono);
      color: var(--text);
      font-weight: 500;
    }

    .param-type {
      font-family: var(--font-mono);
      color: var(--text-faint);
      font-size: 11px;
    }

    .badge-req {
      font-size: 10px;
      color: #f87171;
      font-family: var(--font-mono);
    }

    .badge-opt {
      font-size: 10px;
      color: var(--text-faint);
      font-family: var(--font-mono);
    }

    /* Interactive Tester Toolbar */
    .tester-toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #0a0a0d;
      border: 1px solid var(--border-subtle);
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      padding: 8px 12px;
      flex-wrap: wrap;
      width: 100%;
    }

    .tester-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tester-label {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-faint);
    }

    .param-input {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 4px;
      outline: none;
      transition: border-color 0.15s;
    }

    .param-input:focus {
      border-color: #52525b;
    }

    .param-input[type="number"] {
      width: 58px;
    }

    .param-input[type="text"] {
      width: 140px;
    }

    .try-btn {
      margin-left: auto;
      background: #18181b;
      border: 1px solid var(--border);
      color: #fafafa;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-family: var(--font-sans);
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .try-btn:hover {
      background: #27272a;
      border-color: #3f3f46;
    }

    .try-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Code Box with Fixed Scrollable Area */
    .code-box {
      background: var(--surface-code);
      border: 1px solid var(--border-subtle);
      border-radius: 0 0 6px 6px;
      position: relative;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }

    .code-tabs {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      border-bottom: 1px solid var(--border-subtle);
      background: #08080a;
      gap: 8px;
      flex-wrap: wrap;
    }

    .status-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 11px;
    }

    .tab-title {
      color: var(--text-faint);
    }

    .latency-badge {
      color: var(--green);
      font-size: 11px;
    }

    .items-badge {
      color: var(--text-muted);
      font-size: 11px;
    }

    .code-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .view-toggle {
      background: none;
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 2px 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .view-toggle.active {
      color: var(--text);
      background: var(--surface-subtle);
      border-color: var(--border);
    }

    .code-copy {
      background: none;
      border: none;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.15s;
    }

    .code-copy:hover {
      color: var(--text);
    }

    pre {
      padding: 12px 14px;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.6;
      color: #d4d4d8;
      max-height: 280px;
      overflow-y: auto;
      overflow-x: auto;
      width: 100%;
      scrollbar-width: thin;
      scrollbar-color: #27272a #050507;
      white-space: pre;
    }

    pre::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    pre::-webkit-scrollbar-track {
      background: #050507;
    }

    pre::-webkit-scrollbar-thumb {
      background: #27272a;
      border-radius: 3px;
    }

    /* Sound Preview List View */
    .sound-preview-list {
      padding: 10px 12px;
      max-height: 280px;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 6px;
      scrollbar-width: thin;
      scrollbar-color: #27272a #050507;
    }

    .sound-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      gap: 8px;
    }

    .sound-item-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .sound-item-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sound-item-id {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-faint);
    }

    .play-sound-btn {
      background: #18181b;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      transition: all 0.15s;
    }

    .play-sound-btn:hover {
      background: #27272a;
      border-color: #3f3f46;
    }

    .play-sound-btn.playing {
      background: var(--green-subtle);
      border-color: var(--green-border);
      color: var(--green);
    }

    .k { color: #7dd3fc; } /* key */
    .s { color: #86efac; } /* string */
    .n { color: #fca5a5; } /* number */
    .b { color: #fdba74; } /* boolean */
    .c { color: #52525b; } /* comment */

    footer {
      max-width: 860px;
      margin: 48px auto 0;
      padding-top: 24px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-faint);
      font-size: 12px;
      flex-wrap: wrap;
      gap: 12px;
    }

    footer a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s;
    }

    footer a:hover {
      color: var(--text);
    }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="brand">
      <span class="brand-title">myinstants-api</span>
      <span class="brand-author">by <a href="https://thakur.dev" target="_blank" rel="noopener">Pankaj Thakur</a></span>
    </div>
    <div class="status-pill">
      <span class="status-dot"></span>
      <span>API online</span>
    </div>
  </nav>

  <main class="main">
    <header class="hero">
      <h1 class="hero-title">API Reference</h1>
      <p class="hero-desc">
        Fast, fully typed REST API around the <a href="https://www.myinstants.com" target="_blank" rel="noopener" style="color:var(--text);text-decoration:none;border-bottom:1px solid var(--border);">MyInstants</a> soundboard with multi-page pagination and resilient caching.
      </p>
      <div class="base-url-bar">
        <span class="base-label">Base</span>
        <span class="base-url">https://myinstants.thakur.dev</span>
        <button class="icon-btn" onclick="copyValue('https://myinstants.thakur.dev', this)" title="Copy Base URL">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </header>

    <div class="section-label">Endpoints</div>

    <!-- GET /api/feed -->
    <article class="endpoint">
      <div class="endpoint-header">
        <div class="endpoint-identity">
          <span class="method-get">GET</span>
          <span class="endpoint-path">/api/feed</span>
        </div>
      </div>
      <div class="endpoint-body">
        <p class="endpoint-description">Returns trending soundboard buttons in feed order.</p>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Param</th>
                <th>Type</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="param-name">page</td>
                <td class="param-type">integer</td>
                <td><span class="badge-opt">optional</span></td>
                <td>Page number (default: <code>1</code>, minimum: <code>1</code>).</td>
              </tr>
              <tr>
                <td class="param-name">refresh</td>
                <td class="param-type">boolean</td>
                <td><span class="badge-opt">optional</span></td>
                <td>Bypasses cache and fetches fresh upstream data when <code>true</code>.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="tester-toolbar">
          <div class="tester-group">
            <span class="tester-label">page:</span>
            <input type="number" id="feed-page-input" value="1" min="1" class="param-input" onkeydown="if(event.key==='Enter') sendFeedRequest()" />
          </div>
          <button class="try-btn" id="feed-btn" onclick="sendFeedRequest()">Send request</button>
        </div>

        <div class="code-box">
          <div class="code-tabs">
            <div class="status-meta">
              <span class="tab-title" id="feed-status-title">Response</span>
              <span class="latency-badge" id="feed-latency"></span>
              <span class="items-badge" id="feed-items-count"></span>
            </div>
            <div class="code-actions">
              <button class="view-toggle active" id="feed-btn-json" onclick="toggleView('feed', 'json')">JSON</button>
              <button class="view-toggle" id="feed-btn-audio" onclick="toggleView('feed', 'audio')">Play Sounds</button>
              <button class="code-copy" onclick="copyCode('feed-output')">Copy</button>
            </div>
          </div>
          <pre id="feed-pre"><code id="feed-output">{
  <span class="k">"page"</span>: <span class="n">1</span>,
  <span class="k">"data"</span>: [
    {
      <span class="k">"id"</span>: <span class="s">"fart"</span>,
      <span class="k">"name"</span>: <span class="s">"Fart"</span>,
      <span class="k">"url"</span>: <span class="s">"https://www.myinstants.com/media/sounds/fart-2.mp3"</span>
    },
    {
      <span class="k">"id"</span>: <span class="s">"vine-boom"</span>,
      <span class="k">"name"</span>: <span class="s">"VINE BOOM SOUND"</span>,
      <span class="k">"url"</span>: <span class="s">"https://www.myinstants.com/media/sounds/vine-boom.mp3"</span>
    }
  ]
}</code></pre>
          <div class="sound-preview-list" id="feed-audio-list" style="display:none;"></div>
        </div>
      </div>
    </article>

    <!-- GET /api/search -->
    <article class="endpoint">
      <div class="endpoint-header">
        <div class="endpoint-identity">
          <span class="method-get">GET</span>
          <span class="endpoint-path">/api/search</span>
        </div>
      </div>
      <div class="endpoint-body">
        <p class="endpoint-description">Searches sound clips by keyword matching <code>q</code>.</p>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Param</th>
                <th>Type</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="param-name">q</td>
                <td class="param-type">string</td>
                <td><span class="badge-req">required</span></td>
                <td>Search keyword query.</td>
              </tr>
              <tr>
                <td class="param-name">page</td>
                <td class="param-type">integer</td>
                <td><span class="badge-opt">optional</span></td>
                <td>Page number (default: <code>1</code>, minimum: <code>1</code>).</td>
              </tr>
              <tr>
                <td class="param-name">refresh</td>
                <td class="param-type">boolean</td>
                <td><span class="badge-opt">optional</span></td>
                <td>Bypasses cache and fetches fresh upstream data when <code>true</code>.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="tester-toolbar">
          <div class="tester-group">
            <span class="tester-label">q:</span>
            <input type="text" id="search-q-input" value="meme" class="param-input" placeholder="query" onkeydown="if(event.key==='Enter') sendSearchRequest()" />
          </div>
          <div class="tester-group">
            <span class="tester-label">page:</span>
            <input type="number" id="search-page-input" value="1" min="1" class="param-input" onkeydown="if(event.key==='Enter') sendSearchRequest()" />
          </div>
          <button class="try-btn" id="search-btn" onclick="sendSearchRequest()">Send request</button>
        </div>

        <div class="code-box">
          <div class="code-tabs">
            <div class="status-meta">
              <span class="tab-title" id="search-status-title">Response</span>
              <span class="latency-badge" id="search-latency"></span>
              <span class="items-badge" id="search-items-count"></span>
            </div>
            <div class="code-actions">
              <button class="view-toggle active" id="search-btn-json" onclick="toggleView('search', 'json')">JSON</button>
              <button class="view-toggle" id="search-btn-audio" onclick="toggleView('search', 'audio')">Play Sounds</button>
              <button class="code-copy" onclick="copyCode('search-output')">Copy</button>
            </div>
          </div>
          <pre id="search-pre"><code id="search-output">{
  <span class="k">"page"</span>: <span class="n">1</span>,
  <span class="k">"data"</span>: [
    {
      <span class="k">"id"</span>: <span class="s">"meme-sound"</span>,
      <span class="k">"name"</span>: <span class="s">"Meme Sound"</span>,
      <span class="k">"url"</span>: <span class="s">"https://www.myinstants.com/media/sounds/meme-sound.mp3"</span>
    }
  ]
}</code></pre>
          <div class="sound-preview-list" id="search-audio-list" style="display:none;"></div>
        </div>
      </div>
    </article>

    <!-- GET /health -->
    <article class="endpoint">
      <div class="endpoint-header">
        <div class="endpoint-identity">
          <span class="method-get">GET</span>
          <span class="endpoint-path">/health</span>
        </div>
        <button class="try-btn" id="health-btn" onclick="sendHealthRequest()">Send request</button>
      </div>
      <div class="endpoint-body">
        <p class="endpoint-description">Service uptime status and active caching engine.</p>
        <div class="code-box" style="border-radius:6px;">
          <div class="code-tabs">
            <div class="status-meta">
              <span class="tab-title" id="health-status-title">Response</span>
              <span class="latency-badge" id="health-latency"></span>
            </div>
            <button class="code-copy" onclick="copyCode('health-output')">Copy</button>
          </div>
          <pre id="health-pre"><code id="health-output">{
  <span class="k">"status"</span>: <span class="s">"ok"</span>,
  <span class="k">"cache"</span>: <span class="s">"redis"</span>
}</code></pre>
        </div>
      </div>
    </article>

    <footer>
      <div>
        Built by <a href="https://thakur.dev" target="_blank" rel="noopener">Pankaj Thakur</a> &bull; Data from <a href="https://www.myinstants.com" target="_blank" rel="noopener">MyInstants</a>
      </div>
      <div>
        <a href="https://thakur.dev" target="_blank" rel="noopener">thakur.dev</a>
      </div>
    </footer>
  </main>

  <script>
    let currentAudio = null;
    let currentAudioBtn = null;

    function copyValue(val, btn) {
      navigator.clipboard.writeText(val).then(() => {
        const prev = btn.innerHTML;
        btn.innerHTML = '<span style="color:#10b981;font-size:10px;font-family:var(--font-mono)">copied</span>';
        setTimeout(() => { btn.innerHTML = prev; }, 1200);
      });
    }

    function copyCode(targetId) {
      const code = document.getElementById(targetId).innerText;
      navigator.clipboard.writeText(code).then(() => {
        const btn = event.target;
        const prev = btn.innerText;
        btn.innerText = 'Copied!';
        btn.style.color = '#10b981';
        setTimeout(() => {
          btn.innerText = prev;
          btn.style.color = '';
        }, 1200);
      });
    }

    function highlightJson(json) {
      return JSON.stringify(json, null, 2)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, (match) => {
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              return '<span class="k">' + match.slice(0, -1) + '</span>:';
            }
            return '<span class="s">' + match + '</span>';
          }
          if (/true|false/.test(match)) return '<span class="b">' + match + '</span>';
          return '<span class="n">' + match + '</span>';
        });
    }

    function toggleView(endpoint, view) {
      const isJson = view === 'json';
      document.getElementById(endpoint + '-btn-json').classList.toggle('active', isJson);
      document.getElementById(endpoint + '-btn-audio').classList.toggle('active', !isJson);
      document.getElementById(endpoint + '-pre').style.display = isJson ? 'block' : 'none';
      document.getElementById(endpoint + '-audio-list').style.display = isJson ? 'none' : 'flex';
    }

    function renderAudioList(containerId, sounds) {
      const container = document.getElementById(containerId);
      if (!container) return;
      if (!Array.isArray(sounds) || sounds.length === 0) {
        container.innerHTML = '<div style="color:var(--text-faint);font-size:12px;padding:12px;text-align:center;">No sound clips to preview.</div>';
        return;
      }
      container.innerHTML = sounds.map((s, idx) => \`
        <div class="sound-item">
          <div class="sound-item-info">
            <span class="sound-item-name">\${s.name}</span>
            <span class="sound-item-id">#\${idx + 1} &bull; \${s.id}</span>
          </div>
          <button class="play-sound-btn" onclick="playSound('\${s.url}', this)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Play
          </button>
        </div>
      \`).join('');
    }

    function playSound(url, btn) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
        if (currentAudioBtn) {
          currentAudioBtn.classList.remove('playing');
          currentAudioBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
        }
        if (currentAudioBtn === btn) {
          currentAudioBtn = null;
          return;
        }
      }

      const audio = new Audio(url);
      currentAudio = audio;
      currentAudioBtn = btn;
      btn.classList.add('playing');
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop';

      audio.play().catch(() => {
        btn.classList.remove('playing');
        btn.innerHTML = 'Error';
      });

      audio.onended = () => {
        btn.classList.remove('playing');
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
        currentAudio = null;
        currentAudioBtn = null;
      };
    }

    async function sendFeedRequest() {
      const page = document.getElementById('feed-page-input').value || 1;
      const btn = document.getElementById('feed-btn');
      const target = document.getElementById('feed-output');
      const title = document.getElementById('feed-status-title');
      const latencyEl = document.getElementById('feed-latency');
      const countEl = document.getElementById('feed-items-count');

      btn.disabled = true;
      btn.innerText = 'Sending...';
      target.innerHTML = '<span class="c">// Fetching GET /api/feed?page=' + page + '...</span>';
      
      const t0 = performance.now();
      try {
        const res = await fetch('/api/feed?page=' + encodeURIComponent(page));
        const elapsed = Math.round(performance.now() - t0);
        title.innerText = res.status + ' ' + res.statusText;
        latencyEl.innerText = elapsed + 'ms';
        
        const json = await res.json();
        const count = json.data ? json.data.length : 0;
        countEl.innerText = count + ' sounds';
        target.innerHTML = highlightJson(json);
        renderAudioList('feed-audio-list', json.data || []);
      } catch (err) {
        target.innerHTML = '<span class="c">// Error: ' + err.message + '</span>';
        latencyEl.innerText = '';
        countEl.innerText = '';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Send request';
      }
    }

    async function sendSearchRequest() {
      const q = document.getElementById('search-q-input').value.trim();
      const page = document.getElementById('search-page-input').value || 1;
      const btn = document.getElementById('search-btn');
      const target = document.getElementById('search-output');
      const title = document.getElementById('search-status-title');
      const latencyEl = document.getElementById('search-latency');
      const countEl = document.getElementById('search-items-count');

      btn.disabled = true;
      btn.innerText = 'Sending...';
      target.innerHTML = '<span class="c">// Fetching GET /api/search?q=' + encodeURIComponent(q) + '&page=' + page + '...</span>';
      
      const t0 = performance.now();
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(q) + '&page=' + encodeURIComponent(page));
        const elapsed = Math.round(performance.now() - t0);
        title.innerText = res.status + ' ' + res.statusText;
        latencyEl.innerText = elapsed + 'ms';
        
        const json = await res.json();
        const count = json.data ? json.data.length : 0;
        countEl.innerText = count + ' sounds';
        target.innerHTML = highlightJson(json);
        renderAudioList('search-audio-list', json.data || []);
      } catch (err) {
        target.innerHTML = '<span class="c">// Error: ' + err.message + '</span>';
        latencyEl.innerText = '';
        countEl.innerText = '';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Send request';
      }
    }

    async function sendHealthRequest() {
      const btn = document.getElementById('health-btn');
      const target = document.getElementById('health-output');
      const title = document.getElementById('health-status-title');
      const latencyEl = document.getElementById('health-latency');

      btn.disabled = true;
      btn.innerText = 'Sending...';
      target.innerHTML = '<span class="c">// Fetching GET /health...</span>';
      
      const t0 = performance.now();
      try {
        const res = await fetch('/health');
        const elapsed = Math.round(performance.now() - t0);
        title.innerText = res.status + ' ' + res.statusText;
        latencyEl.innerText = elapsed + 'ms';
        const json = await res.json();
        target.innerHTML = highlightJson(json);
      } catch (err) {
        target.innerHTML = '<span class="c">// Error: ' + err.message + '</span>';
        latencyEl.innerText = '';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Send request';
      }
    }
  </script>
</body>
</html>`;

export function docsRoutes() {
  return new Elysia()
    .get("/", ({ set }) => {
      set.headers["content-type"] = "text/html; charset=utf-8";
      return DOCS_HTML;
    })
    .get("/favicon.ico", ({ set }) => {
      set.status = 204;
      return null;
    });
}
