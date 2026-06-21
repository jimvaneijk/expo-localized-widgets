export type WidgetTranslations = Record<string, string>;

export type WidgetTranslationsByLocale<TTranslations extends WidgetTranslations> = Record<
    string,
    TTranslations
>;

export type LocalizedWidgetProps<TTranslations extends WidgetTranslations> = {
    widgetLocale: string;
    widgetTranslations: TTranslations;
};

export type LocalizeWidgetPropsOptions<TTranslations extends WidgetTranslations> = {
    locale: string | null | undefined;
    fallbackLocale: string;
    translations: WidgetTranslationsByLocale<TTranslations>;
};

const normalizeLocale = (locale: string) => locale.trim().replaceAll('_', '-').toLowerCase();

export const resolveWidgetLocale = (
    locale: string | null | undefined,
    availableLocales: readonly string[],
    fallbackLocale: string,
) => {
    const normalizedLocales = new Map(
        availableLocales.map((availableLocale) => [
            normalizeLocale(availableLocale),
            availableLocale,
        ]),
    );
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

export const getWidgetTranslations = <TTranslations extends WidgetTranslations>(
    options: LocalizeWidgetPropsOptions<TTranslations>,
): LocalizedWidgetProps<TTranslations> => {
    const widgetLocale = resolveWidgetLocale(
        options.locale,
        Object.keys(options.translations),
        options.fallbackLocale,
    );
    const widgetTranslations = options.translations[widgetLocale];

    if (!widgetTranslations) {
        throw new Error(`Missing widget translations for locale "${widgetLocale}".`);
    }

    return { widgetLocale, widgetTranslations };
};

export const localizeWidgetProps = <
    TProps extends object,
    TTranslations extends WidgetTranslations,
>(
    props: TProps,
    options: LocalizeWidgetPropsOptions<TTranslations>,
): TProps & LocalizedWidgetProps<TTranslations> => ({
    ...props,
    ...getWidgetTranslations(options),
});
