// Dependency-free visual/interaction checks. Uses an isolated headless Chrome
// profile and a local static server; never connects to the private Robin app.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.ROBIN_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifacts = resolve(process.env.ROBIN_SCREENSHOTS || join(tmpdir(), 'robin-landing-screenshots'));
const profile = await mkdtemp(join(tmpdir(), 'robin-landing-chrome-'));
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://fixture').pathname;
  const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(root + '/')) { res.writeHead(404).end(); return; }
  try {
    const bytes = await readFile(path);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }).end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser, closed, socket, command;
try {
  browser = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', '--disable-extensions', '--disable-features=MediaRouter,OptimizationHints,Translate', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', '--user-data-dir=' + profile, 'about:blank'], { detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
  closed = new Promise(resolve => browser.once('close', resolve));
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chrome readiness timeout')), 15000);
    const lines = createInterface({ input: browser.stderr });
    lines.on('line', line => { const match = /DevTools listening on (ws:\/\/\S+)/.exec(line); if (match) { clearTimeout(timer); resolve(match[1]); } });
    browser.once('error', error => { clearTimeout(timer); reject(error); });
    browser.once('exit', () => { clearTimeout(timer); reject(Error('Chrome exited before readiness')); });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let next = 0;
  const pending = new Map(), requests = [], errors = [], failedRequests = [];
  socket.addEventListener('message', event => {
    const value = JSON.parse(event.data);
    if (value.id) {
      const request = pending.get(value.id);
      if (request) { clearTimeout(request.timer); pending.delete(value.id); value.error ? request.reject(Error(value.error.message)) : request.resolve(value.result); }
    } else if (value.method === 'Network.requestWillBeSent') requests.push(value.params.request.url);
    else if (value.method === 'Runtime.exceptionThrown') errors.push(value.params.exceptionDetails.text);
    else if (value.method === 'Network.loadingFailed') failedRequests.push(value.params.errorText);
    else if (value.method === 'Network.responseReceived' && value.params.response.status >= 400) failedRequests.push(value.params.response.url);
  });
  command = (method, params = {}, sessionId) => {
    const id = ++next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 15000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  };
  const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => command(method, params, sessionId);
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  await mkdir(artifacts, { recursive: true });
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 });
    await call('Page.navigate', { url: base });
    await evaluate(`new Promise(resolve=>{if(document.readyState==='complete')resolve();else addEventListener('load',resolve,{once:true})})`);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `horizontal overflow at ${width}px`);
    assert.equal(await evaluate(`document.querySelectorAll('h1').length`), 1);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.brand-dot')).backgroundColor`), 'rgb(112, 151, 124)');
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('a[href^="#"]')).every(a=>a.hash===''||!!document.getElementById(a.hash.slice(1)))`), true, 'broken section link');
    for (const [name, tier] of [['delivery', 'silent'], ['invoice', 'batch'], ['newsletter', 'silent'], ['person', 'interrupt']]) {
      await evaluate(`document.querySelector('[data-example="${name}"]').click()`);
      assert.equal(await evaluate(`document.querySelector('[data-route].active')?.dataset.route`), tier);
      assert.equal(await evaluate(`document.querySelectorAll('[aria-pressed="true"]').length`), 1);
    }
    if ([390, 1440].includes(width)) {
      const { data } = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: await evaluate('document.documentElement.scrollHeight'), scale: 1 } });
      await writeFile(join(artifacts, `${width}-full.png`), Buffer.from(data, 'base64'));
      const hero = await call('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(artifacts, `${width}-hero.png`), Buffer.from(hero.data, 'base64'));
      const region = await evaluate(`(() => {const r=document.getElementById('connections').getBoundingClientRect();return {y:r.top+scrollY,height:r.height}})()`);
      const connections = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: region.y, width, height: region.height, scale: 1 } });
      await writeFile(join(artifacts, `${width}-connections.png`), Buffer.from(connections.data, 'base64'));
    }
  }
  await evaluate(`document.querySelector('[data-example="invoice"]').focus()`);
  for (const type of ['keyDown', 'keyUp']) await call('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, ...(type === 'keyDown' ? { text: '\r' } : {}) });
  assert.equal(await evaluate(`document.querySelector('[data-route].active').dataset.route`), 'batch', 'Enter does not activate example');
  assert.equal(await evaluate(`document.activeElement.dataset.example`), 'invoice', 'selection moved keyboard focus');
  const contrastFailures = await evaluate(`(() => {
    const rgb = value => (value.match(/[\\d.]+/g) || []).map(Number);
    const luminance = channels => channels.slice(0,3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((n,v,i) => n + v * [.2126,.7152,.0722][i], 0);
    return Array.from(document.body.querySelectorAll('*')).filter(el => !el.closest('[aria-hidden="true"],svg,script,style') && Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())).flatMap(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return [];
      let ancestor = el, background;
      while (ancestor) {
        const candidate = rgb(getComputedStyle(ancestor).backgroundColor);
        if (candidate.length === 3 || candidate[3] === 1) { background = candidate; break; }
        ancestor = ancestor.parentElement;
      }
      if (!background) return [];
      const values = [luminance(rgb(style.color)), luminance(background)].sort((a,b) => a-b);
      const ratio = (values[1]+.05)/(values[0]+.05);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.67 && parseFloat(style.fontWeight) >= 700);
      return ratio + .01 < (large ? 3 : 4.5) ? [{text:el.textContent.trim().slice(0,45),color:style.color,ratio:Math.round(ratio*100)/100}] : [];
    });
  })()`);
  assert.deepEqual(contrastFailures, [], 'text contrast below WCAG AA');
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'auto');
  await call('Emulation.setScriptExecutionDisabled', { value: true });
  await call('Page.reload');
  await call('Emulation.setScriptExecutionDisabled', { value: false });
  await evaluate(`new Promise(resolve=>{if(document.readyState==='complete')resolve();else addEventListener('load',resolve,{once:true})})`);
  assert.equal(await evaluate(`document.querySelector('h1').textContent.includes('less noise')`), true);
  assert.equal(await evaluate(`document.querySelector('[data-result-title]').textContent`), 'This one deserves you.');
  assert.deepEqual(errors, [], 'browser exceptions');
  assert.deepEqual(failedRequests, [], 'failed assets');
  assert.deepEqual(requests.filter(url => /^https?:/.test(url) && new URL(url).origin !== base), [], 'external resource request');
  console.log('Chrome passed: 6 viewport sizes, all routing examples, keyboard, text contrast, reduced motion, readable without JS, section links and no remote loads.');
  console.log('Screenshots: ' + artifacts);
} finally {
  if (browser) {
    const safety = setTimeout(() => { try { process.kill(-browser.pid, 'SIGKILL'); } catch {} }, 5000);
    try { if (command && socket?.readyState === WebSocket.OPEN) await command('Browser.close'); else browser.kill('SIGTERM'); } catch { browser.kill('SIGTERM'); }
    await closed;
    clearTimeout(safety);
  }
  socket?.close();
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
