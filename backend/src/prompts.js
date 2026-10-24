// Prompts for the image model. Every prompt protects identity, true skin tone and facial features.
const KEEP = 'Keep this exact person: same face shape, eyes, nose, lips, skin tone and undertone (no lightening, no yellow or orange cast), same hair, same expression and pose. Photorealistic, high resolution, natural skin texture with pores. No text, no watermark, no extra people.';

const OUTFITS = {
  business: 'a tailored professional blazer', smart: 'a smart-casual top', elegant: 'an elegant evening outfit', summer: 'a light summer blouse',
  lace: 'an elegant lace top', silk: 'a silk blouse', casual: 'a relaxed casual outfit', dress: 'a summer dress', formal: 'a formal suit', modest: 'a modest long-sleeve outfit'
};
const BACKDROPS = {
  studio: 'a clean soft-grey photo studio backdrop with gentle key light', outdoor: 'a natural outdoor setting with soft daylight', city: 'a softly blurred city street',
  white: 'a pure white seamless backdrop', office: 'a bright modern office, softly blurred', cafe: 'a bright café interior, softly blurred', garden: 'lush garden greenery, softly blurred',
  beach: 'a soft sunlit beach with calm sea', sunset: 'golden-hour outdoor light with warm bokeh', interior: 'an elegant neutral interior', blur: 'the same background, smoothly blurred like an 85mm portrait lens',
  pastel: 'a soft pastel studio backdrop',
  // travel scenes
  greece: 'Santorini, Greece: white-washed walls, blue domes and the Aegean sea in soft afternoon light', paris: 'Paris with the Eiffel Tower softly blurred in the distance, golden-hour light',
  newyork: 'a New York City street with blurred skyscrapers and warm evening light', london: 'London with Big Ben softly blurred behind, overcast soft light',
  dubai: 'a Dubai skyline at dusk with the Burj Khalifa softly blurred', bali: 'a Bali rice terrace with warm tropical light', maldives: 'a Maldives beach with turquoise water and an overwater villa',
  // curated Face Couture scenes (v1: no open prompt)
  santorini_day: 'a bright Santorini, Greece terrace in clear midday sun: white-washed walls, a blue-domed church and the deep blue Aegean caldera behind, crisp natural daylight',
  santorini_sunset: 'a Santorini, Greece terrace at golden sunset: white-washed houses and a blue dome glowing in warm orange light, the sea and caldera behind, soft warm sunset light',
  mykonos: 'a Mykonos, Greece whitewashed lane with blue doors and shutters, pink bougainvillea and the blue sea in the distance, bright Mediterranean daylight',
  beach_lux: 'a luxurious white-sand beach with turquoise water, palm trees and soft sunlight, gently blurred like a real photo',
  paris_cafe: 'a charming Parisian cafe terrace with wicker chairs, small round tables and Haussmann buildings, softly blurred behind, warm natural light',
  rome: 'Rome with the Colosseum softly blurred in warm light', tokyo: 'a Tokyo street at night with soft neon bokeh', alps: 'snow-capped Swiss Alps with clear morning light'
};
// ---- Face Couture luxury beauty finishes ------------------------------------------------------------------------------
// Direction: "me, beautifully perfected - fabulous, bronzed, glowing, expensive-looking, and still recognizably me".
// Every finish is generated from the ORIGINAL photo (never stacked). Shape refinements are done the way a makeup artist
// does them (contour, highlight, liner placement), which keeps identity and avoids the image model declining the edit.
const LASHES = 'Lashes: clearly longer and fuller, made of realistic individual hairs with tapered tips, varied lengths, natural separation and an upward lifted curl; the most length at the center and outer-center of each eye (not heavy at the outer corners, which would make the eyes droop); rooted exactly on each real upper lash line in the correct perspective for each eye; never a dense uniform black fringe, band, clumps, blunt ends, floating lashes or dark outlines that make the eyes look smaller.';
const EYES = 'Eyes: keep each eye\'s exact shape, size, color, spacing, gaze and expression - do not enlarge, reshape or replace the eyes. Enhance them with expertly blended, dimensional shadow, refined shimmer and precise liner that follows the natural eyelid. For hooded eyes, place the shadow slightly above the natural crease so it stays visible with the eyes open, keep the visible mobile lid subtly luminous, keep the upper liner thin so it does not use up the lid space, avoid heavy dark shadow over the whole lid and thick lower liner, without changing the eyelid structure or the brows.';
const STANDARD = 'Quality standard: ' +
  'flawless realistic skin - completely smooth away all under-eye creases, under-eye wrinkles, fine lines and under-eye darkness, and remove visible blemishes, acne scars, wrinkles and uneven patches while keeping subtle pore texture, sharp facial detail and natural dimension (never blurry, flat, waxy or plastic); ' +
  'soft natural contour shading on the nose only, never changing its shape or size; ' +
  'a clearly visible, luxurious bronzed finish in every look - warm sun-kissed bronze suited to her natural skin tone, bronzer blended around the temples, under the cheekbones and along the jawline (never orange, muddy, too dark or hollow); ' +
  'beautiful blush in a flattering rose, peach or warm pink coordinated with the lips, placed to softly lift the cheeks, melting seamlessly into the bronzer and highlight; ' +
  'an overall luminous satin glow with a refined champagne, rose-gold or golden highlight on the upper cheekbones, as strong as the look calls for (no glitter, no white streaks, no oily shine); ' +
  'softly defined brows with realistic hair detail; ' +
  'lipstick applied precisely across the entire visible lip surface including the corners, with clean edges and realistic texture, at exactly her natural lip size; ' +
  'the face, neck and visible chest kept in one consistent tone.';
const PRESERVE = 'The upper lip must be exactly as tall as in the original and the lipstick stays fully inside her natural lip line - never fuller. Do not change her face shape. Do not change her nose shape or size. Eyes: keep the exact natural outline of each eye - the same rounded shape, the same inner and outer corners, the same size and openness, never lifted, slanted, almond-shaped or enlarged - and the same natural eye color, one natural iris and pupil per eye; give the eyes the full makeup (eyeshadow, eyeliner and fuller, longer lashes) without changing the eyes themselves. Eyeliner and wings follow the lash line exactly and are short, soft and identical on both eyes, never extending or lifting the outer corner; lashes equally full on both eyes. Brows: exactly her natural brows - same shape, arch, thickness, position and color - only lightly filled, never thicker, darker, higher or reshaped. Lips: exactly her natural lip size, outline and symmetry - both corners at the same height as in the original, never bigger, plumped, raised or overlined; fill the lipstick completely to her natural lip edge and into the corners. Keep her exact same relaxed facial expression: do not add or deepen creases at the mouth corners, smile lines, nasolabial folds, dimples, or shadows around the mouth and nose, and do not tense, purse or lift the lips or cheeks. Preserve the person and photograph: same identity, natural skin tone and undertone, expression, eye color, hair, clothing, jewelry, glasses, pose, background, original lighting direction and face angle. Adapt to any makeup she already wears (no doubled lashes or makeup) and never paint over hair crossing the face, hands, glasses or accessories. Photorealistic with sharp fine detail. She should look like herself after exceptional professional makeup and beauty retouching, with a real wow factor. MOST IMPORTANT: her eyes must stay exactly the same shape and size as in the original photo - the same outline, the same corners, the same openness and the same eye color. Makeup goes around the eyes; it never changes the eyes.';
const GLAM = {
  soft: { name: 'Soft Glam',
    short: 'a shimmery rose-taupe and bronze smoky eye with smoky liner, full lashes, rosy blush, radiant highlight and a glossy rosy-pink lip',
    look: 'SOFT GLAM - a full, glamorous evening-style glam like a date-night look, clearly made up and never faint or pale: radiant glowing skin with a highlighter on the cheekbones, brow bone and cupid\'s bow; a clearly visible SMOKY eye in shimmery rose-taupe, champagne and warm bronze-brown, with a smoky crease and outer corner, a defined liner with a short soft wing, and a smoky liner along the lower lash line; full, long lashes; a rosy blush and warm bronze; and a rosy-pink lipstick with a soft gloss and clearly visible color.' },
  max: { name: 'Full Glam',
    short: 'flawless satin skin, defined bronze sculpting, dimensional blush, luminous cheekbones, noticeably smokier eyes with defined liner, longer fuller lashes and a deeper rose-berry lipstick',
    look: 'FULL GLAM - richer, smokier and more dramatic than Soft Glam, a striking professional makeup transformation that is not simply darker: noticeably smokier eyes with richer bronze and soft espresso shadow in seamless gradients, champagne shimmer on the center of the lid and a more defined liner; noticeably fuller, longer lashes than Soft Glam with an expensive, high-end natural look - realistic separation and tapered tips, placed exactly along her upper lash line and following its curve, fullest at the outer-middle; more defined bronze sculpting, dimensional blush and luminous cheekbones; and a lipstick slightly darker and richer than Soft Glam - deeper rose, mauve or rose-berry for her complexion.' },
  clean: { name: 'Clean Girl',
    short: 'a shimmery champagne-gold eye with a soft bronze crease and soft wing, full lashes, peachy-pink blush, dewy glow and a glossy peach-pink lip',
    look: 'CLEAN GIRL - a fresh, dewy glam in the same style as a bridal glam, clearly made up (never light or pale): dewy glass-skin glow with a radiant highlighter on the cheekbones, brow bone and cupid\'s bow; softly brushed-up natural brows; a clearly visible shimmery champagne-gold eye with a soft bronze crease and outer corner, a defined liner with a short soft wing, and a soft smoky liner along the outer lower lash line; full, fluttery lashes; a peachy-pink blush and soft bronze; and a glossy peach-pink lip with clearly visible color.' },
  bridal: { name: 'Bridal Glow',
    short: 'glowing luminous skin, a soft rose-bronze smoky eye with a soft wing, full glamorous lashes, glowy pink blush, highlighter and a glossy rosy lipstick',
    look: 'BRIDAL GLOW - a glamorous, romantic bridal glam, clearly made up and camera-ready (never light or barely there): luminous, glowing skin with a generous, radiant pearly-champagne highlighter on the cheekbones, brow bone, bridge of the nose and cupid\'s bow; a clearly visible soft SMOKY eye in pretty shimmery rose-gold, champagne and soft bronze, with warm brown blended through the crease and outer corner and a sparkling shimmer across the lid, a defined liner with a soft elegant wing, and a soft smoky liner along the outer lower lash line; full, long, glamorous lashes; a glowy pink blush and soft bronze; and a glossy rosy-pink lipstick with clearly visible color.' },
  golden: { name: 'Golden Hour',
    short: 'warm golden-bronze glowing skin, a bronze-copper smoky eye with gold shimmer and smoky liner, full lifted lashes, peach-bronze blush and a glossy warm rose-peach lip',
    look: 'GOLDEN HOUR - warm, sun-kissed and glowing: warm golden-bronze skin with a glowing golden highlight on the cheekbones; clearly visible bronze and warm copper eyeshadow with gold shimmer on the lid, and a SMOKY brown liner smudged along the upper lash line and softly under the outer lower lashes; full, lifted lashes; a warm peach-bronze blush and a strong, sun-kissed bronzer; and a glossy warm rose-peach lip with clearly visible color (never nude).' },
  datenight: { name: 'Date Night',
    short: 'a shimmery mauve, plum-brown and rose smoky eye with smoky liner, full lashes, rosy-berry blush, radiant highlight and a glossy rosy berry lip',
    look: 'DATE NIGHT - a romantic evening glam in the same style as a bridal glam but a little smokier, clearly made up: radiant glowing skin with a highlighter on the cheekbones, brow bone and cupid\'s bow; a clearly visible SMOKY eye in shimmery mauve, plum-brown and rose, with a smokier crease and outer corner, a defined liner with a short soft wing, and a smoky liner along the lower lash line; full, flirty lashes; a rosy-berry blush and soft bronze; and a rosy berry lipstick with a soft gloss and clearly visible color.' },
  executive: { name: 'Executive',
    short: 'polished matte-satin bronzed skin, defined taupe and soft brown eyes with a precise liner, defined lashes, neat brows and a polished rosy-mauve lip',
    look: 'EXECUTIVE - polished, confident and headshot-ready, clearly made up: flawless matte-satin skin with no shine, still warm, bronzed and healthy; defined eyes in taupe and soft brown blended through the crease, with a thin, precise liner along the upper lash line; defined, visibly fuller lashes that look natural; neatly defined brows; subtle contour, a soft natural blush and soft bronze; and a polished rosy-mauve lipstick with a satin finish and clearly visible color (never pale).' },
  aiglow: { name: 'AI Glow',
    short: 'a luxurious bronzed glow: warm sun-kissed bronzed skin, a rosy blush, a luminous champagne highlight, a matte bronze and rose-copper smoky eye with a smoky brown liner, slightly fuller natural lashes, smooth flawless skin and a rich medium rose-pink lipstick with a shimmering gloss',
    look: 'AI GLOW - a luxurious, expensive-looking bronzed glam with a real wow factor, never cheap, orange or overdone: smooth, flawless, radiant skin with a soft natural smoothing finish - no blemishes, no spots, no scars, fine lines and wrinkles smoothed away naturally (forehead, smile lines, and under-eye wrinkles softened completely with no grey, ashy or patchy concealer), no forehead contour or creasing, still with real skin texture and never airbrushed, plastic or overdone - and a rosy-bronze sun-kissed finish (bronzer softly sculpting the cheekbones, temples and jawline; the bronze is a warm rosy brown, never yellow, never orange, never lighter or paler than her real skin tone); a clearly visible rosy blush on the apples of the cheeks blended into the bronzer; a clearly visible, targeted luminous champagne glow on the high points of the cheekbones, brow bone, bridge of the nose and cupid\'s bow, radiant but never glittery or oily; a clearly visible smoky eyeshadow in bronze and rose-copper that complements the rosy lips, with a soft matte finish on the lids (no shimmer or glitter on the eyelids); a model-style smoky eye, deeper at the outer corner, with a smoky brown eyeliner smudged along the upper lash line (no dark, grey or smoky shadow under the eyes); her own lashes made only slightly fuller and a little longer, each lash clearly separated, never fake-looking, spidery or clumpy; softly defined natural brows; and a rich medium rose-pink lipstick (a true rose pink, never plum, dark, coral, peach or orange, even if she already wears a coral or peach lipstick) with a glossy finish that has a fine shimmer, with a subtle satin highlight on the center of the lips, covering her entire natural lip including both corners, with clean edges, at exactly her natural lip size. Keep real skin texture everywhere; never make the eye area darker overall. Her eyes must look exactly like her original eyes: the same iris color, the same shape, the same size and the same openness, with the makeup only around them. Her lips must stay exactly the same size and shape as in the original - the same width, the same height of the upper and lower lip and the same smile - with the lipstick only coloring them.' },
  glam: { name: 'Red Carpet',
    short: 'elegant bronze sculpting, polished blush and golden radiance, a refined gold-and-bronze smoky eye with precise winged liner and glamorous lifted lashes, and an immaculate classic red statement lip',
    look: 'RED CARPET - sophisticated, camera-ready evening glamour with an editorial wow factor from the complete design, not just the lipstick: a distinct, elegant eye - a soft smoky gradient in bronze and deep chocolate with refined gold shimmer on the lid and a precise, sleek liner with a short, elegant wing that follows the natural angle of her eye (never stretching or elongating the eye shape), kept thin across the inner and middle lid so the eyes stay exactly as open as in the original; glamorous, lifted, separated lashes; elegant bronze sculpting, polished blush and a controlled golden radiance on the cheekbones; and an immaculate statement lip coordinated with the eyes and cheeks - a classic velvety red (or a deep wine red if it suits her complexion better) with crisp clean edges.' }
};
GLAM.bridal = Object.assign({}, GLAM.aiglow, { name: 'Bridal Glow' });
export function simplePrompt(task, o = {}) {
  if (task !== 'glam') return null;
  const L = GLAM[o.intensity] || GLAM.glam;
  return o.style === 'men' ? 'Lightly retouch this photo of a man: clearer even skin and neatly groomed brows, no makeup of any kind. Keep his face, expression and everything else the same. Photorealistic.'
    : `Give ${o.target ? 'only ' + String(o.target).slice(0, 120) : o.who ? String(o.who).slice(0, 120) : 'this woman'} luxurious ${L.name} makeup and beauty retouching: ${L.short}, with flawless real skin and realistic separated lashes. Keep her face, nose, natural lip size, eye shape and eye color, expression, skin tone and everything else in the photo the same${o.target ? ', and leave everyone else in the photo completely unchanged' : ''}. Photorealistic.`;
}
const GROOM = {
  soft: 'clearer, more even skin with less redness and shine, softened under-eye darkness, tidy brows',
  glam: 'clear even skin with natural texture, reduced redness, shine and under-eye shadows, neatly groomed brows, crisp beard and hairline edges, subtly sculpted jawline and cheekbones, brighter healthy complexion',
  max: 'flawless even skin with natural texture, no blemishes or redness, refreshed eyes, sharply groomed brows and facial hair, a defined chiseled jawline and cheekbones, healthy bronzed glow',
  // men's AI Grooming cards and the men's AI Glow (no makeup of any kind)
  aiglow: 'a luxury groomed glow: clear, even, healthy skin with real texture and pores, no blemishes, redness, shine or spots; fine lines and under-eye darkness softened naturally; a subtle healthy warm bronze tone (never orange, never lighter or paler than his real skin); neat, natural brows; crisp, clean beard and hairline edges with the beard kept exactly its real shape, length, density and color; a lightly defined jawline and cheekbones through natural light and shadow only',
  mgroomed: 'freshly groomed: clear, even skin with real texture, less redness and shine, softened under-eye shadows, neat natural brows, crisp clean beard and hairline edges with the beard kept exactly its real shape, length and color',
  mheadshot: 'a sharp professional headshot polish: even matte skin with real texture and no shine, reduced redness and blemishes, neat brows, crisp beard edges, clear bright eyes, confident and trustworthy',
  mcover: 'a magazine-cover grooming finish: crisp, even, healthy skin with real texture, no blemishes or redness, refreshed eyes, sharply groomed brows and facial hair, a defined jawline and cheekbones through light and shadow, an editorial polish',
  mwedding: 'a wedding-day groom finish: clear, even, rested skin with real texture, softened under-eye darkness and fine lines, neat brows, immaculate beard and hairline edges, a fresh healthy glow, camera-ready and natural',
  mbronzed: 'a healthy sun-bronzed finish: a warm, natural tan suited to his skin tone (never orange), clear even skin with real texture, no shine, neat brows, crisp beard edges, a lightly defined jawline',
  mrested: 'a well-rested finish: fresher, brighter under-eyes with dark circles and puffiness softened, clear even skin with real texture, less redness, neat brows, a healthy awake complexion'
};
const MEN_KEEP = 'Keep his exact same face shape, head size, nose, eyes, eye color, lips, ears, hair, beard shape and length, skin tone, expression, pose, clothing and background. Keep his exact same facial expression and smile: the mouth open exactly as much as in the original with the same teeth showing (never close an open smile or open a closed one), and do not add or deepen creases at the mouth corners, smile lines or around the eyes. Do not slim, reshape or resize his face, jaw, cheeks or neck. No makeup of any kind: no lipstick, lip color or gloss, no eyeshadow, eyeliner or mascara, no lash changes, no blush, no visible highlighter or shimmer. Photorealistic with natural skin texture; he must look exactly like himself, just well groomed.';
export const TRAVEL_KEYS = ['greece', 'paris', 'newyork', 'london', 'dubai', 'bali', 'maldives', 'rome', 'tokyo', 'alps', 'beach', 'sunset'];

export function buildPrompt(task, o = {}) {
  const outfit = o.outfit && o.outfit !== 'keep' ? OUTFITS[o.outfit] : null;
  const bg = o.background && o.background !== 'keep' && o.background !== 'auto' ? BACKDROPS[o.background] : null;
  const extra = (o.detail || '').toString().slice(0, 400).replace(/[\r\n]+/g, ' ');
  let p;
  switch (task) {
    case 'glam': {
      const men = o.style === 'men';
      const L = men ? GROOM[o.intensity] || GROOM.glam : GLAM[o.intensity] || GLAM.glam;
      p = men
        ? `Retouch this man like a high-end magazine grooming artist. The result must look noticeably more polished than the original: ${L}. No visible makeup, no lipstick, no eye makeup. Keep the background, clothing and lighting unchanged.`
        : `MOST IMPORTANT: her eyes must stay exactly the same shape and size as in the original photo - the same outline, the same corners, the same openness and the same eye color. Makeup goes around the eyes; it never changes the eyes. Exceptional professional makeup and beauty retouching for ${o.target ? 'only ' + String(o.target).slice(0, 120) + ' (edit her face only; leave every other person in the photo exactly as they are, completely untouched)' : o.who ? String(o.who).slice(0, 120) + ' (apply the full finish consistently to every one of them, adapted to each person\'s own features and skin tone)' : 'the woman in this photo'}. ${L.look}${o.eyes ? ' Eyes: ' + o.eyes + '.' : ''}${o.lip ? ' Lips: ' + o.lip + '.' : ''} ${LASHES} ${EYES} ${STANDARD}`;
      return p + ' ' + (men ? MEN_KEEP : PRESERVE);
    }
    case 'enhance':
      p = 'Enhance this photo naturally like a professional retoucher: balanced exposure and color, clean skin with real texture, bright clear eyes, crisp details. Do not change makeup, hair, outfit or background.';
      break;
    case 'headshot':
      p = `Turn this into a professional studio headshot for LinkedIn: ${outfit || 'the same outfit, neatened'}, ${bg || 'a clean soft-grey studio backdrop'}, flattering soft key light, confident natural expression, sharp focus on the eyes.`;
      break;
    case 'background':
    case 'travel':
      if (o.locked) { p = `Replace only the background of this photo with ${bg || 'a clean studio backdrop'}. The person must stay in exactly the same position, size, pose and framing, with the same camera angle and lens, so she lines up perfectly with the original photo. Keep the person, face, hair, outfit and accessories exactly as they are. Match the perspective and horizon to the camera height, match the light direction and color of the new scene to the light already on the person, and add a soft natural contact shadow where she stands. No extra people.`; break; }
      p = `Replace only the background with ${bg || 'a clean studio backdrop'}. Keep the person, their outfit and hair exactly as they are with clean natural edges around hair and body; match lighting direction, color temperature and shadows so the person looks truly present in the scene, with correct perspective and depth of field.`;
      break;
    case 'blur':
      if (o.locked) { p = 'Make this look like it was shot on a professional camera with an 85mm f/1.8 portrait lens: keep the person (or people) in front perfectly sharp and exactly the same - same position, size, pose, face, hair, outfit and framing - and give everything behind them a smooth, natural, creamy background blur that increases gradually with distance, with soft round bokeh from lights. The ground and objects right next to the person stay in focus at their distance. The edges of hair and clothing must blend naturally into the blurred background, exactly like a real photo with shallow depth of field, never a cut-out. Keep the same colors, light and photo grain.'; break; }
      p = 'Keep the person exactly as they are and smoothly blur the existing background like an 85mm f/1.8 portrait lens, with clean hair edges.';
      break;
    case 'vanish':
      if (o.people) { p = `Remove every person in the background of this photo (seated, standing or walking behind), keeping only the main ${o.people} in front exactly as they are. Rebuild the restaurant, tables, chairs, walls and lights behind where those people were so it looks like a real, empty, natural photo with the same lighting, perspective, focus and photo grain. Do not move, resize or change the main people, their faces, hair, clothes or pose, and do not change the framing.`; break; }
      if (o.marked) { p = `In this photo the area painted solid magenta marks something to remove. Remove it completely and rebuild what was behind it so it looks like it was never there: continue the surrounding background, lines, textures, lighting, shadows and the natural photo grain seamlessly. Do not leave any magenta, smudge or blur. Change nothing outside the magenta area.`; break; }
      p = `Remove ${extra || 'the marked distraction'} from this photo and rebuild the background behind it naturally and seamlessly, matching texture, lighting and perspective. Keep the main person untouched.`;
      break;
    case 'tryon':
      p = `Dress this person in the clothing or accessory shown in the second image (${o.category || 'garment'}), realistically fitted to their body and pose with correct drape, fabric texture, lighting and shadows. ${o.category === 'shoes' ? 'Place the shoes on their feet.' : o.category === 'bag' ? 'Place the bag naturally in hand or on the shoulder.' : o.category === 'sunglasses' ? 'Place the sunglasses on the face without hiding identity.' : o.category === 'hat' ? 'Place the hat on the head over the hair.' : o.category === 'jewelry' ? 'Place the jewelry naturally.' : ''} Keep the rest of their outfit unless it would clash.`;
      break;
    case 'refine':
    default:
      p = `Refine this photo for ${o.platform || 'social media'}: natural professional retouch, ${outfit ? 'change the outfit to ' + outfit + ', ' : ''}${bg ? 'change the background to ' + bg + ', ' : ''}balanced flattering light.`;
  }
  if (extra && task !== 'vanish') p += ' Additional instruction: ' + extra + '.';
  if ((task === 'background' || task === 'travel') && o.locked) return p;
  if (task === 'vanish' && (o.marked || o.people)) return p;
  if (task === 'blur' && o.locked) return p;
  return p + ' ' + KEEP;
}
