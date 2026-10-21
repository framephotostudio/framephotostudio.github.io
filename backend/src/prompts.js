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
  rome: 'Rome with the Colosseum softly blurred in warm light', tokyo: 'a Tokyo street at night with soft neon bokeh', alps: 'snow-capped Swiss Alps with clear morning light'
};
// ---- Face Couture luxury beauty finishes ------------------------------------------------------------------------------
// Direction: "me, beautifully perfected - fabulous, bronzed, glowing, expensive-looking, and still recognizably me".
// Every finish is generated from the ORIGINAL photo (never stacked). Shape refinements are done the way a makeup artist
// does them (contour, highlight, liner placement), which keeps identity and avoids the image model declining the edit.
const LASHES = 'First and most important: longer, fuller luxury lashes that are clearly visible at first glance - upper lashes noticeably longer and fuller with a lifted curl, realistic individual hairs with natural separation, fanned slightly toward the outer corners, rooted exactly along her real upper lash line (never a thick black strip, never clumped, never floating above the eyelid), plus softly defined lower lashes.';
const STANDARD = 'Beauty standard: ' +
  'flawless skin - remove visible wrinkles, under-eye creases, blemishes, acne scars, redness and uneven patches while keeping subtle, realistic skin texture (never blurry, waxy or plastic); ' +
  'a bronzed glow - sun-kissed warmth from seamlessly blended bronzer and luminous skin, keeping her natural skin tone (never orange, never darker overall, no glitter, no oily shine); ' +
  'refined highlight in champagne, rose-gold or gold suited to her skin tone, concentrated on the upper cheekbones with a restrained touch on the nose and cupid\'s bow; ' +
  'a slimmer-looking nose from subtle contour along the sides and a fine highlight down the center (no pinched nostrils, no harsh lines, same proportions); ' +
  'beautiful eyes - smoothly blended eyeshadow and precisely aligned eyeliner, with makeup placed to open and lift hooded lids, without changing eye shape; ' +
  'polished brows with softly defined shape and realistic hair strokes (never solid or painted on); ' +
  'perfect lips - color covering the entire visible lip surface including the corners, clean edges, realistic texture, softly fuller-looking without exaggerated overlining; ' +
  'seamless sculpting - contour, blush, bronzer and highlight melted together (no stripes, no deep cheek hollows, no muddy shadows); ' +
  'a consistent complexion so the face, neck and visible chest match and nothing looks like a mask.';
const PRESERVE = 'Preserve the photograph: the same person and identity, natural skin tone and undertone, expression, hair, clothing, jewelry, glasses, pose, background, lighting direction and facial anatomy. Her eyes stay exactly hers - same eye color, iris, pupils and shape, sharp, crisp and naturally bright, never recolored, blurred or redrawn. Adapt to any makeup she already wears (no doubled makeup) and never paint over hair, hands or accessories. Photorealistic, sharp fine detail. She should look like herself after exceptional professional makeup and beauty retouching.';
const GLAM = {
  soft: { name: 'Soft Glam',
    short: 'softly perfected glowing skin, gentle bronze warmth, rosy-neutral eyeshadow, delicate liner, wispy longer lashes, soft sculpting, rosy blush and a glossy rose lip',
    look: 'SOFT GLAM - refined everyday luxury with a light touch but clearly enhanced and polished: softly perfected, fresh, luminous skin with gentle bronzed warmth; soft champagne and rosy-neutral eyeshadow blended into the crease; a delicate brown eyeliner close to the upper lashes, slightly lifted at the outer corner; wispy, longer, fluttery lashes; soft natural brows; gentle sculpting under the cheekbones; a fresh rosy blush on the apples of the cheeks; a satin champagne glow on the cheekbones; and a beautiful rose lipstick with a soft glossy sheen.' },
  max: { name: 'Full Glam',
    short: 'flawless satin skin, rich bronze sculpting, luminous cheekbones, dimensional bronze and champagne eyes, defined liner, noticeably longer fuller lashes, polished brows and precise rose-berry lips',
    look: 'FULL GLAM - a complete professional makeup transformation, dramatic and glamorous yet beautifully blended with realistic detail: flawless satin-finish skin; richer bronze sculpting on the cheekbones, temples and jaw; luminous highlighted cheekbones; dimensional eyeshadow with champagne on the lids, warm bronze in the crease and a deeper soft brown in the outer corners; a defined, smooth eyeliner along the upper lash line with a soft lifted flick; noticeably longer, fuller, glamorous lashes; polished, defined brows; and precisely finished lips in a rich rose-berry satin with a hint of shine.' },
  glam: { name: 'Red Carpet',
    short: 'luminous bronzed skin, elegant sculpting, golden highlight, a soft shimmering smoky eye with a lifted wing, glamorous separated lashes and an immaculate classic red lip',
    look: 'RED CARPET - sophisticated evening beauty with its own complete makeup design, camera-ready and cohesive: luminous bronzed skin with elegant sculpting and a controlled golden highlight on the cheekbones; a refined, softly shimmering smoky eye in warm bronze and champagne gold, blended upward and outward to lift the eye; a sleek, precise eyeliner wing; glamorous, long, separated lashes; polished defined brows; and an immaculate classic red lipstick with crisp clean edges and a velvety satin finish. The smoky eye and red lip are balanced so the whole look is elegant, never heavy.' }
};
export function simplePrompt(task, o = {}) {
  if (task !== 'glam') return null;
  const L = GLAM[o.intensity] || GLAM.glam;
  return o.style === 'men' ? 'Lightly retouch this photo: clearer even skin and neatly groomed brows. Keep everything else the same. Photorealistic.'
    : `${LASHES} Give ${o.who ? String(o.who).slice(0, 120) : 'this woman'} expensive ${L.name} makeup: ${L.short}, with smooth flawless skin and a softly slimmer-looking nose from contour. Keep her eyes, face, skin tone and everything else in the photo the same. Photorealistic.`;
}
const GROOM = {
  soft: 'clearer, more even skin with less redness and shine, softened under-eye darkness, tidy brows',
  glam: 'clear even skin with natural texture, reduced redness, shine and under-eye shadows, neatly groomed brows, crisp beard and hairline edges, subtly sculpted jawline and cheekbones, brighter healthy complexion',
  max: 'flawless even skin with natural texture, no blemishes or redness, refreshed eyes, sharply groomed brows and facial hair, a defined chiseled jawline and cheekbones, healthy bronzed glow'
};
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
        : `Professional beauty retouch and luxury makeup for ${o.who ? String(o.who).slice(0, 120) + ' (each person gets the full look, adapted to her own features and skin tone)' : 'the woman in this photo'}. ${LASHES} ${L.look}${o.eyes ? ' Eyes: ' + o.eyes + '.' : ''}${o.lip ? ' Lips: ' + o.lip + '.' : ''} ${STANDARD}`;
      return p + ' ' + (men ? 'Keep the same person with the same face, features, eyes, skin tone, hair, expression, pose, clothing and background. Photorealistic with natural skin texture.' : PRESERVE);
    }
    case 'enhance':
      p = 'Enhance this photo naturally like a professional retoucher: balanced exposure and color, clean skin with real texture, bright clear eyes, crisp details. Do not change makeup, hair, outfit or background.';
      break;
    case 'headshot':
      p = `Turn this into a professional studio headshot for LinkedIn: ${outfit || 'the same outfit, neatened'}, ${bg || 'a clean soft-grey studio backdrop'}, flattering soft key light, confident natural expression, sharp focus on the eyes.`;
      break;
    case 'background':
    case 'travel':
      p = `Replace only the background with ${bg || 'a clean studio backdrop'}. Keep the person, their outfit and hair exactly as they are with clean natural edges around hair and body; match lighting direction, color temperature and shadows so the person looks truly present in the scene, with correct perspective and depth of field.`;
      break;
    case 'blur':
      p = 'Keep the person exactly as they are and smoothly blur the existing background like an 85mm f/1.8 portrait lens, with clean hair edges.';
      break;
    case 'vanish':
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
  return p + ' ' + KEEP;
}
