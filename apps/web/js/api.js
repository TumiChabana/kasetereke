// KaSetereke traveller app: Data API helper (profile, bookings, reviews, delete account).
// Needs auth.js loaded first (window.KaAuth). Tokens stay in memory inside KaAuth, nothing is stored here.
(function () {
  'use strict';

  // Public address of the Data API (not a secret).
  const API = 'https://ep-raspy-frost-b5a46sw0.apirest.c-7.us-east-2.aws.neon.tech/neondb/rest/v1';

  let profile = null; // { id, role, display_name } of the signed-in person, cached in memory only

  // Turn a failed reply into a short message for the screen. The raw text is kept on err.detail for the team.
  function failure(status, body) {
    const code = body && body.code;
    const detail = (body && (body.message || body.hint)) || '';
    let msg = 'Something went wrong. Please try again.';
    if (status === 401) msg = 'Your session ended. Please log in again.';
    else if (status === 403 || code === '42501') msg = 'You are not allowed to do that.';
    else if (code === '23514') msg = 'Check the dates, guests and total and try again.';
    else if (code === '23505') msg = 'That already exists.';
    else if (code === '23503') msg = 'That place or account could not be found.';
    else if (status === 404) msg = 'Not found.';
    const err = new Error(msg);
    err.status = status;
    err.code = code;
    err.detail = detail;
    return err;
  }

  // One call to the Data API. Sends the Bearer token; retries once with a fresh token on 401.
  async function call(method, path, body, prefer, retried) {
    const token = window.KaAuth ? await window.KaAuth.getToken() : null;
    if (!token) throw failure(401, null);
    const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
    if (prefer) headers['Prefer'] = prefer;
    let res;
    try {
      res = await fetch(API + path, { method: method, headers: headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (e) {
      const err = new Error('Could not reach the server. Check your internet.');
      err.status = 0;
      throw err;
    }
    if (res.status === 401 && !retried) {
      await window.KaAuth.restore();
      return call(method, path, body, prefer, true);
    }
    let data = null;
    if (res.status !== 204) { try { data = await res.json(); } catch (e) { data = null; } }
    if (!res.ok) throw failure(res.status, data);
    return data;
  }

  // Find this login's profile, or create it on the first sign-in. Never sends a role or email.
  async function ensureProfile() {
    const u = window.KaAuth && window.KaAuth.getUser();
    if (!u) throw failure(401, null);
    if (profile && profile.auth_user_id === u.id) return profile;
    const found = await call('GET', '/profiles?auth_user_id=eq.' + encodeURIComponent(u.id) + '&select=id,auth_user_id,role,display_name');
    if (found && found.length) { profile = found[0]; return profile; }
    const made = await call('POST', '/profiles', { auth_user_id: u.id, display_name: u.name || 'Traveller' }, 'return=representation');
    profile = made[0];
    return profile;
  }

  // b = { placeId (integer 1 to 35), checkIn, checkOut (YYYY-MM-DD), guests, total }. Status is not sent: the database sets pending.
  async function createBooking(b) {
    const p = await ensureProfile();
    const rows = await call('POST', '/bookings', {
      profile_id: p.id,
      place_id: Number(b.placeId),
      check_in: b.checkIn,
      check_out: b.checkOut,
      guests: Number(b.guests),
      total_amount: Number(b.total).toFixed(2),
      payment_ref: b.paymentRef || null
    }, 'return=representation');
    return rows[0];
  }

  // The database returns only this person's own bookings.
  function listMyBookings() {
    return call('GET', '/bookings?select=*&order=created_at.desc');
  }

  function listReviews(placeId) {
    return call('GET', '/reviews?place_id=eq.' + Number(placeId) +
      '&select=id,place_id,reviewer_pseudonym,rating,comment,comment_hash,chain_tx_hash,created_at&order=created_at.desc');
  }

  // Allowed only after a confirmed or completed booking at that place. pseudonym must not be a real name.
  async function createReview(r) {
    const p = await ensureProfile();
    const rows = await call('POST', '/reviews', {
      profile_id: p.id,
      place_id: Number(r.placeId),
      reviewer_pseudonym: r.pseudonym,
      rating: Number(r.rating),
      comment: r.comment || null
    }, 'return=representation');
    return rows[0];
  }

  function deleteMyReview(id) {
    return call('DELETE', '/reviews?id=eq.' + encodeURIComponent(id));
  }

  // Permanent. The database anonymises the profile and removes the login. 204 means success.
  async function deleteMyAccount() {
    await call('POST', '/rpc/delete_my_account', {});
    profile = null;
    if (window.KaAuth) await window.KaAuth.signOut();
  }

  function clear() { profile = null; }

  window.KaApi = {
    ensureProfile: ensureProfile,
    createBooking: createBooking,
    listMyBookings: listMyBookings,
    listReviews: listReviews,
    createReview: createReview,
    deleteMyReview: deleteMyReview,
    deleteMyAccount: deleteMyAccount,
    clear: clear
  };
})();
