import { translate } from '@vitalets/google-translate-api';

export async function translateToKorean(text: string): Promise<string> {
  if (!text) return text;
  try {
    const result = await translate(text, { to: 'ko' });
    return result.text;
  } catch {
    return text;
  }
}
