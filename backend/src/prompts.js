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
// ---- Face Couture luxury beauty finishes (v5, owner-approved plan) ----------------------------------------------------
// Recipe behind the owner's favourite results, makeup only. Each look has its own eye: Soft Glam = soft winged liner,
// Full Glam = smoky liner + deeper lip, Red Carpet = gold shimmer lid + thin sharp liner + red lip.
// After the AI: shape check (eyes/brows/lips/face moved back to the original), subtle nose slim, blend onto the sharp original,
// and a mouth check (an open smile must stay open).
const KEEP_GLAM = 'This is a makeup-only edit. Keep the same person exactly: same face shape, same eye shape and eye size (do not enlarge, lift, widen or reshape the eyes or eyelids), exact natural eye color and iris, same brow position, same nose, same lip shape and natural lip size (lipstick only on her own lips, no plumping or overlining), the exact same expression - if she is smiling with teeth showing, keep the same open smile, the same teeth and the same mouth opening, never close the lips - same skin tone, hair, pose, clothing, jewelry, background, lighting and framing (no crop, no zoom). If she wears sunglasses or glasses, keep them exactly as they are and never draw eyes over or instead of them. Photorealistic with natural skin texture.';
export function simplePrompt(task, o = {}) {
  if (task !== 'glam') return null;
  const L = GLAM[o.intensity] || GLAM.glam;
  return o.style === 'men' ? 'Lightly retouch this photo: clearer even skin and neatly groomed brows. Keep everything else the same. Photorealistic.'
    : `Add expensive ${L.name.toLowerCase()} makeup to ${o.who ? String(o.who).slice(0, 120) : 'this woman'}: ${L.short}. Makeup only - keep her eye shape, eye color, lip size, expression and smile, glasses and everything else in the photo the same. Photorealistic.`;
}
const LUX = 'expensive high-end makeup applied by a celebrity makeup artist with luxury products: seamless blending with no harsh edges, ' +
  'a skin-like finish that looks real and expensive (even tone, visible natural skin texture, never cakey, never filtered or plastic), ' +
  'luxury lash extensions that follow her real lash line, long, full and softly separated, ' +
  'a luxury retouch of the skin: smooth away under-eye creases, fine lines and wrinkles and any under-eye darkness, remove oily shine and greasy patches, clear away blemishes, spots, redness and small scars, flawless yet still natural with fine texture (never plastic or waxy), ' +
  'warm bronzer for a sun-kissed glow and a soft matte contour along both sides of the nose so it looks slightly slimmer while staying completely natural, ';
const GLAM = {
  soft: { name: 'Soft Glam', short: 'shimmery champagne-rose eyes with a soft winged liner, full fluffy lashes, rosy blush, a soft glow and a glossy light rose-pink lip',
    skin: 'luminous, glowing and dewy, with a soft lit-from-within highlight on the cheekbones',
    makeup: LUX + 'a soft night-out glam that is clearly visible, not barely there: shimmery champagne and rose-pink eyeshadow blended into the crease, a clean soft WINGED eyeliner along the upper lashes that flicks gently outward following the natural angle of her eye (elegant and thin, not heavy), full fluffy lash extensions, a beautiful rosy-pink blush, a luminous champagne highlight on the cheekbones, softly defined brows, and a clearly visible light rose-pink lipstick (a true rose, not nude) on her natural lips, topped with a clear high-shine gloss' },
  max: { name: 'Full Glam', short: 'a soft smoky eye with smudged smoky liner, fuller lashes, bronze sculpting and a deeper rose-berry lipstick',
    skin: 'flawless, radiant and glowing like a luxury magazine cover, still real skin',
    makeup: LUX + 'a refined SMOKY eye in warm taupe, bronze and soft espresso, blended out seamlessly with no harsh edges, with a SMOKY smudged brown-black liner along the upper lash line and softly into the outer lower lash line (no sharp wing), kept light enough that the eyes look bright, fuller lash extensions, richer bronze sculpting with a satin highlight, softly defined brows, and a deeper, richer rose-berry lipstick, clearly darker than a soft glam lip, satin finish, on her natural lips' },
  glam: { name: 'Red Carpet', short: 'a gold and champagne shimmer eye with a thin sharp liner, glamorous lashes, golden glow and a classic red lip',
    skin: 'smooth satin finish with a controlled golden radiance on the cheekbones',
    makeup: LUX + 'a luminous GOLD and champagne shimmer eyeshadow on the lids with soft bronze in the crease, a thin sharp black liner hugging the upper lash line (no wing, no smoky lower liner), glamorous long separated lashes, warm bronzer and a golden highlight on the cheekbones, defined brows, and a classic creamy red lipstick with a crisp clean edge on her natural lips' }
};
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
        : `Apply ${L.name} makeup to ${o.who ? String(o.who).slice(0, 120) + ' (give every one of them the full look, each adapted to her own features and skin tone)' : 'the woman in this photo'} for a luxury beauty shoot. The makeup must be clearly visible and look expensive: ${o.eyes ? o.eyes + ', ' : ''}${L.makeup}${o.lip ? ', ' + o.lip : ''}. Skin: ${L.skin}. Do not change anything else in the photo.`;
      return p + ' ' + KEEP_GLAM;
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
