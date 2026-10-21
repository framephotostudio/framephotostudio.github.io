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
// ---- Face Couture luxury beauty finishes (v3: makeup only) ---------------------------------------------------------------
// The owner's favourite results came from a plain "luxury makeup on this exact face" instruction. Asking the image model to
// reshape (slim the nose, open eyelids, sculpt) made it redraw the face and eyes, which changed eye colour and looked AI-made.
// So the model only applies makeup and light skin retouching. A subtle nose refinement is done afterwards on the device with
// the studio's own landmark warp, and the person's real irises are restored, so the face and eye colour never change.
const SAME_FACE = 'This is a makeup-only edit: do not reshape anything. Keep her exact face shape, nose, lips shape, jaw, cheeks, eyelids, eye shape, eye size and her exact natural eye color and iris pattern, the same skin tone and undertone, hair, expression, pose, clothing, jewelry, background, lighting and framing (no crop, no zoom). She must look exactly like herself, wearing beautiful expensive makeup.';
const LUX = 'Expensive high-end makeup by a celebrity makeup artist with luxury products, seamlessly blended with no harsh edges. ' +
  'Skin: a luxury retouch that stays real - even out the tone, soften under-eye darkness and fine lines, clear blemishes, redness and small scars, remove oily shine; keep natural skin texture and pores so it never looks airbrushed, waxy or plastic. ' +
  'Lashes: noticeably longer and fuller luxury lash extensions with realistic, separated, tapered individual hairs and a lifted curl, longest at the center and outer-center, rooted exactly on her real upper lash line (no thick black band, no clumps, no heavy outer corners). ' +
  'Eyes: blended eyeshadow placed just above the natural crease with a softly luminous lid and a thin liner hugging the upper lash line, so the eyes look bright and open without changing the eyes themselves. ' +
  'Softly defined brows with natural hair strokes. A soft warm bronzer, blush and a refined satin highlight on the upper cheekbones (no glitter, no white streaks). Lipstick covering the whole lip including the corners with a clean natural edge.';
const GLAM = {
  soft: { name: 'Soft Glam', short: 'shimmery champagne-rose eyes, soft thin liner, long fluffy lashes, rosy blush, a soft glow and a glossy rose-pink lip',
    look: 'SOFT GLAM for a night out, clearly visible and glamorous, not barely there: shimmery champagne and rose-pink eyeshadow with a soft brown definition in the outer crease, a soft thin liner, long full fluffy lashes, a pretty rosy-pink blush, a luminous champagne glow on the cheekbones, and a clearly visible light rose-pink lipstick (a true rose, not nude) with a high-shine clear gloss.' },
  max: { name: 'Full Glam', short: 'a refined soft-focus bronze smoky eye, softly smudged liner, fuller longer lashes, bronzed cheeks with a satin glow and a polished rose-berry lip',
    look: 'FULL GLAM, richer than Soft Glam but refined and expensive, never heavy: a soft-focus smoky eye in warm taupe, soft bronze and champagne shimmer, blended out seamlessly and kept light enough that the eyes look bright and open, a softly smudged brown-black liner close to the upper lashes (no sharp or thick line), fuller longer lashes, warm bronzer and a satin highlight, and a polished rose-berry satin lipstick.' },
  glam: { name: 'Red Carpet', short: 'a bronze and champagne eye with a sleek winged liner, glamorous long lashes, golden glow and a classic red lip',
    look: 'RED CARPET evening glamour: a warm bronze eye with champagne shimmer on the center of the lid, a sleek elegant winged liner, glamorous long lashes, warm bronzer with a golden glow on the cheekbones, and a classic creamy red lipstick with a crisp clean edge.' }
};
export function simplePrompt(task, o = {}) {
  if (task !== 'glam') return null;
  const L = GLAM[o.intensity] || GLAM.glam;
  return o.style === 'men' ? 'Lightly retouch this photo: clearer even skin and neatly groomed brows. Keep everything else the same. Photorealistic.'
    : `Add expensive ${L.name.toLowerCase()} makeup to ${o.who ? String(o.who).slice(0, 120) : 'this woman'}: ${L.short}. Makeup only - keep her face, eyes, eye color and everything else in the photo the same. Photorealistic.`;
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
        : `Apply luxury makeup to ${o.who ? String(o.who).slice(0, 120) + ' (apply the full finish consistently to every one of them, adapted to each person\'s own features and skin tone)' : 'the woman in this photo'}. ${L.look}${o.eyes ? ' Eyes: ' + o.eyes + '.' : ''}${o.lip ? ' Lips: ' + o.lip + '.' : ''} ${LUX}`;
      return p + ' ' + (men ? 'Keep the same person with the same face, features, eyes, skin tone, hair, expression, pose, clothing and background. Photorealistic with natural skin texture.' : SAME_FACE + ' Photorealistic with sharp natural detail.');
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
