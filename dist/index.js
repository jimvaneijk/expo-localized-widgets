"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localizeWidgetProps = exports.getWidgetTranslations = exports.resolveWidgetLocale = void 0;
const normalizeLocale = (locale) => locale.trim().replaceAll('_', '-').toLowerCase();
const resolveWidgetLocale = (locale, availableLocales, fallbackLocale) => {
    const normalizedLocales = new Map(availableLocales.map((availableLocale) => [
        normalizeLocale(availableLocale),
        availableLocale,
    ]));
    const fallback = normalizedLocales.get(normalizeLocale(fallbackLocale));
    if (!fallback) {
        throw new Error(`Missing widget translations for fallback locale "${fallbackLocale}".`);
    }
    if (!locale) {
        return fallback;
    }
    const normalizedLocale = normalizeLocale(locale);
    const exactLocale = normalizedLocales.get(normalizedLocale);
    if (exactLocale) {
        return exactLocale;
    }
    const languageLocale = normalizedLocales.get(normalizedLocale.split('-')[0] ?? '');
    return languageLocale ?? fallback;
};
exports.resolveWidgetLocale = resolveWidgetLocale;
const getWidgetTranslations = (options) => {
    const widgetLocale = (0, exports.resolveWidgetLocale)(options.locale, Object.keys(options.translations), options.fallbackLocale);
    const widgetTranslations = options.translations[widgetLocale];
    if (!widgetTranslations) {
        throw new Error(`Missing widget translations for locale "${widgetLocale}".`);
    }
    return { widgetLocale, widgetTranslations };
};
exports.getWidgetTranslations = getWidgetTranslations;
const localizeWidgetProps = (props, options) => ({
    ...props,
    ...(0, exports.getWidgetTranslations)(options),
});
exports.localizeWidgetProps = localizeWidgetProps;
//# sourceMappingURL=index.js.map