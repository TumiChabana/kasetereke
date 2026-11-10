/* apps/web/js/match.js - Match % badge for the traveller app.
 * Mirrors ml/02_recommender.py: a place is a vector of features, the traveller is a taste vector in the
 * same space, Match % = round((cosine similarity + 1) / 2 * 100).
 *
 * Usage:  KaMatch.score({ budget: "Mid", withChildren: true, accepts4x4: false }, place)   // place = row of places.json
 * Returns an integer 0-100.
 *
 * Place features (same as Python): family_friendly (1/0), needs_4x4 (1 only when true; null counts as 0 like
 * "unknown" in Python), one column for type, ONE column for the price band (low / mid / high / other),
 * and one column for district. The "other" price column is what Python calls price_n/a and price_unknown;
 * both are null in places.json. It matters because it still counts in the length of the place vector.
 *
 * Traveller taste vector (the app user has no ratings, so it is built from the three profile answers):
 *   family_friendly +1 if withChildren, else 0
 *   needs_4x4       -1 if NOT accepts4x4, else 0   (avoid 4x4 places only when the traveller would not go)
 *   price band      Low: low +1, high -1 | Mid: mid +1 | High: high +1, low -1   (everything else 0)
 * type and district are 0, so they only affect the length of the place vector.
 */
(function (root) {
  "use strict";

  function roundHalfEven(x) {            // Python's round() / numpy.round: .5 rounds to the even integer
    var f = Math.floor(x), d = x - f;
    if (d < 0.5) return f;
    if (d > 0.5) return f + 1;
    return f % 2 === 0 ? f : f + 1;
  }

  function placeVector(place) {
    var band = place.price_band;
    return {
      family_friendly: place.family_friendly === true ? 1 : 0,
      needs_4x4: place.needs_4x4 === true ? 1 : 0,        // null / false / undefined -> 0, never throws
      price_low: band === "low" ? 1 : 0,
      price_mid: band === "mid" ? 1 : 0,
      price_high: band === "high" ? 1 : 0,
      price_other: (band === "low" || band === "mid" || band === "high") ? 0 : 1,
      type: 1,                                              // exactly one type column is 1
      district: 1                                           // exactly one district column is 1
    };
  }

  function profileVector(profile) {
    var b = String((profile && profile.budget) || "").toLowerCase();
    return {
      family_friendly: profile && profile.withChildren ? 1 : 0,
      needs_4x4: profile && profile.accepts4x4 ? 0 : -1,
      price_low: b === "low" ? 1 : (b === "high" ? -1 : 0),
      price_mid: b === "mid" ? 1 : 0,
      price_high: b === "high" ? 1 : (b === "low" ? -1 : 0),
      price_other: 0,
      type: 0,
      district: 0
    };
  }

  function score(profile, place) {
    var p = profileVector(profile), q = placeVector(place || {});
    var dot = 0, np = 0, nq = 0, k;
    for (k in q) { dot += p[k] * q[k]; np += p[k] * p[k]; nq += q[k] * q[k]; }
    var sim = (np === 0 || nq === 0) ? 0 : dot / (Math.sqrt(np) * Math.sqrt(nq));
    return roundHalfEven((sim + 1) / 2 * 100);
  }

  var KaMatch = { score: score };
  root.KaMatch = KaMatch;
  if (typeof module !== "undefined" && module.exports) module.exports = KaMatch;
})(typeof window !== "undefined" ? window : globalThis);