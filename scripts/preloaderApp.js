import { Constants as C } from "./constants.js";

// Parent class extensions for three preload content types (scenes / audio / animations)
// Application parent class - menu in settings
export class PreloaderApp extends FormApplication {
    constructor() {
        super();
        // Since this is a parent class, tags and category == null. Tags and category values are set in extended classes
        this.category = null;
        this.tags = null
    }
      
    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            closeOnSubmit: false,
            width: 500, 
            height: 'auto',
            id: 'document-tags',
            submitOnChange: true,
            template: `modules/${C.ID}/templates/documentTagsWindow.hbs`,
            title: game.i18n.localize(`${C.ID}.window.title`),
        }

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions;
    }

    // Get scenes to preload
    // In addition to the list of scene ids from the preload list, it gives a short data for these scenes
    static getScenesToPreload() {
        const sceneIdList = game.settings.get(C.ID, "scenesBuffer");
        return { 
            ids: sceneIdList,
            info: game.scenes.filter(s => sceneIdList.includes(s.id)).map(s => ({
                name: s.name,
                active: s.active,
                navigation: s.navigation,
                navName: s.navName ?? s.navigationName ?? null,
                id: s.id,
                data: typeof s.toObject === "function" ? s.toObject() : s
            }))
        }
    }

    // Add scenes to the preload list
    // - argument can be either a string or an array of strings
    static async addScenesToPreload(idArrayOrString = []) {
        const arrayToAdd = Array.isArray(idArrayOrString) ? idArrayOrString : [idArrayOrString]
        if (arrayToAdd.length === 0 || arrayToAdd.some(i => typeof i !== "string")) return
        await game.settings.set(
            C.ID, "scenesBuffer", 
            [...game.settings.get(C.ID, "scenesBuffer"), ...arrayToAdd.filter(s => !game.settings.get(C.ID, "scenesBuffer").includes(s))]
        );
    }

    // Delete scenes from the preload list
    // - argument can be either a string or an array of strings
    static async deleteScenesToPreload(idArrayOrString = []) {
        const arrayToDelete = Array.isArray(idArrayOrString) ? idArrayOrString : [idArrayOrString]
        if (arrayToDelete.length === 0 || arrayToDelete.some(i => typeof i !== "string")) return
        await game.settings.set(
            C.ID, "scenesBuffer", 
            game.settings.get(C.ID, "scenesBuffer")?.filter(s => !arrayToDelete.includes(s))
        );
    }

    // Get audio from the preload list
    static getAudioToPreload() {
        return game.settings.get(C.ID, "audioBuffer")
    }

    // Add audio to the preload list
    // - argument can be either a string or an array of strings
    static async addAudioToPreload(PathArrayOrString = []) {
        const arrayToAdd = Array.isArray(PathArrayOrString) ? PathArrayOrString : [PathArrayOrString]
        if (arrayToAdd.length === 0 || arrayToAdd.some(i => typeof i !== "string")) return
        await game.settings.set(
            C.ID, "audioBuffer", 
            [...game.settings.get(C.ID, "audioBuffer"), ...arrayToAdd.filter(s => !game.settings.get(C.ID, "audioBuffer").includes(s))]
        );
    }

    // Delete audio from the preload list
    // - argument can be either a string or an array of strings
    static async deleteAudioToPreload(PathArrayOrString = []) {
        const arrayToDelete = Array.isArray(PathArrayOrString) ? PathArrayOrString : [PathArrayOrString]
        if (arrayToDelete.length === 0 || arrayToDelete.some(i => typeof i !== "string")) return
        await game.settings.set(
            C.ID, "audioBuffer", 
            game.settings.get(C.ID, "audioBuffer")?.filter(s => !arrayToDelete.includes(s))
        );
    }

    // Get animations from the preload list
    static getAnimationsToPreload() {
        if (!game.modules.get("sequencer")?.active) {
            ui.notifications.warn(game.i18n.localize(`${C.ID}.warning.seqNotActive`));
            return
        }
        return game.settings.get(C.ID, "animationsBuffer")
    }

    // Add animations to the preload list
    // - argument can be either a string or an array of strings
    static async addAnimationsToPreload(nameOrPathArrayOrString = []) { /* I hope I don't go to hell for naming variables like that */
        if (!game.modules.get("sequencer")?.active) {
            ui.notifications.warn(game.i18n.localize(`${C.ID}.warning.seqNotActive`));
            return
        }
        const arrayToAdd = Array.isArray(nameOrPathArrayOrString) ? nameOrPathArrayOrString : [nameOrPathArrayOrString]
        if (arrayToAdd.length === 0 || arrayToAdd.some(i => typeof i !== "string")) return
        await game.settings.set(
            C.ID, "animationsBuffer", 
            [...game.settings.get(C.ID, "animationsBuffer"), ...arrayToAdd.filter(s => !game.settings.get(C.ID, "animationsBuffer").includes(s))]
        );
    }

    // Delete animations from the preload list
    // - argument can be either a string or an array of strings
    static async deleteAnimationsToPreload(nameOrPathArrayOrString = []) {
        if (!game.modules.get("sequencer")?.active) {
            ui.notifications.warn(game.i18n.localize(`${C.ID}.warning.seqNotActive`));
            return
        }
        const arrayToDelete = Array.isArray(nameOrPathArrayOrString) ? nameOrPathArrayOrString : [nameOrPathArrayOrString]
        if (arrayToDelete.length === 0 || arrayToDelete.some(i => typeof i !== "string")) return
        await game.settings.set(
            C.ID, "animationsBuffer", 
            game.settings.get(C.ID, "animationsBuffer").filter(s => !arrayToDelete.includes(s))
        );
    }

    async _handleEnterKeypress(html, event, isDrag = false) {
        // Check the pressed key to see if it is enter
        if (event.key == "Enter" || isDrag) {
            // Get the current temporary tags from the passed options
            let currentTags = this.tags;

            // Check if the tag already exist
            if (currentTags.indexOf(event.target.value) != -1) {
                // The tag is a duplicate and cannot be inserted
                ui.notifications.warn(game.i18n.localize(`${C.ID}.warning.duplicate.${this.category}`));
            }
            else
            {
                // The tag is not a duplicate and is inserted in the current temporary tags
                currentTags.push(event.target.value);
                // Resets the value inside the input field
                event.target.value = "";

                // Render the window again to show changes and focus on the input field
                this.render();
                html[0].querySelector('input[class="tag-input"]')?.focus();
            }
        }
    }

    async _handleDeleteClick(html, event) {
        // Get clicked element
        let clickedElement = $(event.currentTarget);

        // Get the current temporary tags
        let currentTags = this.tags;
        // Remove the tag using the id of its position
        currentTags.splice(clickedElement[0].id, 1);

        // Render the window again to show changes
        this.render();
    }

    async _handleCancel() {
        // Just closes the window without saving the current temporary tags
        this.close();
    }

    async _handleSave() {
        // Saves the current temporary tags
        await game.settings.set(C.ID, `${this.category}Buffer`, this.tags);
        // Closes the window
        this.close();
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Adding a new tag from an input field when pressing Enter
        html.on('keypress', 'input[class="tag-input"]', this._handleEnterKeypress.bind(this, html));
        // Deleting a tag
        html.on('click', 'i[class="fas fa-times"]', this._handleDeleteClick.bind(this, html));
        // Buttons :P
        html.on('click', 'button[class="cancel"]', this._handleCancel.bind(this));
        html.on('click', 'button.save', this._handleSave.bind(this));

        // Preparing a JSON file for export
        const json = {
            name: `${C.ID}-${this.category}-list.json`,
            data: {
                category: this.category,
                list: this.tags
            }
        }
        // Exporting a JSON file
        html.find(".import").on('click', function (e) {
            e.preventDefault();
            const moduleListFile = JSON.stringify(json.data, null, 2);
            saveDataToFile(moduleListFile, "application/json", json.name);
        })
        // Importing a JSON file
        html.find(".export").on("click", function (e) {
            e.preventDefault();
            const input = $('<input type="file">');
            input.on("change", importListFromJSON);
            input.trigger("click");
          });

        // Drag and drop to input field
        html[0].querySelector('input[class="tag-input"]')?.focus();
        html[0].querySelector('input[class="tag-input"]').addEventListener("drop", e => {
            const data = JSON.parse(e.dataTransfer.getData("text/plain"));
            // Checking whether the dropped data type is a "Scene" if the scene preload app is used
            if (this.category == "scenes" && data.type != "Scene") {
                ui.notifications.warn(game.i18n.localize(`${C.ID}.warning.wrongId`));
                return
            }
            // Checking whether the dropped data is already in the list
            if (this.tags.includes(data.uuid.slice(data.uuid.lastIndexOf(".") + 1))) {
                ui.notifications.warn(game.i18n.localize(`${C.ID}.warning.duplicate.${this.category}`));
            } else {
                e.currentTarget.value = data.uuid.slice(data.uuid.lastIndexOf(".") + 1);
                this._handleEnterKeypress(html, e, true)
            }
        });
    }

    async _updateObject(event, formData) {
    }
}

// Parent class extensions for three preload content types (scenes / audio / animations)
export class PreloaderScenes extends PreloaderApp {
    constructor(tags) {
        super();
        this.category = 'scenes';
        this.tags = tags || foundry.utils.deepClone(game.settings.get(C.ID, "scenesBuffer"))
    }
    getData(options) {
        const data = {documentTags: [], newTags: [], guideText: game.i18n.localize(`${C.ID}.window.guideText.scenes`), category: this.category};
        this.tags.forEach(tag => {
            if (game.settings.get(C.ID, "scenesBuffer").includes(tag)) {
                data.documentTags.push(game.scenes.get(tag)?.name);
            } else {
                data.newTags.push(game.scenes.get(tag)?.name);
            }
        })
        return data;
    }
}
export class PreloaderAudio extends PreloaderApp {
    constructor(tags) {
        super();
        this.category = 'audio';
        this.tags = tags || foundry.utils.deepClone(game.settings.get(C.ID, "audioBuffer"))
    }
    getData(options) {
        const data = {documentTags: [], newTags: [], guideText: game.i18n.localize(`${C.ID}.window.guideText.audio`), category: this.category};
        this.tags.forEach(tag => {
            if (game.settings.get(C.ID, "audioBuffer").includes(tag)) {
                data.documentTags.push(tag);
            } else {
                data.newTags.push(tag);
            }
        })
        return data;
    }
}
export class PreloaderAnimations extends PreloaderApp {
    constructor(tags) {
        super();
        this.category = 'animations';
        this.tags = tags || foundry.utils.deepClone(game.settings.get(C.ID, "animationsBuffer"))
    }
    getData(options) {
        const data = {documentTags: [], newTags: [], guideText: game.i18n.localize(`${C.ID}.window.guideText.animations`), category: this.category};
        this.tags.forEach(tag => {
            if (game.settings.get(C.ID, "animationsBuffer").includes(tag)) {
                data.documentTags.push(tag);
            } else {
                data.newTags.push(tag);
            }
        })
        return data;
    }
}



// Imports a scene/audio/animation list from a JSON file.
function importListFromJSON() {
    const file = this.files[0];
    if (!file) {
        console.log("No file provided for game settings importer.");
        return;
    }

    readTextFromFile(file).then(async (result) => {
        try {
            const json = JSON.parse(result);
            const input = document.getElementById("preloader-input")
            if (json.category == input.dataset.id) {
                switch (json.category) {
                    case "scenes":
                        new PreloaderScenes(json.list).render(true);
                        break;
                    case "audio":
                        new PreloaderAudio(json.list).render(true);
                        break;
                    case "animations":
                        new PreloaderAnimations(json.list).render(true);
                        break;
                    default:
                        console.log("Could not parse import data.");
                        break;
                }
            } else {
                ui.notifications.warn(game.i18n.localize(`${C.ID}.warning.wrongCategory`));
                return;
            }
        } catch (e) {
            console.log("Could not parse import data.");
        }
    });
}

