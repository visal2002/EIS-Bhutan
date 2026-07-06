// src/utils/string.js
/**
 * Takes a name string and returns uppercase initials.
 * e.g. "Light Commercial Vehicle" → "LCV"
 *      "Thin Film"                → "TF"
 *      "Monocrystalline"          → "MCR" (first 3 consonants or chars)
 */
export function generateCode(name = '') {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) {
        // Single word: take first 3 consonants or first 3 chars
        return words[0].replace(/[aeiou]/gi, '').slice(0, 3).toUpperCase()
            || words[0].slice(0, 3).toUpperCase();
    }
    // Multiple words: take first letter of each word
    return words.map(w => w[0]).join('').toUpperCase();
}
