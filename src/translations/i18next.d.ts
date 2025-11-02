import i18n from "../../node_modules/i18next/index";

import {englishSingularTranslations} from "./en.js";
import {frenchTranslations, frenchPluralTranslations, frenchSingularTranslations} from "./fr.js";
import {swedishTranslations, swedishPluralTranslations, swedishSingularTranslations} from "./sv.js";

type TranslatedString =
    ((keyof typeof frenchTranslations) & (keyof typeof swedishTranslations)) |
    ((keyof typeof frenchPluralTranslations) & (keyof typeof swedishPluralTranslations)) |
    ((keyof typeof frenchSingularTranslations) & (keyof typeof swedishSingularTranslations) & (keyof typeof englishSingularTranslations));

declare const i18next: {
    readonly init: typeof i18n.init,
    t(str: TranslatedString, options?: {[option: string]: number | string}): string
};
export default i18next;
