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
// ---- Face Couture luxury beauty finishes (v6, owner-approved list 2026-10-21) ------------------------------------------
// Base: the brief-verification run the owner reviewed (same wording), plus her rules: exact eye shape/colour, same face and
// expression (smiles stay open), natural lip size (liner only in Full Glam and Red Carpet, never a filler look), natural
// lightly-filled brows, fuller longer luxury lashes, slightly slimmer nose, highlighter glow, bronzed (never washed out),
// medium rosy glossy Soft Glam lip; in group photos only the selected person is edited.
const LASHES = 'Lashes in every look: noticeably fuller and longer, with an expensive luxury finish - realistic individual hairs with tapered tips, varied lengths, natural separation and an upward lifted curl; the most length at the center and outer-center of each eye (not heavy at the outer corners); rooted exactly on her real upper lash line in the correct perspective; never a dense uniform black fringe, band, clumps, blunt ends or floating lashes.';
const EYES = 'Eyes: do not change the eye shape at all - keep each eye\'s exact shape, size, opening, angle, spacing, gaze and her exact natural eye color and iris; never enlarge, lift, reshape or replace the eyes. Enhance them only with expertly blended shadow, refined shimmer and liner that follows the natural eyelid. For hooded eyes, place the shadow slightly above the natural crease so it stays visible with the eyes open, keep the visible lid subtly luminous and the upper liner thin, so the eyes look naturally more open without changing the eyelid.';
const BROWS = 'Brows: keep her natural eyebrows exactly as they are - same shape, arch, thickness, position and color; only lightly fill sparse spots with fine hair-like strokes so they look softly defined to match the makeup; no reshaping, lifting, extending, darkening or drawn-on look.';
const STANDARD = 'Quality standard: ' +
  'flawless realistic skin - remove visible blemishes, acne scars, wrinkles, under-eye creases and uneven patches while keeping subtle pore texture, sharp facial detail and natural dimension (never blurry, flat, waxy or plastic); ' +
  'a slightly slimmer, refined-looking nose through seamless soft contour along the sides only, keeping its natural shape (no pinched nostrils, no harsh lines, no distortion); ' +
  'a warm, luxurious bronzed complexion in every look - sun-kissed warmth suited to her natural skin tone, bronzer blended around the temples, under the cheekbones and along the jawline (never orange, muddy or too dark); the face must never come out paler, brighter, chalky or washed out compared with the original; ' +
  'beautiful blush in a flattering rose or warm pink coordinated with the lips, softly lifting the cheeks and melting into the bronzer and highlighter; ' +
  'a refined luminous highlighter for a lit-from-within glow on the upper cheekbones, with a touch on the brow bone and cupid\'s bow (no glitter, no white streaks, no oily shine); ' +
  'lipstick applied precisely across the entire visible lip surface including the corners, with clean edges and realistic texture; ' +
  'the face, neck and visible chest kept in one consistent warm tone.';
const PRESERVE = 'Preserve the person and photograph: makeup and skin retouching only. Same identity, same face shape, jaw, cheeks and features, natural skin tone and undertone, and the exact same expression - if she is smiling with teeth showing, keep the same open smile, the same teeth and the same mouth opening, never close the lips. Same hair, clothing, jewelry, glasses or sunglasses (never draw eyes over or instead of them), pose, position in the frame, background, original lighting direction, face angle and framing (no crop, no zoom, no shift). Adapt to any makeup she already wears and never paint over hair crossing the face, hands or accessories. Photorealistic with sharp fine detail. She should look exactly like herself after exceptional professional makeup.';
const LIPS_NATURAL = 'Lips: keep her natural lip size and shape exactly - lipstick only on her own lips, no lip liner outside the line, no plumping or overlining.';
const LIPS_LINED = 'Lips: a lip liner traced on, or at most a hair\'s width outside, her natural lip line and blended into the lipstick, so the lips look slightly fuller, naturally plump and more defined with exactly the same shape - expert makeup, never a lip-filler look, never puffy or swollen, no change to the shape of the mouth.';
const GLAM = {
  soft: { name: 'Soft Glam',
    short: 'softly smoky taupe and bronze eyes with champagne shimmer, thin liner, fuller longer lashes, rosy blush, bronze glow, highlighter and a medium rosy glossy lip at her natural lip size',
    look: 'SOFT GLAM - visibly glamorous, polished and luminous: a noticeable transformation with a softer touch, never barely enhanced. Softly smoky eyes in warm taupe and soft bronze with dimensional blending and a subtle champagne shimmer on the lid, elegant thin liner; a beautiful rosy blush, gentle bronze sculpting and luminous satin skin; and a medium rosy lipstick with clearly visible color (never nude, never pale or washed out), topped with a beautiful high-shine gloss.', lips: LIPS_NATURAL },
  max: { name: 'Full Glam',
    short: 'smokier bronze and espresso eyes with a more defined liner, fuller longer lashes, bronze sculpting, highlighter and a deeper rose-berry lip with a natural lip liner',
    look: 'FULL GLAM - richer, smokier and more dramatic than Soft Glam, a striking professional makeup transformation that is not simply darker: noticeably smokier eyes with richer bronze and soft espresso shadow in seamless gradients, champagne shimmer on the center of the lid and a more defined liner; more defined bronze sculpting, dimensional blush and luminous cheekbones; and a lipstick darker and richer than Soft Glam - deeper rose or rose-berry for her complexion.', lips: LIPS_LINED },
  glam: { name: 'Red Carpet',
    short: 'a bronze and chocolate smoky eye with gold shimmer and a sleek winged liner, fuller longer lashes, golden glow and a classic red lip with a natural lip liner',
    look: 'RED CARPET - sophisticated, camera-ready evening glamour with an editorial wow factor from the complete design, not just the lipstick: an elegant eye - a soft smoky gradient in bronze and deep chocolate with refined gold shimmer on the lid and a precise, sleek winged liner; elegant bronze sculpting, polished blush and a controlled golden radiance on the cheekbones; and a classic velvety red lipstick with crisp clean edges.', lips: LIPS_LINED }
};
export function simplePrompt(task, o = {}) {
  if (task !== 'glam') return null;
  const L = GLAM[o.intensity] || GLAM.glam;
  return o.style === 'men' ? 'Lightly retouch this photo: clearer even skin and neatly groomed brows. Keep everything else the same. Photorealistic.'
    : `Give ${o.target ? 'only ' + String(o.target).slice(0, 120) : o.who ? String(o.who).slice(0, 120) : 'this woman'} expensive ${L.name} makeup: ${L.short}. Makeup only - keep her eye shape and eye color, face, expression and smile, lip shape, brows, position and everything else in the photo the same${o.target ? ', and leave everyone else in the photo completely unchanged' : ''}. Photorealistic.`;
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
      if (men) {
        const L = GROOM[o.intensity] || GROOM.glam;
        p = `Retouch this man like a high-end magazine grooming artist. The result must look noticeably more polished than the original: ${L}. No visible makeup, no lipstick, no eye makeup. Keep the background, clothing and lighting unchanged.`;
        return p + ' Keep the same person with the same face, features, eyes, skin tone, hair, expression, pose, clothing and background. Photorealistic with natural skin texture.';
      }
      const L = GLAM[o.intensity] || GLAM.glam;
      const subject = o.target ? `only ${String(o.target).slice(0, 120)} (edit her face only; leave every other person in the photo exactly as they are, untouched)`
        : o.who ? String(o.who).slice(0, 120) + ' (apply the full finish to each of them, adapted to her own features)' : 'the woman in this photo';
      p = `Exceptional professional makeup and beauty retouching for ${subject}. ${L.look}${o.eyes ? ' Eyes: ' + o.eyes + '.' : ''} ${L.lips} ${LASHES} ${EYES} ${BROWS} ${STANDARD}`;
      return p + ' ' + PRESERVE;
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
