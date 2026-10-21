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
const KEEP_GLAM = 'She or he must stay instantly recognizable as the exact same person: identical face shape, bone structure, eye shape and color, nose, lip shape, skin tone and undertone (never lighter, never yellow or orange), same hair, same expression, same pose and framing. Photorealistic, natural skin texture with fine pores, no plastic or airbrushed doll look, no text, no extra people.';
const GLAM = {
  soft: { name: 'Soft Glam', skin: 'luminous, even and dewy with a soft glow on the high points',
    makeup: 'soft champagne and bronze eyeshadow blended into the crease, a thin brown liner hugging the upper lash line, full fluffy lashes, softly sculpted cheekbones with a rosy-peach blush and gentle highlight, brushed-up groomed brows, a rosy-nude satin lipstick filling the lips neatly to the corners' },
  glam: { name: 'Red Carpet', skin: 'flawless satin finish, smooth and even, with a radiant highlight on the cheekbones',
    makeup: 'a warm bronze smoky eye with shimmer on the lids, a sharp black winged eyeliner, voluminous luxury lash extensions, sculpted contour under the cheekbones and along the jaw, defined brows, a classic creamy red lipstick with a crisp clean lip line' },
  max: { name: 'Editorial Glam', skin: 'airbrushed-flawless yet real, with strong sculpting and a glowing highlight',
    makeup: 'a deep chocolate and gold smoky eye, dramatic voluminous lashes, sharp liner, strong contour and highlight, lifted defined brows, full glossy wine-berry lips slightly enhanced in volume' }
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
        : `Give this woman a ${L.name} makeover by a luxury celebrity makeup artist. The makeup must be clearly visible and beautiful in the final photo, like a professional beauty shoot: ${o.eyes ? o.eyes + ', ' : ''}${L.makeup}${o.lip ? ', ' + o.lip : ''}. Skin: ${L.skin}. Keep the background, clothing, hair and lighting unchanged.`;
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
