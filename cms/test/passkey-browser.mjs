import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/server.js';

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function eventually(callback, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const result = await callback();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error('Timed out waiting for browser state');
}

async function connectCdp(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  return {
    call(method, params = {}) {
      sequence += 1;
      return new Promise((resolve, reject) => {
        pending.set(sequence, { resolve, reject });
        socket.send(JSON.stringify({ id: sequence, method, params }));
      });
    },
    close() {
      socket.close();
    },
  };
}

async function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gotlandsguiden-passkey-browser-'));
  const chromeDirectory = path.join(directory, 'chrome');
  const appPort = await freePort();
  const debugPort = await freePort();
  const origin = `http://localhost:${appPort}`;
  const app = createApp({
    NODE_ENV: 'test',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'browser-test-password',
    SESSION_SECRET: 'browser-test-session-secret-with-thirty-two-characters',
    SIGNUP_CODE: 'browser-enrollment-code',
    PASSKEY_RP_ID: 'localhost',
    PASSKEY_ORIGIN: origin,
    DATABASE_PATH: path.join(directory, 'places.db'),
    HOST: '127.0.0.1',
    PORT: String(appPort),
  });
  await new Promise((resolve, reject) => {
    app.server.once('error', reject);
    app.server.listen(appPort, '127.0.0.1', resolve);
  });

  const chrome = spawn(process.env.CHROME_PATH || '/usr/bin/google-chrome-stable', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${chromeDirectory}`,
    `${origin}/signup`,
  ], { stdio: 'ignore' });
  let cdp;
  try {
    const target = await eventually(async () => {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const targets = await response.json();
      return targets.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
    });
    cdp = await connectCdp(target.webSocketDebuggerUrl);
    await cdp.call('Runtime.enable');
    await cdp.call('Page.enable');
    await cdp.call('WebAuthn.enable');
    await cdp.call('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        ctap2Version: 'ctap2_1',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });

    await eventually(async () => {
      const result = await cdp.call('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector("[data-passkey-signup]"))',
        returnByValue: true,
      });
      return result.result.value;
    });
    await cdp.call('Runtime.evaluate', {
      expression: `(() => {
        const form = document.querySelector('[data-passkey-signup]');
        form.elements.displayName.value = 'Browser Test';
        form.elements.username.value = 'browser-user';
        form.elements.signupCode.value = 'browser-enrollment-code';
        form.requestSubmit();
      })()`,
    });
    await eventually(async () => {
      const result = await cdp.call('Runtime.evaluate', {
        expression: `JSON.stringify({
          path: location.pathname,
          status: document.querySelector('[data-passkey-status]')?.textContent || '',
          error: document.querySelector('[data-passkey-status]')?.classList.contains('error') || false
        })`,
        returnByValue: true,
      });
      const state = JSON.parse(result.result.value);
      if (state.error) throw new Error(state.status);
      return state.path === '/admin';
    });

    const user = app.store.getCmsUserByUsername('browser-user');
    assert.ok(user);
    assert.equal(app.store.listPasskeysForUser(user.id).length, 1);

    await cdp.call('Runtime.evaluate', {
      expression: "fetch('/admin/logout', { method: 'POST' }).then(() => true)",
      awaitPromise: true,
      returnByValue: true,
    });
    await cdp.call('Page.navigate', { url: `${origin}/admin/login` });
    await eventually(async () => {
      const result = await cdp.call('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector("[data-passkey-login]"))',
        returnByValue: true,
      });
      return result.result.value;
    });
    await cdp.call('Runtime.evaluate', {
      expression: `(() => {
        const form = document.querySelector('[data-passkey-login]');
        form.elements.passkeyUsername.value = 'browser-user';
        form.requestSubmit();
      })()`,
    });
    await eventually(async () => {
      const result = await cdp.call('Runtime.evaluate', {
        expression: `JSON.stringify({
          path: location.pathname,
          status: document.querySelector('[data-passkey-status]')?.textContent || '',
          error: document.querySelector('[data-passkey-status]')?.classList.contains('error') || false
        })`,
        returnByValue: true,
      });
      const state = JSON.parse(result.result.value);
      if (state.error) throw new Error(state.status);
      return state.path === '/admin';
    });

    assert.ok(app.store.getCmsUserById(user.id).last_login_at);
    console.log('Passkey browser flow passed: signup, registration, logout, and authentication');
  } finally {
    cdp?.close();
    const chromeExited = new Promise((resolve) => chrome.once('exit', resolve));
    chrome.kill('SIGTERM');
    await Promise.race([
      chromeExited,
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ]);
    await new Promise((resolve) => app.server.close(resolve));
    app.store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
