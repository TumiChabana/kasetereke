// KaSetereke sign-in helper. It talks to Neon Auth over the web.
// The signed-in user and the token are kept in memory only: nothing is saved to disk or to the repo.
(function () {
  'use strict';

  // Public address of the sign-in service (not a secret).
  const AUTH = 'https://ep-raspy-frost-b5a46sw0.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth';

  let user = null;      // who is signed in
  let token = null;     // JWT for the database (lasts about 15 minutes)
  let tokenTime = 0;    // when we got it

  async function post(path, body) {
    const res = await fetch(AUTH + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body || {})
    });
    return res;
  }

  // Ask "who am I?". The token comes back in a reply header.
  async function refresh() {
    try {
      const res = await fetch(AUTH + '/get-session', { credentials: 'include' });
      let data = null;
      try { data = await res.json(); } catch (e) { /* empty reply means nobody is signed in */ }
      if (res.ok && data && data.user) {
        user = { id: data.user.id, name: data.user.name, email: data.user.email };
        token = res.headers.get('set-auth-jwt');
        tokenTime = Date.now();
      } else {
        user = null;
        token = null;
      }
    } catch (e) {
      user = null;
      token = null;
    }
    return user;
  }

  // Turn a server reply into a short, friendly message. It reads the reply body first.
  async function friendly(res) {
    let body = null;
    try { body = await res.clone().json(); } catch (e) { /* no body in the reply */ }
    const text = body ? String((body.code || '') + ' ' + (body.message || '')) : '';
    if (res.status === 403 && /verif/i.test(text)) return 'Please verify your email first. Open the Verify your email screen and type the code we emailed you.';
    if (res.status === 401) return 'Wrong email or password.';
    if (res.status === 400) return 'Check your email and password and try again.';
    if (res.status === 429) return 'Too many tries. Wait a moment and try again.';
    if (body && body.message) return String(body.message);
    return 'Something went wrong. Please try again.';
  }

  async function signIn(email, password) {
    try {
      const res = await post('/sign-in/email', { email: email, password: password });
      if (!res.ok) return { ok: false, message: await friendly(res) };
      await refresh();
      return user ? { ok: true } : { ok: false, message: 'Could not start your session. Please try again.' };
    } catch (e) {
      return { ok: false, message: 'Could not reach the sign-in service. Check your internet.' };
    }
  }

  async function signUp(name, email, password) {
    try {
      const res = await post('/sign-up/email', { name: name, email: email, password: password });
      if (!res.ok) {
        return { ok: false, message: res.status === 422 ? 'That email may already be registered, or the password is too weak.' : await friendly(res) };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, message: 'Could not reach the sign-in service. Check your internet.' };
    }
  }

  async function signOut() {
    try { await post('/sign-out'); } catch (e) { /* signing out locally anyway */ }
    user = null;
    token = null;
  }

  // The token expires after about 15 minutes, so fetch a fresh one when it is old.
  async function getToken() {
    if (!user) return null;
    if (!token || Date.now() - tokenTime > 10 * 60 * 1000) await refresh();
    return token;
  }

  // Check the 6-digit code that was emailed. Reports the server's status and message so the team can see what it says.
  async function verifyEmail(email, otp) {
    try {
      const res = await post('/email-otp/verify-email', { email: email, otp: otp });
      if (res.ok) return { ok: true };
      let msg = 'That code did not work. Check it and try again.';
      try { const d = await res.json(); if (d && d.message) msg = d.message; } catch (e) { /* no message in the reply */ }
      return { ok: false, status: res.status, message: msg };
    } catch (e) {
      return { ok: false, message: 'Could not reach the sign-in service. Check your internet.' };
    }
  }

  window.KaAuth = { signIn: signIn, signUp: signUp, signOut: signOut, restore: refresh, getToken: getToken, verifyEmail: verifyEmail, getUser: function () { return user; } };
})();