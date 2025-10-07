import { Constants as C } from "./constants.js";
import { PreloaderScenes, PreloaderAudio, PreloaderAnimations, PreloaderApp } from "./preloaderApp.js";

const assetExists = typeof srcExists === "function"
    ? srcExists
    : async (path) => {
        if (typeof foundry?.utils?.fileExists !== "function") return false;
        try {
            return await foundry.utils.fileExists(path, { strict: false });
        } catch (error) {
            console.warn(`Preloader | Failed to verify asset at ${path}`, error);
            return false;
        }
    };

const preloadAudio = (() => {
    if (typeof AudioHelper?.preloadSound === "function") return (src) => AudioHelper.preloadSound(src);
    if (typeof AudioHelper?.preload === "function") return async (src) => {
        try {
            return await AudioHelper.preload({ src });
        } catch (error) {
            console.warn(`Preloader | Failed to preload audio using object signature for ${src}`, error);
            return AudioHelper.preload(src);
        }
    };
    return null;
})();

Hooks.once('ready', async function() {

    // Scenes settings menu register
    game.settings.registerMenu(C.ID, game.i18n.localize(`${C.ID}.settings.scenes.settingName`), {
        name: game.i18n.localize(`${C.ID}.settings.scenes.name`),
        label: game.i18n.localize(`${C.ID}.settings.scenes.label`),
        hint: game.i18n.localize(`${C.ID}.settings.scenes.hint`),
        type: PreloaderScenes,
        restricted: true
    });

    // Audio settings menu register
    game.settings.registerMenu(C.ID, game.i18n.localize(`${C.ID}.settings.audio.settingName`), {
        name: game.i18n.localize(`${C.ID}.settings.audio.name`),
        label: game.i18n.localize(`${C.ID}.settings.audio.label`),
        hint: game.i18n.localize(`${C.ID}.settings.audio.hint`),
        type: PreloaderAudio,
        restricted: true
    });

    // Animations settings menu register
    if (game.modules.get("sequencer")?.active) {
        game.settings.registerMenu(C.ID, game.i18n.localize(`${C.ID}.settings.animations.settingName`), {
            name: game.i18n.localize(`${C.ID}.settings.animations.name`),
            label: game.i18n.localize(`${C.ID}.settings.animations.label`),
@@ -60,69 +85,86 @@ Hooks.once('ready', async function() {
    });

    // Register global module functions
    globalThis[C.API_ID] = {
        getScenesToPreload: PreloaderApp.getScenesToPreload,
        addScenesToPreload: PreloaderApp.addScenesToPreload,
        deleteScenesToPreload: PreloaderApp.deleteScenesToPreload,
        getAudioToPreload: PreloaderApp.getAudioToPreload,
        addAudioToPreload: PreloaderApp.addAudioToPreload,
        deleteAudioToPreload: PreloaderApp.deleteAudioToPreload,
    };

    // + register global module functions for sequencer, if sequencer is active
    if (game.modules.get("sequencer")?.active) {
        globalThis[C.API_ID] = { 
            ...globalThis[C.API_ID],
            getAnimationsToPreload: PreloaderApp.getAnimationsToPreload,
            addAnimationsToPreload: PreloaderApp.addAnimationsToPreload,
            deleteAnimationsToPreload: PreloaderApp.deleteAnimationsToPreload
        }
    }

    // Preload scenes
    let sceneShowError = true
    for (let sceneId of game.settings.get(C.ID, "scenesBuffer")) {
        const scene = game.scenes.get(sceneId);
        if (scene) {
            if (typeof scene.preload === "function") {
                try {
                    await (scene.preload.length ? scene.preload(true) : scene.preload());
                    continue;
                } catch (error) {
                    console.warn(`Preloader | Scene preload failed for ${sceneId} via document method`, error);
                }
            }
            if (typeof game.scenes.preload === "function") {
                await game.scenes.preload(sceneId, true);
            }
        } else {
            if (sceneShowError) {
                sceneShowError = false
                ui.notifications.error(game.i18n.localize(`${C.ID}.error.scenes.uiError`));
                console.log(game.i18n.localize(`${C.ID}.error.scenes.consoleText1`))
                console.log(game.i18n.localize(`${C.ID}.error.scenes.consoleText2`))
                console.log(game.i18n.localize(`${C.ID}.error.scenes.consoleText3`))
            }
            console.log(game.i18n.localize(`${C.ID}.error.scenes.consoleText4-1`), sceneId, game.i18n.localize(`${C.ID}.error.scenes.consoleText4-2`))
        }
    }

    // Preload audio
    let audioShowError = true
    for (let sound of game.settings.get(C.ID, "audioBuffer")) {
        if (await assetExists(sound)) {
            if (preloadAudio) {
                try {
                    await preloadAudio(sound)
                } catch (error) {
                    console.error(`Preloader | Failed to preload audio ${sound}`, error);
                }
            }
        } else {
            if (audioShowError) {
                audioShowError = false
                ui.notifications.error(game.i18n.localize(`${C.ID}.error.audio.uiError`));
                console.log(game.i18n.localize(`${C.ID}.error.audio.consoleText1`))
                console.log(game.i18n.localize(`${C.ID}.error.audio.consoleText2`))
                console.log(game.i18n.localize(`${C.ID}.error.audio.consoleText3`))
            }
            console.log(game.i18n.localize(`${C.ID}.error.audio.consoleText4-1`), sound, game.i18n.localize(`${C.ID}.error.audio.consoleText4-2`))
        }
    }
});

Hooks.once("sequencerEffectManagerReady", async () => {
    // preload animations (and other files), if sequencer is active
    if (game.modules.get("sequencer")?.active) {
        const animations = game.settings.get(C.ID, "animationsBuffer")

        try {
            await Sequencer.Preloader.preload(animations, true)
        } catch (error) {
            ui.notifications.error(game.i18n.localize(`${C.ID}.error.sequencer.uiError`));
            console.log(game.i18n.localize(`${C.ID}.error.sequencer.consoleText1`))
            console.log(game.i18n.localize(`${C.ID}.error.sequencer.consoleText2`))
            console.log(game.i18n.localize(`${C.ID}.error.sequencer.consoleText3`))
