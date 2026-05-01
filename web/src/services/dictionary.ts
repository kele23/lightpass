import { ref } from 'vue';
import en from '../locales/en.json' with { type: 'json' };
import it from '../locales/it.json' with { type: 'json' };

const dictionaries: Record<string, Record<string, string>> = {
    en,
    it
};

const currentLang = ref('en');

if (typeof navigator !== 'undefined') {
    const lang = navigator.language.split('-')[0];
    if (dictionaries[lang]) {
        currentLang.value = lang;
    }
}

export const _t = (label: string, ...placeholders: string[]) => {
    let translated = dictionaries[currentLang.value]?.[label] || dictionaries['en']?.[label] || label;
    
    if (!placeholders || placeholders.length == 0) return translated;
    return translated.replace(/{([0-9]+)}/g, function (match, index) {
        return typeof placeholders[index] === 'undefined' ? match : placeholders[index];
    });
};
