import { SpellCheckInfo } from "../types";

export function getSpellCheck(): SpellCheckInfo[] {
  const spellErrors: SpellCheckInfo[] = [];
  const pageText = document.body.textContent || "";

  const spellDict: Record<string, string[]> = {
    recieve: ["receive"],
    seperate: ["separate"],
    occured: ["occurred"],
    neccessary: ["necessary"],
    accomodate: ["accommodate"],
    definately: ["definitely"],
    independant: ["independent"],
    maintainence: ["maintenance"],
    existance: ["existence"],
    buisness: ["business"],
  };

  Object.entries(spellDict).forEach(([wrongWord, suggestions]) => {
    const regex = new RegExp(`\\b${wrongWord}\\b`, "gi");
    const matches = pageText.match(regex);
    if (matches) {
      matches.forEach(match => {
        const context = getWordContext(pageText, match);
        spellErrors.push({ word: match, suggestions, context });
      });
    }
  });

  return spellErrors;
}

function getWordContext(text: string, word: string): string {
  const index = text.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) return "";
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + word.length + 30);
  return text.substring(start, end).trim();
}

