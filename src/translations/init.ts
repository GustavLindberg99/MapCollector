import lodash from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm";
import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";

import {englishSingularTranslations} from "../translations/en.js";
import {frenchTranslations, frenchPluralTranslations, frenchSingularTranslations} from "../translations/fr.js";
import {swedishTranslations, swedishPluralTranslations, swedishSingularTranslations} from "../translations/sv.js";

export function initTranslations(): void {
    const englishTranslations = lodash.mapValues(frenchTranslations, (value, key) => key)
    const englishPluralTranslations = lodash.mapValues(frenchPluralTranslations, (value, key) => key);

    i18next.init({
        lng: window.Android?.lang() ?? document.documentElement.lang,
        resources: {
            en: {
                translation: {
                    ...englishTranslations,
                    ...lodash.mapKeys(englishSingularTranslations, (value, key) => `${key}_one`),
                    ...lodash.mapKeys(englishPluralTranslations, (value, key) => `${key}_other`)
                }
            },
            fr: {
                translation: {
                    ...frenchTranslations,
                    ...lodash.mapKeys(frenchSingularTranslations, (value, key) => `${key}_one`),
                    ...lodash.mapKeys(frenchPluralTranslations, (value, key) => `${key}_other`)
                }
            },
            sv: {
                translation: {
                    ...swedishTranslations,
                    ...lodash.mapKeys(swedishSingularTranslations, (value, key) => `${key}_one`),
                    ...lodash.mapKeys(swedishPluralTranslations, (value, key) => `${key}_other`)
                }
            }
        }
    });
}
