// More Face Couture Google pages: looks, occasion makeup, skin tones, lipstick and hair color try-on, extra features.
// Called from tools/seo.cjs. Returns the keyword map (search phrase -> page) for the spreadsheet.
module.exports = function more({ SITE, YEAR, src, esc, slug, page, faqLd, faqHtml, cta, write, platforms }) {
  const KW = [];
  const kw = (url, intent, list, pri = 1) => list.forEach(k => KW.push([k, intent, url, pri]));
  const grid = items => `<ul class="grid">${items.map(([u, b, s]) => `<li><a href="${u}"><b>${esc(b)}</b><span>${esc(s)}</span></a></li>`).join('')}</ul>`;

  // ---------- Looks (straight from the Couture Looks lists in index.html) ----------
  const grab = name => { const m = src.match(new RegExp('var ' + name + '=\\[([\\s\\S]*?)\\];')); return [...m[1].matchAll(/k:'([^']+)',n:'([^']+)',t:'([^']+)'/g)].map(x => ({ k: x[1], n: x[2], t: x[3] })); };
  const LOOKS = grab('LOOKS'), MEN = grab('MENLOOKS');
  // Nov 5, 2026: looks have their own Face Couture names; each page keeps its old address and mentions the classic name for search
  const AKA = { 'Grand Soirée': 'Full Glam', 'Première': 'Red Carpet', 'Bare Luxe': 'Clean Girl', 'Ivory Vow': 'Bridal Glow', 'Gilded Hour': 'Golden Hour', 'Cover Edit': 'Magazine Cover', 'Boardroom Portrait': 'Headshot Pro', 'Silver Screen': 'Hollywood Glam', 'Porcelain Dew': 'Glass Skin' };
  const aka = l => AKA[l.n] ? ` (${AKA[l.n].toLowerCase()})` : '';
  const LOOK_INFO = {
    soft: ['Soft smoky eyes in rose and mauve, defined lashes, sculpted cheeks and a glossy pink lip. Polished but never heavy.', ['date night', 'birthday dinners', 'weddings as a guest', 'everyday glam'], ['satin glam makeup', 'soft glam makeup look', 'soft glam makeup', 'rosy smoky eye makeup', 'glossy pink lip look']],
    max: ['A deep smoky eye, full lashes, strong sculpting and a rich rose-berry lip. The look for big nights and big photos.', ['galas', 'parties', 'photoshoots', 'New Year’s Eve'], ['full glam makeup', 'full glam makeup look', 'glam makeup try on', 'smoky eye makeup look', 'dramatic makeup look']],
    glam: ['Old Hollywood glamour: gold shimmer on the lids, a sleek winged liner and a classic red lip.', ['black tie', 'holiday parties', 'red carpet events', 'anniversaries'], ['red carpet makeup', 'old hollywood makeup', 'red lip and winged liner look', 'gold eye makeup look', 'classic red lipstick look']],
    clean: ['Fresh, dewy skin, brushed brows, soft flush and a peach-pink gloss. The "no makeup" makeup look.', ['everyday', 'brunch', 'vacation photos', 'school and work'], ['clean girl makeup', 'clean girl makeup look', 'no makeup makeup look', 'dewy makeup look', 'natural makeup look']],
    bridal: ['A bronzed, luminous glow with a soft smoky eye and a glossy rose lip, made to look beautiful in person and in photos.', ['weddings', 'engagement photos', 'bridal showers', 'vow renewals'], ['bridal makeup look', 'bridal glow makeup', 'wedding makeup look', 'soft bridal makeup', 'natural bridal makeup']],
    golden: ['Warm bronze and copper eyes, sun-kissed cheeks and a warm nude lip, like the light just before sunset.', ['summer events', 'beach and vacation', 'outdoor photos', 'warm skin tones'], ['golden hour makeup', 'bronze makeup look', 'sun kissed makeup', 'copper eye makeup', 'summer makeup look']],
    datenight: ['Mauve smoky eyes and a berry lip: romantic, a little moody and made for candlelight.', ['date night', 'dinners out', 'evening parties', 'fall and winter'], ['date night makeup', 'berry lip makeup look', 'mauve smoky eye', 'evening makeup look', 'romantic makeup look']],
    executive: ['Even skin, soft definition and a polished neutral lip. Camera-ready for headshots, interviews and your LinkedIn photo.', ['headshots', 'job interviews', 'LinkedIn photos', 'presentations'], ['professional makeup look', 'headshot makeup', 'makeup for linkedin photo', 'interview makeup', 'office makeup look']],
    mgroomed: ['Clearer skin, neat brows and a crisp beard line, with no makeup.', ['profile pictures', 'dating apps', 'everyday photos'], ['groomed look photo editor', 'men skin retouch', 'beard touch up photo']],
    mheadshot: ['A matte, crisp, confident finish for professional photos.', ['LinkedIn', 'company headshots', 'speaker bios'], ['men headshot retouch', 'professional headshot men', 'linkedin photo men']],
    mcover: ['Editorial polish and a defined jawline, like a magazine cover.', ['social posts', 'portfolios', 'events'], ['magazine cover photo edit men', 'editorial photo retouch men']],
    mwedding: ['Rested, immaculate and camera-ready for the big day.', ['grooms', 'groomsmen', 'wedding guests'], ['groom photo retouch', 'wedding photo retouch men']],
    mbronzed: ['A healthy, warm, natural tan.', ['summer photos', 'vacation', 'dating apps'], ['tan photo editor', 'bronzed skin photo filter men']],
    mrested: ['Brighter, fresher under-eyes, like a full night’s sleep.', ['early meetings', 'travel photos', 'everyday'], ['remove dark circles photo', 'tired eyes photo fix']]
  };
  const lookUrl = l => '/looks/' + slug(AKA[l.n] || l.n) + '/';
  const lookList = (keys, all = LOOKS.concat(MEN)) => grid(keys.map(k => all.find(l => l.k === k)).filter(Boolean).map(l => [lookUrl(l), l.n, l.t]));
  for (const l of LOOKS.concat(MEN)) {
    const men = MEN.includes(l), [about, best, kws] = LOOK_INFO[l.k] || [l.t, [], []];
    const title = men ? `${l.n}${aka(l)} Photo Look for Men: ${l.t} | Face Couture` : `${l.n}${aka(l)} Makeup Look: ${l.t} | Try It On Your Photo`;
    const desc = men ? `${l.n}: ${l.t.toLowerCase()}. A natural men’s photo finish with no makeup. Try it on your own photo.` : `See the ${l.n} makeup look (${l.t.toLowerCase()}) on your own selfie. Your eyes, lips and face shape stay yours.`;
    const faqs = men ? [[`Does ${l.n} add makeup?`, 'No. Men’s looks never add makeup, only subtle retouching, light and grooming.']] :
      [[`What is ${l.n} makeup?`, `${l.n} is ${about.charAt(0).toLowerCase() + about.slice(1)}`], [`Can I try the ${l.n} look on my photo?`, `Yes. Upload a selfie to Face Couture and choose ${l.n} in Looks or Couture Looks. Your eyes, lips and face shape stay yours.`]];
    const others = (men ? MEN : LOOKS).filter(x => x !== l).map(x => x.k);
    const body = `<p class="lead">${esc(about)}</p><h2>Best for</h2><ul>${best.map(b => `<li>${esc(b.charAt(0).toUpperCase() + b.slice(1))}</li>`).join('')}</ul>
<h2>How to try it</h2><ol><li>Open Face Couture and add a clear, front-facing photo.</li><li>Choose <b>${esc(l.n)}</b> in ${men ? 'the men’s looks' : 'Looks (instant, on your phone) or Couture Looks'}.</li><li>Compare before and after, adjust the strength and save.</li></ol>
${cta(`See ${l.n} on your own photo`)}${faqHtml(faqs)}<h2>More looks</h2>${lookList(others)}`;
    write(lookUrl(l), page({ url: lookUrl(l), title, desc, h1: men ? `${l.n}: a men’s photo look` : `${l.n}${aka(l)} makeup look`, body, crumb: [{ name: 'Looks', url: SITE + '/looks/' }, { name: l.n, url: SITE + lookUrl(l) }], ld: [faqLd(faqs)] }), '0.7');
    kw(lookUrl(l), men ? 'Men’s photo look' : 'A specific makeup look', kws.concat(men ? [] : [l.n.toLowerCase() + ' makeup try on']), men ? 2 : 1);
  }
  {
    const body = `<p class="lead">Every Face Couture look, ready to try on your own photo.</p><h2>Makeup looks</h2>${lookList(LOOKS.map(l => l.k))}<h2>Men’s looks (no makeup)</h2>${lookList(MEN.map(l => l.k))}` + cta('Find your look', 'Take the quiz or try them all');
    const faqs = [['Which makeup look suits me?', 'Take Face Couture’s 30-second quiz, or try each look on your photo and compare.']];
    write('/looks/', page({ url: '/looks/', title: 'Makeup Looks to Try On Your Photo: Glam, Natural, Bridal & More | Face Couture', desc: 'Try Satin Glam, Grand Soirée (full glam), Première (red carpet), Bare Luxe (clean girl), Ivory Vow (bridal glow), Gilded Hour (golden hour), Date Night and Executive makeup looks on your own selfie, free.', h1: 'Makeup looks to try on your photo', body: body + faqHtml(faqs), crumb: [{ name: 'Looks', url: SITE + '/looks/' }], ld: [faqLd(faqs)] }), '0.8');
    kw('/looks/', 'Browse makeup looks', ['makeup looks', 'makeup look ideas', 'makeup looks to try', 'which makeup look suits me', 'makeup quiz', 'what makeup look is right for me', 'makeup styles'], 1);
  }

  // ---------- Occasion makeup ideas ----------
  const OCC = [
    ['Wedding guest', ['soft', 'golden', 'datenight'], ['Match your lip to your outfit, not the bride.', 'Pick long-wear and waterproof mascara for the ceremony.', 'Skip heavy shimmer and SPF that can flash white in photos.'], 'https://eventcouture.app/wedding-planner/', ['wedding guest makeup', 'wedding guest makeup ideas', 'makeup for a wedding guest', 'summer wedding guest makeup', 'evening wedding guest makeup']],
    ['Bridal', ['bridal', 'soft', 'clean'], ['Do a trial and photograph it in daylight and with flash.', 'Choose a lip you can reapply easily.', 'Try the look with your veil and hair style in mind.'], 'https://eventcouture.app/wedding-planner/', ['bridal makeup ideas', 'wedding day makeup', 'bride makeup look', 'natural wedding makeup', 'glam bridal makeup']],
    ['Prom', ['max', 'glam', 'soft'], ['Choose eye or lip as the star and keep the other softer.', 'Lashes photograph beautifully; keep them on the lash line.', 'Set your makeup for a long night of dancing.'], null, ['prom makeup', 'prom makeup ideas', 'prom makeup looks', 'glam prom makeup', 'natural prom makeup']],
    ['Homecoming', ['soft', 'clean', 'glam'], ['Fresh and glowy works for early events.', 'A pop of shimmer on the lids catches stadium and party lights.'], null, ['homecoming makeup', 'homecoming makeup ideas', 'hoco makeup']],
    ['Quinceañera', ['max', 'soft', 'bridal'], ['Coordinate eye shadow with the dress color.', 'Use a glow that stays fresh from the mass to the last dance.', 'Plan the look before your hair appointment.'], 'https://eventcouture.app/', ['quinceanera makeup', 'quince makeup ideas', 'quinceanera makeup looks', 'sweet 15 makeup']],
    ['Sweet 16', ['soft', 'clean', 'golden'], ['Keep skin fresh and glowy.', 'A glossy lip reads young and pretty in photos.'], 'https://eventcouture.app/birthday-party-planner/', ['sweet 16 makeup', 'sweet sixteen makeup ideas']],
    ['Birthday', ['soft', 'max', 'glam'], ['It’s your day: go one step more glam than usual.', 'Shimmer and gloss photograph well at night.'], 'https://eventcouture.app/birthday-party-planner/', ['birthday makeup', 'birthday makeup ideas', 'birthday makeup look', 'birthday glam makeup']],
    ['Graduation', ['clean', 'soft', 'executive'], ['Go natural so you look like you in photos for years.', 'Set your makeup for heat under the gown.'], 'https://eventcouture.app/', ['graduation makeup', 'graduation makeup ideas', 'makeup for graduation pictures', 'grad photo makeup']],
    ['Date night', ['datenight', 'soft', 'glam'], ['A berry or red lip feels instantly special.', 'Soft smoke on the eyes looks great by candlelight.'], null, ['date night makeup', 'first date makeup', 'dinner date makeup', 'romantic makeup ideas']],
    ['Photoshoot', ['max', 'soft', 'golden'], ['Go a little stronger than in person; cameras soften makeup.', 'Matte skin with highlight only on the high points.', 'Avoid heavy SPF under flash.'], null, ['photoshoot makeup', 'makeup for photos', 'makeup for pictures', 'camera ready makeup', 'makeup for photography']],
    ['Headshot', ['executive', 'clean', 'soft'], ['Even skin and defined brows matter most.', 'Pick a neutral lip that looks like you.', 'Use LinkedIn’s 800 × 800 profile size.'], null, ['headshot makeup', 'makeup for headshots', 'linkedin photo makeup', 'professional photo makeup']],
    ['Job interview', ['executive', 'clean'], ['Polished and natural builds trust.', 'Keep shimmer for after hours.'], null, ['interview makeup', 'job interview makeup', 'professional makeup for interview']],
    ['Holiday party', ['glam', 'max', 'datenight'], ['A red lip or gold shimmer is made for the season.', 'Glitter on the lids catches party lights.'], 'https://eventcouture.app/', ['holiday party makeup', 'christmas party makeup', 'christmas makeup look', 'holiday makeup ideas']],
    ['New Year’s Eve', ['max', 'glam'], ['Go bold: smoky eyes or a statement lip.', 'Set everything to last until midnight and beyond.'], null, ['new years eve makeup', 'nye makeup', 'new years makeup look']],
    ['Gala and black tie', ['glam', 'max'], ['Classic and elegant: winged liner and a red lip never miss.', 'Sculpt the face for formal photography.'], 'https://eventcouture.app/', ['gala makeup', 'black tie makeup', 'formal event makeup', 'evening gown makeup']],
    ['Bachelorette', ['max', 'soft', 'golden'], ['Fun and glam with long-wear products for a long night.'], 'https://eventcouture.app/', ['bachelorette makeup', 'bachelorette party makeup ideas']],
    ['Bridal shower', ['clean', 'soft', 'bridal'], ['Fresh, pretty and daytime-friendly.'], 'https://eventcouture.app/', ['bridal shower makeup', 'bridal shower makeup ideas']],
    ['Baby shower', ['clean', 'golden', 'soft'], ['Glowy skin and a soft gloss for daytime photos.'], 'https://eventcouture.app/', ['baby shower makeup', 'maternity photoshoot makeup']],
    ['Engagement photos', ['bridal', 'soft', 'golden'], ['Glowing skin and soft definition read beautifully outdoors.', 'Match the warmth of your makeup to golden-hour light.'], 'https://eventcouture.app/', ['engagement photo makeup', 'engagement shoot makeup', 'makeup for engagement pictures']],
    ['Everyday', ['clean', 'soft'], ['Five minutes: skin, brows, mascara, tinted gloss.'], null, ['everyday makeup look', 'natural everyday makeup', 'simple makeup look', 'easy makeup look']]
  ];
  const occUrl = o => '/makeup-ideas/' + slug(o[0].replace('ñ', 'n')) + '/';
  for (const o of OCC) {
    const [name, looks, tips, ec, kws] = o, lc = name.toLowerCase();
    const faqs = [[`What makeup is best for ${/^[aeiou]/.test(lc) ? 'an' : 'a'} ${lc}?`, `Popular choices are ${looks.map(k => LOOKS.find(l => l.k === k).n).join(', ')}. Try each one on your own photo in Face Couture and compare.`], [`How do I see ${lc} makeup on myself before the day?`, 'Upload a selfie to Face Couture, pick a look, adjust lip color, lashes and strength, and save your favorite to show your makeup artist.']];
    const body = `<p class="lead">Not sure what to wear on your face? Try these ${lc} makeup looks on your own photo before the big day.</p><h2>Looks to try</h2>${lookList(looks)}<h2>Tips</h2><ul>${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>${ec ? `<p>Planning the event too? <a href="${ec}">Event Couture</a> plans it from one inspiration photo.</p>` : ''}${cta(`Try ${lc} makeup on your photo`)}${faqHtml(faqs)}`;
    write(occUrl(o), page({ url: occUrl(o), title: `${name} Makeup Ideas (${YEAR}): Looks to Try On Your Photo | Face Couture`, desc: `${name} makeup ideas you can try on your own selfie first: ${looks.map(k => LOOKS.find(l => l.k === k).n).join(', ')}, plus tips. Free.`, h1: `${name} makeup ideas`, body, crumb: [{ name: 'Makeup ideas', url: SITE + '/makeup-ideas/' }, { name, url: SITE + occUrl(o) }], ld: [faqLd(faqs)] }), '0.7');
    kw(occUrl(o), `Makeup for ${lc}`, kws, 1);
  }
  write('/makeup-ideas/', page({ url: '/makeup-ideas/', title: `Makeup Ideas for Every Occasion (${YEAR}) | Face Couture`, desc: 'Makeup ideas for weddings, prom, quinceañeras, birthdays, date night, photoshoots, headshots and more. Try each look on your own photo.', h1: 'Makeup ideas for every occasion', body: `<p class="lead">Pick your occasion and try the looks on your own photo.</p>${grid(OCC.map(o => [occUrl(o), o[0], o[1].length + ' looks to try']))}${cta('Try a look on your photo')}`, crumb: [{ name: 'Makeup ideas', url: SITE + '/makeup-ideas/' }] }), '0.8');
  kw('/makeup-ideas/', 'Makeup ideas by occasion', ['makeup ideas', 'makeup ideas for events', 'party makeup ideas', 'event makeup', 'occasion makeup'], 1);

  // ---------- Makeup by skin tone ----------
  const TONES = [
    ['Fair', 'Porcelain or Fair neutral', ['soft pink', 'rose', 'cool berry', 'blue-red'], ['soft pink', 'peach'], ['champagne', 'taupe', 'rose gold', 'soft plum']],
    ['Light', 'Light beige', ['rose nude', 'mauve', 'coral', 'classic red'], ['peach', 'rose'], ['soft gold', 'bronze', 'rose gold']],
    ['Medium', 'Medium honey', ['rosewood', 'berry', 'caramel nude', 'brick red'], ['apricot', 'coral'], ['bronze', 'copper', 'plum']],
    ['Olive', 'Medium honey or Tan caramel', ['mauve', 'terracotta', 'brick', 'plum'], ['warm rose', 'terracotta'], ['gold', 'olive', 'bronze']],
    ['Tan', 'Tan caramel', ['caramel nude', 'coral', 'orange-red', 'berry'], ['deep peach', 'bronze'], ['copper', 'gold', 'emerald']],
    ['Deep', 'Deep chestnut or Rich espresso', ['chocolate nude', 'plum', 'wine', 'deep berry', 'blue-red'], ['berry', 'deep orange'], ['gold', 'bronze', 'violet']]
  ];
  const toneUrl = t => '/makeup-for-skin-tone/' + slug(t[0]) + '/';
  for (const t of TONES) {
    const [n, shade, lips, blush, eyes] = t, l = n.toLowerCase();
    const faqs = [[`What lipstick color suits ${l} skin?`, `Shades that flatter ${l} skin include ${lips.join(', ')}. Undertone matters too, so try a few on your own photo.`], [`What foundation shade should I try for ${l} skin?`, `In Face Couture, start with ${shade}, or choose "Match original tone".`]];
    const body = `<p class="lead">Colors that flatter ${l} skin, and an easy way to try them on your own photo before you buy.</p>
<h2>Lipstick</h2><p>${esc(lips.join(', '))}.</p><h2>Blush</h2><p>${esc(blush.join(', '))}.</p><h2>Eye shadow</h2><p>${esc(eyes.join(', '))}.</p>
<h2>Foundation to try</h2><p>${esc(shade)} in Face Couture’s Beauty Lab, or "Match original tone" to keep your own.</p>
<div class="card"><b>Undertone tip:</b> warm undertones glow in gold, peach and brick; cool undertones in rose, berry and silver; neutral undertones can wear both.</div>
${cta(`Try ${l}-skin shades on your photo`)}${faqHtml(faqs)}<h2>Other skin tones</h2>${grid(TONES.filter(x => x !== t).map(x => [toneUrl(x), x[0] + ' skin', x[2].slice(0, 2).join(', ')]))}`;
    write(toneUrl(t), page({ url: toneUrl(t), title: `Best Makeup for ${n} Skin: Lipstick, Blush & Eye Shadow Colors | Face Couture`, desc: `The best lipstick, blush and eye shadow colors for ${l} skin, plus a free way to try them on your own photo.`, h1: `Makeup colors for ${l} skin`, body, crumb: [{ name: 'Makeup for skin tone', url: SITE + '/makeup-for-skin-tone/' }, { name: n + ' skin', url: SITE + toneUrl(t) }], ld: [faqLd(faqs)] }), '0.6');
    kw(toneUrl(t), `Makeup colors for ${l} skin`, [`best lipstick for ${l} skin`, `makeup for ${l} skin`, `lipstick colors for ${l} skin`, `blush for ${l} skin`, `eyeshadow for ${l} skin`].concat(n === 'Deep' ? ['makeup for dark skin', 'lipstick for dark skin', 'best lipstick for black women'] : n === 'Olive' ? ['makeup for olive skin tone'] : n === 'Fair' ? ['makeup for pale skin', 'lipstick for pale skin'] : []), 2);
  }
  write('/makeup-for-skin-tone/', page({ url: '/makeup-for-skin-tone/', title: 'Makeup for Your Skin Tone: Best Lipstick & Blush Colors | Face Couture', desc: 'Find the most flattering lipstick, blush and eye shadow colors for fair, light, medium, olive, tan and deep skin, and try them on your photo.', h1: 'Makeup for your skin tone', body: `<p class="lead">Pick your skin tone for the colors that flatter it most.</p>${grid(TONES.map(t => [toneUrl(t), t[0] + ' skin', t[2].slice(0, 3).join(', ')]))}${cta('Try colors on your own photo')}`, crumb: [{ name: 'Makeup for skin tone', url: SITE + '/makeup-for-skin-tone/' }] }), '0.7');
  kw('/makeup-for-skin-tone/', 'Find flattering colors', ['makeup for my skin tone', 'what lipstick color suits me', 'lipstick shade finder', 'find my lipstick shade', 'what makeup colors suit me', 'skin undertone makeup'], 1);

  // ---------- Lipstick try-on ----------
  const LIPS = [['Red', 'A classic for every skin tone: blue-reds brighten teeth, orange-reds warm the face.'], ['Nude', 'The right nude is a shade or two deeper than your lips, never paler than your skin.'], ['Pink', 'From baby pink to hot pink, pink lifts the whole face.'], ['Berry', 'Rich and flattering on almost everyone, especially in fall and winter.'], ['Mauve', 'A soft, grown-up pink-purple that works day and night.'], ['Coral', 'Bright and warm, made for summer and tan skin.'], ['Plum', 'Deep and dramatic, gorgeous on medium to deep skin.'], ['Brown', 'From caramel to chocolate, brown lips are a modern everyday classic.'], ['Burgundy', 'A deep wine shade for evening and statement looks.']];
  const lipUrl = l => '/lipstick-try-on/' + slug(l[0]) + '/';
  for (const lp of LIPS) {
    const [n, about] = lp, l = n.toLowerCase();
    const faqs = [[`How can I see if ${l} lipstick suits me?`, `Upload a selfie to Face Couture, open Beauty Lab, choose Lip color and pick a ${l} shade. Switch between cream, matte, shimmer and glitter finishes, and add gloss.`]];
    const body = `<p class="lead">${esc(about)} See it on your own lips before you buy.</p><h2>How to try ${l} lipstick</h2><ol><li>Add a clear, front-facing photo.</li><li>Open <b>Beauty Lab</b> and choose <b>Lip color</b>.</li><li>Pick a ${l} shade, set the strength and the finish (cream, matte, shimmer or glitter).</li><li>Add gloss for a glassy finish and save.</li></ol>${cta(`Try ${l} lipstick on your photo`)}${faqHtml(faqs)}<h2>More shades</h2>${grid(LIPS.filter(x => x !== lp).map(x => [lipUrl(x), x[0] + ' lipstick', 'Try it on']))}`;
    write(lipUrl(lp), page({ url: lipUrl(lp), title: `Try On ${n} Lipstick on Your Photo, Free | Face Couture`, desc: `See how ${l} lipstick looks on you. Try ${l} shades in cream, matte or shimmer on your own selfie, free and private.`, h1: `Try on ${l} lipstick`, body, crumb: [{ name: 'Lipstick try-on', url: SITE + '/lipstick-try-on/' }, { name: n, url: SITE + lipUrl(lp) }], ld: [faqLd(faqs)] }), '0.6');
    kw(lipUrl(lp), `Try ${l} lipstick`, [`${l} lipstick try on`, `try on ${l} lipstick`, `does ${l} lipstick suit me`, `${l} lipstick filter`], 2);
  }
  write('/lipstick-try-on/', page({ url: '/lipstick-try-on/', title: 'Lipstick Try-On: Test Lipstick Shades on Your Photo, Free | Face Couture', desc: 'Try red, nude, pink, berry, mauve, coral, plum, brown and burgundy lipstick on your own selfie. Cream, matte, shimmer or gloss. Free and private.', h1: 'Lipstick try-on', body: `<p class="lead">Dozens of shades, four finishes plus gloss, on your own lips.</p>${grid(LIPS.map(l => [lipUrl(l), l[0] + ' lipstick', 'Try it on']))}${cta('Try lipstick on your photo')}`, crumb: [{ name: 'Lipstick try-on', url: SITE + '/lipstick-try-on/' }] }), '0.8');
  kw('/lipstick-try-on/', 'Try lipstick shades', ['lipstick try on', 'virtual lipstick try on', 'try on lipstick online', 'lipstick filter', 'lipstick color changer', 'lip color try on app', 'try lipstick on my photo'], 1);

  // ---------- Hair color try-on ----------
  const HAIR = [['Black', ['Soft black', 'Espresso']], ['Brown', ['Espresso', 'Chocolate', 'Chestnut']], ['Red', ['Auburn', 'Copper', 'Burgundy']], ['Blonde', ['Caramel', 'Honey', 'Golden blonde', 'Ash blonde']]];
  const hairUrl = h => '/hair-color-try-on/' + slug(h[0]) + '/';
  for (const h of HAIR) {
    const [n, shades] = h, l = n.toLowerCase();
    const body = `<p class="lead">Wondering how you’d look with ${l} hair? Try it on your own photo before your salon appointment.</p><h2>${esc(n)} shades to try</h2><ul>${shades.map(s => `<li>${esc(s)}</li>`).join('')}</ul><h2>How to try it</h2><ol><li>Add a photo where your hair is clearly visible.</li><li>Open <b>Beauty Lab</b>, choose <b>Hair</b>, then <b>Hair color</b>.</li><li>Pick a shade, compare before and after, and save it for your stylist.</li></ol>${cta(`Try ${l} hair on your photo`)}<h2>Other colors</h2>${grid(HAIR.filter(x => x !== h).map(x => [hairUrl(x), x[0] + ' hair', x[1].join(', ')]))}`;
    write(hairUrl(h), page({ url: hairUrl(h), title: `See Yourself With ${n} Hair: Free Hair Color Try-On | Face Couture`, desc: `Try ${shades.join(', ').toLowerCase()} ${l} hair on your own photo, free. Show your stylist the shade you want.`, h1: `Try ${l} hair on your photo`, body, crumb: [{ name: 'Hair color try-on', url: SITE + '/hair-color-try-on/' }, { name: n, url: SITE + hairUrl(h) }] }), '0.6');
    kw(hairUrl(h), `Try ${l} hair`, [`${l} hair try on`, `see myself with ${l} hair`, `${l} hair filter`, `what would i look like with ${l} hair`], 2);
  }
  write('/hair-color-try-on/', page({ url: '/hair-color-try-on/', title: 'Hair Color Try-On: See Yourself With New Hair Color, Free | Face Couture', desc: 'Try black, brown, auburn, copper, burgundy, caramel, honey and blonde hair on your own photo. Free and private, right on your phone.', h1: 'Hair color try-on', body: `<p class="lead">11 hair colors to try on your own photo, from soft black to ash blonde.</p>${grid(HAIR.map(h => [hairUrl(h), h[0] + ' hair', h[1].join(', ')]))}${cta('Try a new hair color')}`, crumb: [{ name: 'Hair color try-on', url: SITE + '/hair-color-try-on/' }] }), '0.8');
  kw('/hair-color-try-on/', 'Try a new hair color', ['hair color try on', 'hair color changer', 'try hair color on my photo', 'virtual hair color', 'hair color filter', 'what hair color suits me', 'hair dye simulator'], 1);

  // ---------- More features ----------
  const F2 = [
    ['ai-headshot-generator', 'AI Headshot Generator: Professional Photo From a Selfie | Face Couture', 'Professional headshots from a selfie', 'Turn a good selfie into a polished, professional headshot for LinkedIn, resumes and company pages. Your face stays yours.',
      '<p class="lead">No studio needed: start with a clear selfie and finish with a polished headshot.</p><h2>How it works</h2><ul><li>Choose the <b>Executive</b> look (or <b>Sharp Headshot</b> for men) for even skin and soft definition.</li><li>Use a clean background with Background swap or Change the scene (AI).</li><li>Save at LinkedIn’s 800 × 800 profile size or a 1600 × 2000 portrait.</li></ul>', ['ai headshot generator', 'ai headshot', 'professional headshot from selfie', 'linkedin headshot generator', 'ai linkedin photo', 'corporate headshot ai', 'headshot photo editor']],
    ['lash-try-on', 'Eyelash Try-On: Natural to Dramatic Lashes on Your Photo | Face Couture', 'Eyelash try-on', 'Try natural, wispy, lifted, glam and dramatic lashes on your own photo before you book extensions or buy strips.',
      '<p class="lead">See lash styles on your own eyes before you book extensions or buy strip lashes.</p><h2>Styles to try</h2><ul><li>Natural</li><li>Wispy</li><li>Lifted</li><li>Satin Glam (volume)</li><li>Dramatic</li><li>Full drama (runway)</li></ul><p>Lashes sit on your lash line so they look real, never floating.</p>', ['lash try on', 'eyelash extensions try on', 'eyelash filter', 'false lashes try on', 'lash style finder', 'which lashes suit my eyes']],
    ['free-selfie-editor', 'Free Selfie Editor: Retouch, Glow & Resize in One Tap | Face Couture', 'Free selfie editor', 'A free selfie editor that keeps you looking like you: skin smoothing, glow, makeup, filters, captions and 40+ sizes. No account needed.',
      '<p class="lead">Retouch, glow and resize your selfie in seconds, right in your browser or the app.</p><ul><li>Auto Glow and retouch strength from Subtle to Max.</li><li>Light and color presets, portrait presets and captions.</li><li>Crop, rotate, flip and 40+ platform sizes.</li><li>Saved photos have location data removed.</li></ul>', ['free selfie editor', 'selfie editor', 'selfie retouch app', 'beauty camera app', 'face retouch app', 'photo editor for selfies', 'selfie filter app']],
    ['blemish-remover', 'Blemish Remover: Clear Skin in Photos, Naturally | Face Couture', 'Remove blemishes from photos', 'Smooth skin and remove blemishes, redness, scars and wrinkles in your photos while keeping real skin texture.',
      '<p class="lead">Clear up a breakout, redness or a scar without the plastic look.</p><ul><li><b>Auto:</b> fixes only uneven or red areas.</li><li><b>Whole face, softly:</b> gentle all-over smoothing.</li><li><b>Only where I paint:</b> you choose exactly where.</li><li><b>Vanish:</b> paint over a single spot and make it disappear.</li></ul>', ['blemish remover', 'remove acne from photo', 'acne remover photo', 'remove pimples from photo', 'skin smoothing app', 'remove wrinkles from photo', 'clear skin filter']]
  ];
  for (const [s, t, h, d, body, kws] of F2) {
    const faqs = [[`Is it free?`, 'Yes. Face Couture’s on-device tools are free with no account. Premium AI looks come with a small allowance.']];
    write('/' + s + '/', page({ url: '/' + s + '/', title: t, desc: d, h1: h, body: body + cta('Try it on your photo') + faqHtml(faqs), crumb: [{ name: h, url: SITE + '/' + s + '/' }], ld: [faqLd(faqs)] }), '0.8');
    kw('/' + s + '/', h, kws, 1);
  }

  // ---------- Keywords for the first set of pages ----------
  kw('/', 'Brand and main app', ['face couture', 'face couture app', 'facecouture', 'face couture always luxe', 'always luxe app'], 1);
  kw('/ai-makeup-app/', 'AI makeup app', ['ai makeup app', 'ai makeup', 'makeup app', 'ai makeup generator', 'ai makeup filter', 'makeup filter app', 'best makeup app', 'free makeup app', 'apply makeup to photo', 'makeup editor', 'ai beauty app', 'makeup photo editor'], 1);
  kw('/virtual-makeup-try-on/', 'Try makeup before buying', ['virtual makeup try on', 'makeup try on', 'try on makeup online', 'virtual makeover', 'makeover app', 'try makeup on my face', 'makeup simulator', 'virtual makeup app', 'online makeup try on free'], 1);
  kw('/ai-glow-up/', 'Glow up a photo', ['glow up app', 'ai glow up', 'glow up photo editor', 'glow up filter', 'glow filter', 'natural beauty filter', 'beauty filter', 'face glow app', 'make my photo look better'], 1);
  kw('/ai-outfit-change/', 'Try on clothes', ['ai outfit changer', 'ai outfit change', 'change clothes in photo', 'virtual try on clothes', 'try on clothes online', 'ai clothes changer', 'outfit try on app', 'dress try on app', 'ai dress changer'], 1);
  kw('/ai-background-change/', 'Change photo background', ['ai background changer', 'change photo background', 'background changer', 'photo background editor', 'remove background from photo', 'put me in a different place photo', 'ai travel photo', 'change background of picture free'], 1);
  kw('/remove-object-from-photo/', 'Remove something from a photo', ['remove object from photo', 'remove person from photo', 'object remover', 'magic eraser', 'remove photobomber', 'erase objects from photos free', 'photo eraser app'], 1);
  kw('/photo-retouch-for-men/', 'Men’s photo retouch', ['photo editor for men', 'face retouch for men', 'men beauty filter', 'men photo retouch', 'male face editor', 'natural filter for men'], 2);
  kw('/bridal-makeup-try-on/', 'Preview bridal makeup', ['bridal makeup try on', 'wedding makeup try on', 'try bridal makeup on my photo', 'virtual bridal makeover'], 1);
  kw('/dating-profile-photos/', 'Better dating photos', ['dating profile photo', 'best dating profile pictures', 'hinge photo size', 'tinder photo size', 'bumble photo size', 'dating app photo editor', 'dating profile picture tips'], 1);
  kw('/photo-sizes/', 'Image sizes for platforms', ['social media image sizes', 'social media image sizes ' + YEAR, 'photo size for social media', 'image size guide', 'resize photo for social media', 'photo resizer', 'image resizer', 'resize image online free', 'profile picture size'], 1);
  for (const [p, list] of Object.entries(platforms)) {
    const u = '/photo-sizes/' + slug(p) + '/', l = p.toLowerCase();
    kw(u, `${p} image size`, [`${l} photo size`, `${l} image size`, `${l} picture size`, `resize photo for ${l}`].concat(list.map(x => `${l} ${x.label.replace(/ preset$/i, '').toLowerCase()} size`)), ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'YouTube', 'Pinterest'].includes(p) ? 1 : 2);
  }
  return KW;
};
