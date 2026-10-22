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
// ---- Face Couture luxury beauty finishes (v7: lashes first, exact lip shape without liner, nose kept, under-eyes smoothed) -----
// Base: the brief-verification run the owner reviewed (same wording), plus her rules: exact eye shape/colour, same face and
// expression (smiles stay open), natural lip size (liner only in Full Glam and Red Carpet, never a filler look), natural
// lightly-filled brows, fuller longer luxury lashes, slightly slimmer nose, highlighter glow, bronzed (never washed out),
// medium rosy glossy Soft Glam lip; in group photos only the selected person is edited.
const LASHES = 'LASHES (the most important part of every look): beautiful luxury lash extensions, clearly longer and fuller than in the original so the difference is obvious at a glance, as applied by a high-end lash artist - fine soft individual hairs with tapered tips, natural separation, a gentle lifted curl and a soft fluttery look, fullest toward the outer-middle, rooted exactly on her real upper lash line, with soft definition on the lower lashes; visibly glamorous yet expensive and natural, never fake: no spiky clumps, no stiff plastic look, no black strip, no lashes floating off the eye.';
const EYES = 'Eyes: do not change the eye shape at all - keep each eye\'s exact shape, size, opening, angle, spacing, gaze and her exact natural eye color and iris; never enlarge, lift, reshape or replace the eyes. Enhance them only with expertly blended shadow, refined shimmer and liner that follows the natural eyelid. For hooded eyes, place the shadow slightly above the natural crease so it stays visible with the eyes open, keep the visible lid subtly luminous and keep the liner close to the lash line, so the eyes look naturally more open without changing the eyelid.';
const BROWS = 'Brows: keep her natural eyebrows exactly as they are - same shape, arch, thickness, position and color; only lightly fill sparse spots with fine hair-like strokes so they look softly defined to match the makeup; no reshaping, lifting, extending, darkening or drawn-on look.';
const STANDARD = 'Quality standard: ' +
  'flawless realistic skin - completely smooth all under-eye creases, fine lines and wrinkles and soften under-eye darkness, and remove visible blemishes, acne scars, wrinkles and uneven patches while keeping subtle pore texture, sharp facial detail and natural dimension (never blurry, flat, waxy or plastic); ' +
  'keep her nose exactly as it is in the photo (same shape, width and size - do not slim, narrow or reshape it), with only soft natural contour shading like real makeup; ' +
  'a warm, luxurious bronzed complexion in every look - sun-kissed warmth suited to her natural skin tone, bronzer blended around the temples, under the cheekbones and along the jawline (never orange, muddy or too dark); the face must never come out paler, brighter, chalky or washed out compared with the original; ' +
  'beautiful blush in a flattering rose or warm pink coordinated with the lips, softly lifting the cheeks and melting into the bronzer and highlighter; ' +
  'a refined luminous highlighter for a lit-from-within glow on the upper cheekbones, with a touch on the brow bone and cupid\'s bow (no glitter, no white streaks, no oily shine); ' +
  'lipstick applied precisely across the entire visible lip surface including the corners, with clean edges and realistic texture; ' +
  'the face, neck and visible chest kept in one consistent warm tone.';
const PRESERVE = 'Preserve the person and photograph: makeup and skin retouching only. Same identity, same face shape, jaw, cheeks and features, natural skin tone and undertone, and the exact same expression - if she is smiling with teeth showing, keep the same open smile, the same teeth and the same mouth opening, never close the lips. Same hair, clothing, jewelry, glasses or sunglasses (never draw eyes over or instead of them), pose, position in the frame, background, original lighting direction, face angle and framing (no crop, no zoom, no shift). Adapt to any makeup she already wears and never paint over hair crossing the face, hands or accessories. Every look must read as expensive, real makeup on real skin - seamless blending, no harsh edges, nothing cartoonish, overdone or AI-looking. Photorealistic with sharp fine detail. She should look exactly like herself after exceptional professional makeup.';
const LIPS = 'Lips: keep the exact original lip shape and size - no lip liner, no overlining, no plumping, no change to the shape of the mouth; fill the lipstick completely and precisely across her entire natural lips, right into the corners, with clean natural edges.';
const GLAM = {
  soft: { name: 'Soft Glam',
    short: 'champagne-rose eyes with a soft elegant winged liner, fuller longer luxury lashes, rosy blush, bronze glow, highlighter and a medium rosy glossy lip in her exact lip shape',
    look: 'SOFT GLAM - visibly glamorous, polished and luminous, never barely enhanced. Eyes: shimmery champagne and soft rose-bronze eyeshadow blended into the crease, with a soft, elegant WINGED liner along the upper lash line that follows the natural angle of her eye, blended at the root so it looks refined rather than graphic. Cheeks: a beautiful rosy blush, gentle bronze and luminous satin skin. Lips: a medium rosy lipstick with clearly visible color (never nude, never pale), topped with a beautiful high-shine gloss.' },
  max: { name: 'Full Glam',
    short: 'a soft-focus smoky eye with smoky liner, fuller longer luxury lashes, bronze sculpting, highlighter and a deeper rose-berry lip in her exact lip shape',
    look: 'FULL GLAM - richer and more dramatic than Soft Glam, a striking professional transformation that still looks expensive and natural. Eyes: a soft-focus SMOKY eye in warm taupe, bronze and soft espresso with champagne shimmer on the center of the lid, and a SMOKY liner smudged into the upper lash line and lightly under the outer lower lashes, diffused like expensive editorial makeup, never harsh. Lashes even fuller than Soft Glam. Cheeks: more defined bronze sculpting, dimensional blush and luminous cheekbones. Lips: a deeper, richer rose-berry lipstick, darker than Soft Glam.' },
  glam: { name: 'Red Carpet',
    short: 'a bronze and gold shimmer eye with a sleek crisp winged liner, the most glamorous luxury lashes, golden glow and a classic red lip in her exact lip shape',
    look: 'RED CARPET - sophisticated, camera-ready evening glamour. Eyes: a soft bronze and deep chocolate gradient with refined gold shimmer on the lid and a precise, sleek liner with a crisp wing - polished and camera-ready, still clean and refined. The most glamorous lashes of the three looks. Cheeks: elegant bronze sculpting, polished blush and a controlled golden radiance. Lips: a classic velvety red lipstick with crisp clean edges.' }
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
      p = `Exceptional professional makeup and beauty retouching for ${subject}. ${LASHES} ${L.look}${o.eyes ? ' Eyes: ' + o.eyes + '.' : ''} ${LIPS} ${EYES} ${BROWS} ${STANDARD}`;
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
