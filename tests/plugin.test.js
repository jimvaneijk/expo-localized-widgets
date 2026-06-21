const assert = require('node:assert/strict');
const test = require('node:test');

const { createStringCatalog } = require('../plugin/withLocalizedWidgets');

test('creates a string catalog keyed by source strings', () => {
    const catalog = createStringCatalog('en', {
        en: {
            displayName: 'Next reservation',
            description: 'Counts down to your next stay.',
        },
        ar: {
            displayName: 'الحجز القادم',
            description: 'يعرض العد التنازلي لإقامتك القادمة.',
        },
    });

    assert.equal(catalog.sourceLanguage, 'en');
    assert.equal(
        catalog.strings['Next reservation'].localizations.ar.stringUnit.value,
        'الحجز القادم',
    );
});

test('rejects incomplete localizations', () => {
    assert.throws(
        () =>
            createStringCatalog('en', {
                en: { displayName: 'Next reservation' },
                ar: {},
            }),
        /Missing widget gallery translation for key "displayName" in "ar"/,
    );
});

test('rejects duplicate source strings', () => {
    assert.throws(
        () =>
            createStringCatalog('en', {
                en: { displayName: 'Widget', description: 'Widget' },
            }),
        /Duplicate widget gallery source string "Widget"/,
    );
});
