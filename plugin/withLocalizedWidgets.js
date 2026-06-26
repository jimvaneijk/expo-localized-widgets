const fs = require('fs');
const path = require('path');

const { withFinalizedMod } = require('@expo/config-plugins');
const xcode = require('xcode');

const STRING_CATALOG_FILENAME = 'Localizable.xcstrings';

const quote = (value) => `"${value}"`;
const unquote = (value) =>
    typeof value === 'string' && value.startsWith('"') && value.endsWith('"')
        ? value.slice(1, -1)
        : value;

const createStringCatalog = (sourceLanguage, localizations) => {
    if (!localizations[sourceLanguage]) {
        throw new Error(
            `Missing widget gallery localization for source locale "${sourceLanguage}".`,
        );
    }

    const sourceStrings = localizations[sourceLanguage];
    const strings = {};

    Object.entries(sourceStrings).forEach(([key, sourceValue]) => {
        if (strings[sourceValue]) {
            throw new Error(`Duplicate widget gallery source string "${sourceValue}".`);
        }

        const localizedString = {
            extractionState: 'manual',
            localizations: {},
        };

        Object.entries(localizations).forEach(([locale, translations]) => {
            const value = translations[key];

            if (typeof value !== 'string') {
                throw new Error(
                    `Missing widget gallery translation for key "${key}" in "${locale}".`,
                );
            }

            localizedString.localizations[locale] = {
                stringUnit: {
                    state: 'translated',
                    value,
                },
            };
        });

        strings[sourceValue] = localizedString;
    });

    return { sourceLanguage, strings, version: '1.0' };
};

const getTargetUuid = (project, targetName) => {
    const target = Object.entries(project.pbxNativeTargetSection()).find(
        ([key, nativeTarget]) =>
            !key.endsWith('_comment') && unquote(nativeTarget.name) === targetName,
    );

    if (!target) {
        throw new Error(`Cannot find iOS target "${targetName}" in Xcode project.`);
    }

    return target[0];
};

const getResourcesBuildPhase = (project, targetUuid) => {
    const target = project.pbxNativeTargetSection()[targetUuid];
    const buildPhases = project.hash.project.objects.PBXResourcesBuildPhase;
    const phase = target?.buildPhases?.find(
        (buildPhase) => buildPhase.comment === 'Resources' && buildPhases[buildPhase.value],
    );

    return phase ? buildPhases[phase.value] : null;
};

const ensureCatalogResource = (project, targetName, targetUuid) => {
    const targetGroupUuid = project.findPBXGroupKey({ name: targetName, path: targetName });

    if (!targetGroupUuid) {
        throw new Error(`Cannot find Xcode group for widget target "${targetName}".`);
    }

    const targetGroup = project.getPBXGroupByKey(targetGroupUuid);
    const fileReferences = project.pbxFileReferenceSection();
    const existingFileReference = Object.entries(fileReferences).find(
        ([key, fileReference]) =>
            !key.endsWith('_comment') &&
            unquote(fileReference.path) === STRING_CATALOG_FILENAME &&
            targetGroup.children.some((child) => child.value === key),
    );
    let fileReferenceUuid = existingFileReference?.[0];

    if (!fileReferenceUuid) {
        fileReferenceUuid = project.generateUuid();
        fileReferences[fileReferenceUuid] = {
            isa: 'PBXFileReference',
            includeInIndex: 1,
            lastKnownFileType: 'text.json.xcstrings',
            path: STRING_CATALOG_FILENAME,
            sourceTree: quote('<group>'),
        };
        fileReferences[`${fileReferenceUuid}_comment`] = STRING_CATALOG_FILENAME;
        targetGroup.children.push({
            value: fileReferenceUuid,
            comment: STRING_CATALOG_FILENAME,
        });
    }

    const resourcesBuildPhase = getResourcesBuildPhase(project, targetUuid);

    if (!resourcesBuildPhase) {
        throw new Error(`Cannot find Resources build phase for widget target "${targetName}".`);
    }

    const buildFiles = project.pbxBuildFileSection();
    const hasBuildFile = resourcesBuildPhase.files.some(
        (file) => buildFiles[file.value]?.fileRef === fileReferenceUuid,
    );

    if (!hasBuildFile) {
        const buildFileUuid = project.generateUuid();
        buildFiles[buildFileUuid] = {
            isa: 'PBXBuildFile',
            fileRef: fileReferenceUuid,
            fileRef_comment: STRING_CATALOG_FILENAME,
        };
        buildFiles[`${buildFileUuid}_comment`] = `${STRING_CATALOG_FILENAME} in Resources`;
        resourcesBuildPhase.files.push({
            value: buildFileUuid,
            comment: `${STRING_CATALOG_FILENAME} in Resources`,
        });
    }
};

const setWidgetLocalizations = (projectRoot, options) => {
    // expo-widgets currently fixes the target name to 'ExpoWidgetsTarget'; the option is
    // accepted here so projects require no config changes when that limitation is lifted.
    const targetName = options.targetName ?? 'ExpoWidgetsTarget';
    const sourceLanguage = options.sourceLanguage ?? 'en';
    const localizations = options.localizations ?? {};
    const iosProjectRoot = path.join(projectRoot, 'ios');
    const targetRoot = path.join(iosProjectRoot, targetName);
    const xcodeProject = fs
        .readdirSync(iosProjectRoot)
        .find((entry) => entry.endsWith('.xcodeproj'));

    if (!xcodeProject) {
        throw new Error(`Cannot find an .xcodeproj in "${iosProjectRoot}".`);
    }

    fs.mkdirSync(targetRoot, { recursive: true });
    fs.writeFileSync(
        path.join(targetRoot, STRING_CATALOG_FILENAME),
        `${JSON.stringify(createStringCatalog(sourceLanguage, localizations), null, 2)}\n`,
    );

    const xcodeProjectPath = path.join(iosProjectRoot, xcodeProject, 'project.pbxproj');
    const project = xcode.project(xcodeProjectPath);
    project.parseSync();

    const targetUuid = getTargetUuid(project, targetName);
    ensureCatalogResource(project, targetName, targetUuid);
    Object.keys(localizations).forEach((locale) => project.addKnownRegion(locale));

    fs.writeFileSync(xcodeProjectPath, project.writeSync());
};

const normalizeTargets = (options = {}) => {
    if (Array.isArray(options.targets)) {
        return options.targets.map((t) => ({
            targetName: t.targetName ?? 'ExpoWidgetsTarget',
            sourceLanguage: t.sourceLanguage ?? 'en',
            localizations: t.localizations ?? {},
        }));
    }

    return [
        {
            // expo-widgets currently fixes the target name to 'ExpoWidgetsTarget'; the option is
            // accepted here so projects require no config changes when that limitation is lifted.
            targetName: options.targetName ?? 'ExpoWidgetsTarget',
            sourceLanguage: options.sourceLanguage ?? 'en',
            localizations: options.localizations ?? {},
        },
    ];
};

const validateAgainstExpoWidgets = (targets, config) => {
    const plugins = config.plugins ?? [];
    const expoWidgetsEntry = plugins.find(
        (p) => Array.isArray(p) && p[0] === 'expo-widgets',
    );

    if (!expoWidgetsEntry) return;

    const widgetDefs = expoWidgetsEntry[1]?.widgets ?? [];

    for (const target of targets) {
        const sourceStrings = target.localizations[target.sourceLanguage];
        if (!sourceStrings) continue;

        // Match widgets to this target by name; fall back to all widgets when none match
        // (expo-widgets currently uses a single fixed target for all widgets).
        const relevantWidgets = widgetDefs.filter((w) => w.name === target.targetName);
        const widgetsToCheck = relevantWidgets.length > 0 ? relevantWidgets : widgetDefs;

        const authoritative = new Set();
        for (const w of widgetsToCheck) {
            if (typeof w.displayName === 'string') authoritative.add(w.displayName);
            if (typeof w.description === 'string') authoritative.add(w.description);
        }

        if (authoritative.size === 0) continue;

        const sourceValues = new Set(Object.values(sourceStrings));

        for (const v of sourceValues) {
            if (!authoritative.has(v)) {
                console.warn(
                    `[expo-localized-widgets] "${v}" (target "${target.targetName}", locale "${target.sourceLanguage}") ` +
                    `is not present as a displayName or description in expo-widgets config. ` +
                    `Source locale values must exactly match expo-widgets displayName and description.`,
                );
            }
        }

        for (const v of authoritative) {
            if (!sourceValues.has(v)) {
                console.warn(
                    `[expo-localized-widgets] "${v}" is configured in expo-widgets ` +
                    `(target "${target.targetName}") but has no matching source string in the "${target.sourceLanguage}" locale.`,
                );
            }
        }
    }
};

const withLocalizedWidgets = (config, options = {}) => {
    const targets = normalizeTargets(options);
    validateAgainstExpoWidgets(targets, config);

    return withFinalizedMod(config, [
        'ios',
        (modConfig) => {
            for (const target of targets) {
                setWidgetLocalizations(modConfig.modRequest.projectRoot, target);
            }
            return modConfig;
        },
    ]);
};

module.exports = withLocalizedWidgets;
module.exports.createStringCatalog = createStringCatalog;
module.exports.setWidgetLocalizations = setWidgetLocalizations;
module.exports.normalizeTargets = normalizeTargets;
module.exports.validateAgainstExpoWidgets = validateAgainstExpoWidgets;
