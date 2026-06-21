const assert = require('node:assert/strict');
const test = require('node:test');

const { getWidgetTranslations, localizeWidgetProps, resolveWidgetLocale } = require('../dist');

const translations = {
    en: { title: 'Next stay' },
    ar: { title: 'الإقامة القادمة' },
};

test('resolves exact locales and language variants', () => {
    assert.equal(resolveWidgetLocale('ar', ['en', 'ar'], 'en'), 'ar');
    assert.equal(resolveWidgetLocale('ar-SA', ['en', 'ar'], 'en'), 'ar');
});

test('falls back for unsupported and missing locales', () => {
    assert.equal(resolveWidgetLocale('nl-NL', ['en', 'ar'], 'en'), 'en');
    assert.equal(resolveWidgetLocale(undefined, ['en', 'ar'], 'en'), 'en');
});

test('requires translations for the fallback locale', () => {
    assert.throws(
        () => resolveWidgetLocale('ar', ['ar'], 'en'),
        /Missing widget translations for fallback locale "en"/,
    );
});

test('adds localized values to arbitrary widget props', () => {
    assert.deepEqual(
        localizeWidgetProps({ count: 2 }, { locale: 'ar-SA', fallbackLocale: 'en', translations }),
        {
            count: 2,
            widgetLocale: 'ar',
            widgetTranslations: translations.ar,
        },
    );
});

test('returns translations with their resolved locale', () => {
    assert.deepEqual(getWidgetTranslations({ locale: 'nl', fallbackLocale: 'en', translations }), {
        widgetLocale: 'en',
        widgetTranslations: translations.en,
    });
});
