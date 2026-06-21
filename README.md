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
and `description` configured for the widget:

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
                    targetName: 'ExpoWidgetsTarget',
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

The plugin creates `Localizable.xcstrings`, adds it to the generated widget extension target and
registers each configured locale in the Xcode project. Run Expo prebuild or create a new native build
after changing gallery localizations.

## License

MIT
