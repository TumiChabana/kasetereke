/* The app's place data. The real 35 places (ids match Neon) are defined in places-real.js,
   which index.html loads just before this file. This file only hands them to the app as window.KS.
   Do not put sample places here any more: numeric Neon ids are needed so bookings save correctly. */
(function () {
  'use strict';
  if (!window.KS_REAL || !window.KS_REAL.places || !window.KS_REAL.places.length) {
    console.error('places-real.js did not load, so there is no place data.');
    window.KS = { districts: [], places: [] };
    return;
  }
  window.KS = window.KS_REAL;
  // Safety net: every place needs a photo path. The app shows a coloured letter box if the photo is missing.
  window.KS.places.forEach(function (p) {
    if (!p.image) p.image = 'img/' + (p.image_file || (p.id + '.jpg'));
  });
})();