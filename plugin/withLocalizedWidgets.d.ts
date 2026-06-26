import type { ConfigPlugin } from '@expo/config-plugins';

declare namespace withLocalizedWidgets {
    /** Options for a single widget extension target. */
    interface TargetOptions {
        /**
         * Name of the Xcode widget extension target.
         * @default 'ExpoWidgetsTarget'
         */
        targetName?: string;
        /**
         * IETF language tag of the source locale (e.g. `'en'`, `'nl'`).
         * Must be a key in `localizations`. The values for this locale must exactly match
         * the `displayName` and `description` set in the `expo-widgets` plugin config.
         * @default 'en'
         */
        sourceLanguage?: string;
        /** Map of IETF language tags to translation objects. Each object must contain the same keys across all locales. */
        localizations: Record<string, Record<string, string>>;
    }

    /**
     * Options accepted by the `expo-localized-widgets` config plugin.
     *
     * Flat form (single target):
     * ```ts
     * { sourceLanguage: 'en', localizations: { en: { displayName: 'Widget' }, ar: { displayName: '...' } } }
     * ```
     *
     * Array form (multiple targets):
     * ```ts
     * { targets: [{ targetName: 'WidgetA', ... }, { targetName: 'WidgetB', ... }] }
     * ```
     */
    interface WithLocalizedWidgetsOptions {
        /**
         * Localize multiple widget extension targets without registering the plugin twice.
         * When provided, the top-level `targetName`, `sourceLanguage`, and `localizations` are ignored.
         */
        targets?: TargetOptions[];
        /**
         * Name of the Xcode widget extension target (flat form only).
         * `expo-widgets` currently fixes this to `ExpoWidgetsTarget`; the option is included
         * so no config changes are needed once that limitation is lifted.
         * @default 'ExpoWidgetsTarget'
         */
        targetName?: string;
        /**
         * IETF language tag of the source locale (flat form only).
         * @default 'en'
         */
        sourceLanguage?: string;
        /** Map of IETF language tags to translation objects (flat form only). */
        localizations?: Record<string, Record<string, string>>;
    }

    /** A target config with all defaults resolved. */
    type ResolvedTarget = {
        targetName: string;
        sourceLanguage: string;
        localizations: Record<string, Record<string, string>>;
    };

    /**
     * Normalises the two accepted option shapes into a uniform array of resolved targets.
     * Accepts either the flat form or the `targets` array form. Applies all defaults.
     */
    function normalizeTargets(options?: WithLocalizedWidgetsOptions): ResolvedTarget[];

    /**
     * Cross-validates source-language strings against the `expo-widgets` plugin config.
     * Emits `console.warn` (never throws) for mismatches in both directions.
     * Silently no-ops when `expo-widgets` is absent from `config.plugins`.
     */
    function validateAgainstExpoWidgets(
        targets: ResolvedTarget[],
        config: { plugins?: unknown[] },
    ): void;

    /**
     * Builds the xcstrings catalog object for a widget extension target.
     * @throws When the source locale is missing, a translation key is absent, or source strings are duplicated.
     */
    function createStringCatalog(
        sourceLanguage: string,
        localizations: Record<string, Record<string, string>>,
    ): {
        sourceLanguage: string;
        strings: Record<string, {
            extractionState: string;
            localizations: Record<string, { stringUnit: { state: string; value: string } }>;
        }>;
        version: string;
    };

    /**
     * Writes `Localizable.xcstrings` into the widget extension target directory and wires it
     * into the Xcode project as a resource.
     */
    function setWidgetLocalizations(projectRoot: string, options: TargetOptions): void;
}

/**
 * Expo config plugin that localizes iOS widget gallery metadata (`displayName` and `description`)
 * by generating a `Localizable.xcstrings` string catalog inside the widget extension target.
 *
 * Register this plugin **after** `expo-widgets` in your app config:
 * ```ts
 * plugins: [
 *   ['expo-widgets', { widgets: [{ name: 'MyWidget', displayName: 'My Widget', ... }] }],
 *   ['expo-localized-widgets', {
 *     sourceLanguage: 'en',
 *     localizations: {
 *       en: { displayName: 'My Widget', description: 'Does something useful.' },
 *       ar: { displayName: 'ويدجتي', description: 'يفعل شيئاً مفيداً.' },
 *     },
 *   }],
 * ]
 * ```
 */
declare const withLocalizedWidgets: ConfigPlugin<withLocalizedWidgets.WithLocalizedWidgetsOptions>;

export = withLocalizedWidgets;
