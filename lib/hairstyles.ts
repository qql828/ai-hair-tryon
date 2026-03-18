export interface Hairstyle {
  id: string;
  name: string;
  emoji: string;
  prompt: string;
  negativePrompt: string;
}

export const HAIRSTYLES: Hairstyle[] = [
  {
    id: "korean-air-bangs",
    name: "韩式空气刘海",
    emoji: "🌸",
    prompt: "Trendy Korean style air bangs, shoulder-length straight hair, silky smooth texture, natural black color",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "hk-retro-waves",
    name: "复古港风卷发",
    emoji: "💫",
    prompt: "90s Hong Kong style thick wavy hair, high volume, glossy dark brown, vintage glamour",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "professional-pixie",
    name: "职场干练短发",
    emoji: "💼",
    prompt: "Professional pixie cut, dark hair, sleek styling, clean neckline, modern business look",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "blonde-waves",
    name: "金发大波浪",
    emoji: "✨",
    prompt: "Glamorous long blonde wavy hair, shiny texture, beach waves, voluminous",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "bob-cut",
    name: "时尚波波头",
    emoji: "🎀",
    prompt: "Chic bob cut, chin-length, sleek and straight, glossy black hair, modern style",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "long-straight",
    name: "顺直长发",
    emoji: "🌿",
    prompt: "Long straight silky hair, flowing down to waist, natural black, healthy shine",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "curly-afro",
    name: "自然卷蓬松",
    emoji: "🌀",
    prompt: "Natural curly afro hair, voluminous, defined curls, rich dark brown",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "french-braid",
    name: "法式编发",
    emoji: "🎗️",
    prompt: "Elegant French braid hairstyle, neat and polished, chestnut brown hair",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "pink-short",
    name: "粉色短发",
    emoji: "🌷",
    prompt: "Trendy pastel pink short hair, textured layers, edgy modern style",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "silver-wolf",
    name: "银灰狼系",
    emoji: "🐺",
    prompt: "Cool silver gray wolf cut hair, layered shaggy style, modern edgy look",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "high-ponytail",
    name: "高马尾",
    emoji: "🏃",
    prompt: "Sleek high ponytail, smooth and tight, glossy black hair, sporty elegant",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
  {
    id: "messy-bun",
    name: "慵懒丸子头",
    emoji: "☁️",
    prompt: "Casual messy bun updo, loose strands framing face, effortless chic style",
    negativePrompt: "ugly, deformed, blurry, bad anatomy",
  },
];
