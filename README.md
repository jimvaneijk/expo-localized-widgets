# expo-localized-widgets

Localization helpers for [`expo-widgets`](https://docs.expo.dev/versions/latest/sdk/widgets/) and an
Expo config plugin that localizes iOS widget gallery metadata.

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
    { count: 3 },
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

The resulting props include `widgetLocale` and `widgetTranslations`. Use the supplied strings inside
the widget and set the native locale on the root view:

```tsx
import { VStack, Text } from '@expo/ui/swift-ui';
import { environment } from '@expo/ui/swift-ui/modifiers';

const MyWidget = (props) => {
    'widget';

    return (
        <VStack modifiers={[environment({ key: 'locale', value: props.widgetLocale })]}>
            <Text>{props.widgetTranslations.title}</Text>
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
                'expo-localized-widgets/app.plugin',
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
