# expo-localized-widgets

Localization helpers for [`expo-widgets`](https://docs.expo.dev/versions/latest/sdk/widgets/) and an
Expo config plugin that localizes iOS widget gallery metadata.

> [!NOTE]
> This is an independent community package. It is not created, maintained or endorsed by Expo or
> Software Mansion.

This package fills the localization gap around `expo-widgets`: it provides a small runtime helper
for passing the active app language and translations to a widget, plus a config plugin for
localizing the widget name and description shown in the iOS widget gallery.

It is RTL-ready. Passing the resolved locale into SwiftUI's native environment enables
locale-aware rendering for languages such as Arabic, including right-to-left layout where supported
by the native components.

## Compatibility and versioning

Package majors follow Expo SDK majors:

| Package | Expo SDK | expo-widgets |
| ------- | -------- | ------------ |
| 56.x    | 56.x     | 56.x         |

Breaking package changes within the same Expo SDK line use the minor version. Fixes use the patch
version.

## Installation

```bash
npx expo install expo-widgets
npm install expo-localized-widgets
```

`expo-widgets` is currently iOS-only, requires a development build and is not available in Expo Go.

## Localize widget content

The runtime helper is independent of i18next or any other localization library:

```ts
import { localizeWidgetProps } from 'expo-localized-widgets';

const props = localizeWidgetProps(
    { reservationCount: 3 },
    {
        locale: i18n.resolvedLanguage,
        fallbackLocale: 'en',
        translations: {
            en: { title: 'Next stay' },
            ar: { title: 'الإقامة القادمة' },
        },
    },
);

MyWidget.updateSnapshot(props);
```

The first argument contains your existing widget data. In this example, `reservationCount` is an
app-specific value that the widget can render; the localization helper preserves it unchanged and
adds `widgetLocale` and `widgetTranslations` to the resulting props.

Use the supplied strings inside the widget and set the native locale on the root view. This also
lets native components apply the appropriate text direction for RTL locales:

```tsx
import { VStack, Text } from '@expo/ui/swift-ui';
import { environment } from '@expo/ui/swift-ui/modifiers';

const MyWidget = (props) => {
    'widget';

    return (
        <VStack modifiers={[environment({ key: 'locale', value: props.widgetLocale })]}>
            <Text>{props.widgetTranslations.title}</Text>
            <Text>{props.reservationCount}</Text>
        </VStack>
    );
};
```

Write a new snapshot or timeline whenever the app language changes.

## Localize widget gallery metadata

Register the plugin after `expo-widgets`. Source locale values must exactly match the `displayName`
and `description` configured for the widget. The plugin warns at prebuild time when it detects a
mismatch between the source strings and the `expo-widgets` config.

```ts
export default {
    expo: {
        plugins: [
            [
                'expo-widgets',
                {
                    widgets: [
                        {
                            name: 'NextReservationWidget',
                            displayName: 'Next reservation',
                            description: 'Counts down to your next stay.',
                            supportedFamilies: ['systemSmall'],
                        },
                    ],
                },
            ],
            [
                'expo-localized-widgets',
                {
                    sourceLanguage: 'en',
                    localizations: {
                        en: {
                            displayName: 'Next reservation',
                            description: 'Counts down to your next stay.',
                        },
                        ar: {
                            displayName: 'الحجز القادم',
                            description: 'يعرض العد التنازلي لإقامتك القادمة.',
                        },
                    },
                },
            ],
        ],
    },
};
```

When you have more than one widget extension target, pass a `targets` array instead of repeating
the plugin registration:

```ts
[
    'expo-localized-widgets',
    {
        targets: [
            {
                targetName: 'ExpoWidgetsTarget',
                sourceLanguage: 'en',
                localizations: {
                    en: { displayName: 'Next reservation', description: 'Counts down to your next stay.' },
                    ar: { displayName: 'الحجز القادم', description: 'يعرض العد التنازلي لإقامتك القادمة.' },
                },
            },
            {
                targetName: 'StatsWidgetTarget',
                sourceLanguage: 'en',
                localizations: {
                    en: { displayName: 'Trip stats', description: 'Shows your travel summary.' },
                    ar: { displayName: 'إحصائيات الرحلة', description: 'يعرض ملخص رحلاتك.' },
                },
            },
        ],
    },
]
```

The plugin creates `Localizable.xcstrings`, adds it to the generated widget extension target and
registers each configured locale in the Xcode project. Run Expo prebuild or create a new native build
after changing gallery localizations.

## Configuration reference

### Config plugin options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `targets` | `TargetOptions[]` | — | Array of per-target configs. Use this when you have more than one widget extension target. When provided, the top-level `targetName`, `sourceLanguage`, and `localizations` are ignored. |
| `targetName` | `string` | `'ExpoWidgetsTarget'` | (Flat form only.) Name of the Xcode widget extension target. `expo-widgets` currently fixes this to `ExpoWidgetsTarget`; the option is accepted so no config changes are needed once that limitation is lifted. |
| `sourceLanguage` | `string` | `'en'` | (Flat form only.) IETF language tag of the source locale. Must be a key in `localizations`. The values for this locale must exactly match the `displayName` and `description` in the `expo-widgets` config. |
| `localizations` | `object` | — | (Flat form only.) **Required.** A map of IETF language tags to translation objects. Each translation object must contain the same keys across all locales. |

**`TargetOptions`** (each entry in the `targets` array):

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `targetName` | `string` | `'ExpoWidgetsTarget'` | Name of the Xcode widget extension target. |
| `sourceLanguage` | `string` | `'en'` | IETF language tag of the source locale. Must be a key in `localizations`. |
| `localizations` | `object` | — | **Required.** A map of IETF language tags to translation objects. Each translation object must contain the same keys across all locales. |

### `localizeWidgetProps(props, options)`

Merges your widget data with the resolved locale and translations. Returns `props` extended with
`widgetLocale` and `widgetTranslations`.

| Option | Type | Description |
| --- | --- | --- |
| `locale` | `string \| null \| undefined` | The user's current locale (e.g. `i18n.resolvedLanguage`). Falls back to `fallbackLocale` when `null` or `undefined`. Accepts both `en-US` and `en_US` forms. |
| `fallbackLocale` | `string` | **Required.** Locale used when `locale` is missing or cannot be matched to an entry in `translations`. |
| `translations` | `object` | **Required.** A map of locale → `Record<string, string>`. |

### `getWidgetTranslations(options)`

Same signature as the options above. Returns `{ widgetLocale, widgetTranslations }` without merging
into existing props. Useful when you need the resolved values separately.

### `resolveWidgetLocale(locale, availableLocales, fallbackLocale)`

Low-level helper that picks the best match for `locale` from `availableLocales`. Tries an exact
match first, then a language-only match (e.g. `en-US` → `en`), then falls back to
`fallbackLocale`. Throws when `fallbackLocale` is not in `availableLocales`.

## License

MIT

