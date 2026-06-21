export type WidgetTranslations = Record<string, string>;
export type WidgetTranslationsByLocale<TTranslations extends WidgetTranslations> = Record<string, TTranslations>;
export type LocalizedWidgetProps<TTranslations extends WidgetTranslations> = {
    widgetLocale: string;
    widgetTranslations: TTranslations;
};
export type LocalizeWidgetPropsOptions<TTranslations extends WidgetTranslations> = {
    locale: string | null | undefined;
    fallbackLocale: string;
    translations: WidgetTranslationsByLocale<TTranslations>;
};
export declare const resolveWidgetLocale: (locale: string | null | undefined, availableLocales: readonly string[], fallbackLocale: string) => string;
export declare const getWidgetTranslations: <TTranslations extends WidgetTranslations>(options: LocalizeWidgetPropsOptions<TTranslations>) => LocalizedWidgetProps<TTranslations>;
export declare const localizeWidgetProps: <TProps extends object, TTranslations extends WidgetTranslations>(props: TProps, options: LocalizeWidgetPropsOptions<TTranslations>) => TProps & LocalizedWidgetProps<TTranslations>;
//# sourceMappingURL=index.d.ts.map