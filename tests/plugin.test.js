const assert = require('node:assert/strict');
const test = require('node:test');

const {
    createStringCatalog,
    normalizeTargets,
    validateAgainstExpoWidgets,
} = require('../plugin/withLocalizedWidgets');

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

// ── normalizeTargets ──────────────────────────────────────────────────────────

test('normalizeTargets: flat form produces a single target with defaults', () => {
    const targets = normalizeTargets({ localizations: { en: { displayName: 'Widget' } } });

    assert.equal(targets.length, 1);
    assert.equal(targets[0].targetName, 'ExpoWidgetsTarget');
    assert.equal(targets[0].sourceLanguage, 'en');
    assert.deepEqual(targets[0].localizations, { en: { displayName: 'Widget' } });
});

test('normalizeTargets: flat form preserves explicit targetName and sourceLanguage', () => {
    const targets = normalizeTargets({
        targetName: 'WidgetA',
        sourceLanguage: 'nl',
        localizations: { nl: { displayName: 'Widget' } },
    });

    assert.equal(targets[0].targetName, 'WidgetA');
    assert.equal(targets[0].sourceLanguage, 'nl');
});

test('normalizeTargets: targets array form produces one entry per target', () => {
    const targets = normalizeTargets({
        targets: [
            { targetName: 'WidgetA', sourceLanguage: 'en', localizations: { en: { displayName: 'A' } } },
            { targetName: 'WidgetB', sourceLanguage: 'en', localizations: { en: { displayName: 'B' } } },
        ],
    });

    assert.equal(targets.length, 2);
    assert.equal(targets[0].targetName, 'WidgetA');
    assert.equal(targets[1].targetName, 'WidgetB');
});

test('normalizeTargets: targets array entries apply defaults', () => {
    const targets = normalizeTargets({ targets: [{ localizations: { en: { displayName: 'X' } } }] });

    assert.equal(targets[0].targetName, 'ExpoWidgetsTarget');
    assert.equal(targets[0].sourceLanguage, 'en');
});

test('normalizeTargets: empty options produces one target with all defaults', () => {
    const targets = normalizeTargets();

    assert.equal(targets.length, 1);
    assert.equal(targets[0].targetName, 'ExpoWidgetsTarget');
    assert.equal(targets[0].sourceLanguage, 'en');
    assert.deepEqual(targets[0].localizations, {});
});

// ── validateAgainstExpoWidgets ────────────────────────────────────────────────

const captureWarnings = (fn) => {
    const warnings = [];
    const orig = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    try {
        fn();
    } finally {
        console.warn = orig;
    }

    return warnings;
};

test('validateAgainstExpoWidgets: no-ops when expo-widgets is absent', () => {
    const warnings = captureWarnings(() =>
        validateAgainstExpoWidgets(
            [{ targetName: 'ExpoWidgetsTarget', sourceLanguage: 'en', localizations: { en: { displayName: 'Widget' } } }],
            { plugins: [] },
        ),
    );

    assert.equal(warnings.length, 0);
});

test('validateAgainstExpoWidgets: no-ops when config has no plugins key', () => {
    const warnings = captureWarnings(() =>
        validateAgainstExpoWidgets(
            [{ targetName: 'ExpoWidgetsTarget', sourceLanguage: 'en', localizations: { en: { displayName: 'Widget' } } }],
            {},
        ),
    );

    assert.equal(warnings.length, 0);
});

test('validateAgainstExpoWidgets: no warnings when source values exactly match expo-widgets', () => {
    const warnings = captureWarnings(() =>
        validateAgainstExpoWidgets(
            [{
                targetName: 'ExpoWidgetsTarget',
                sourceLanguage: 'en',
                localizations: { en: { displayName: 'Next reservation', description: 'Counts down to your next stay.' } },
            }],
            {
                plugins: [['expo-widgets', {
                    widgets: [{ name: 'NextReservationWidget', displayName: 'Next reservation', description: 'Counts down to your next stay.' }],
                }]],
            },
        ),
    );

    assert.equal(warnings.length, 0);
});

test('validateAgainstExpoWidgets: warns when source value is absent from expo-widgets', () => {
    const warnings = captureWarnings(() =>
        validateAgainstExpoWidgets(
            [{
                targetName: 'ExpoWidgetsTarget',
                sourceLanguage: 'en',
                localizations: { en: { displayName: 'Next reservation', description: 'TYPO counts down.' } },
            }],
            {
                plugins: [['expo-widgets', {
                    widgets: [{ name: 'NextReservationWidget', displayName: 'Next reservation', description: 'Counts down to your next stay.' }],
                }]],
            },
        ),
    );

    assert.ok(warnings.some((w) => w.includes('TYPO counts down.')));
    assert.ok(warnings.some((w) => w.includes('Counts down to your next stay.')));
});

test('validateAgainstExpoWidgets: warns per target and isolates mismatches correctly', () => {
    const warnings = captureWarnings(() =>
        validateAgainstExpoWidgets(
            [
                {
                    targetName: 'WidgetA',
                    sourceLanguage: 'en',
                    localizations: { en: { displayName: 'A correct', description: 'A wrong' } },
                },
                {
                    targetName: 'WidgetB',
                    sourceLanguage: 'en',
                    localizations: { en: { displayName: 'B correct', description: 'B correct desc' } },
                },
            ],
            {
                plugins: [['expo-widgets', {
                    widgets: [
                        { name: 'WidgetA', displayName: 'A correct', description: 'A description' },
                        { name: 'WidgetB', displayName: 'B correct', description: 'B correct desc' },
                    ],
                }]],
            },
        ),
    );

    assert.ok(warnings.some((w) => w.includes('A wrong') && w.includes('WidgetA')));
    assert.ok(warnings.some((w) => w.includes('A description') && w.includes('WidgetA')));
    assert.equal(warnings.filter((w) => w.includes('WidgetB')).length, 0);
});
