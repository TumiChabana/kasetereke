/* SAMPLE DATA so the screens work today.
   Later this file is replaced by rows from the database (Neon) and the group's own dataset (Part D).
   Prices, ratings and match % below are placeholders, and the district of each place must be checked
   before the demo. */
window.KS = {
  districts: [
    { id: 'maseru',       name: 'Maseru' },
    { id: 'mafeteng',     name: 'Mafeteng' },
    { id: 'quthing',      name: 'Quthing' },
    { id: 'mohales-hoek', name: "Mohale's Hoek" },
    { id: 'thaba-tseka',  name: 'Thaba-Tseka' },
    { id: 'mokhotlong',   name: 'Mokhotlong' },
    { id: 'leribe',       name: 'Leribe' },
    { id: 'butha-buthe',  name: 'Butha-Buthe' },
    { id: 'qachas-nek',   name: "Qacha's Nek" },
    { id: 'berea',        name: 'Berea' }
  ],
  // type: 'stay' or 'heritage'. price is per night in maloti (null for heritage sites).
  places: [
    { id: 'avani-lesotho',       districtId: 'maseru',      type: 'stay',     name: 'Avani Lesotho',          tagline: 'Central Maseru',          price: 1200, rating: 4.6, match: 96, tags: ['Pool', 'Casino'] },
    { id: 'semonkong-lodge',     districtId: 'maseru',      type: 'stay',     name: 'Semonkong Lodge',        tagline: 'Semonkong',               price: 950,  rating: 4.5, match: 88, tags: ['Parking'] },
    { id: 'thaba-bosiu',         districtId: 'maseru',      type: 'heritage', name: 'Thaba-Bosiu',            tagline: 'Mountain fortress',       price: null, rating: 4.8, match: 94, tags: ['Heritage'] },
    { id: 'maletsunyane-falls',  districtId: 'maseru',      type: 'heritage', name: 'Maletsunyane Falls',     tagline: '192 metre waterfall',     price: null, rating: 4.8, match: 96, tags: ['Nature'] },
    { id: 'malealea-lodge',      districtId: 'mafeteng',    type: 'stay',     name: 'Malealea Lodge',         tagline: 'Malealea',                price: 660,  rating: 4.4, match: 81, tags: ['Free WiFi', 'Parking'] },
    { id: 'maliba-lodge',        districtId: 'leribe',      type: 'stay',     name: 'Maliba Mountain Lodge',  tagline: 'Mountain lodge',          price: 1500, rating: 4.9, match: 90, tags: ['Free WiFi', 'Pool'] },
    { id: 'tsehlanyane-park',    districtId: 'leribe',      type: 'heritage', name: 'Tsehlanyane National Park', tagline: 'Triple waterfall',     price: null, rating: 4.7, match: 85, tags: ['Nature'] },
    { id: 'motherland-guest',    districtId: 'thaba-tseka', type: 'stay',     name: 'Motherland Guest House', tagline: 'Thaba-Tseka town',        price: 600,  rating: 4.6, match: 79, tags: ['Free WiFi'] },
    { id: 'katse-dam',           districtId: 'thaba-tseka', type: 'heritage', name: 'Katse Dam',              tagline: 'Dam and viewpoints',      price: null, rating: 4.8, match: 87, tags: ['Great view'] },
    { id: 'sani-pass',           districtId: 'mokhotlong',  type: 'heritage', name: 'Sani Pass',              tagline: 'Mountain pass',           price: null, rating: 4.9, match: 92, tags: ['Bucket list'] },
    { id: 'ha-kome-caves',       districtId: 'berea',       type: 'heritage', name: 'Ha Kome Caves',          tagline: 'Cave dwellings',          price: null, rating: 4.5, match: 83, tags: ['Heritage'] }
    ]
};

// Give every place a photo path. The real photos are added later in apps/web/img/.
// Until a photo exists, the app shows the coloured letter box instead.
window.KS.places.forEach(function (p) {
  p.image = 'img/' + p.id + '.jpg';
});

