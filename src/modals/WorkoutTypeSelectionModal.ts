import WorkoutTrackerPlugin from "main";
import { App, Modal, Setting } from "obsidian";
import { WorkoutModal } from "./WorkoutModal";
import { QuickWorkoutModal } from "./QuickWorkoutModal";

export class WorkoutTypeSelectionModal extends Modal {
        plugin: WorkoutTrackerPlugin;
        constructor(app: App, plugin:WorkoutTrackerPlugin){
            super(app);
            this.plugin = plugin;
        }

        onOpen(): void {
            const {contentEl} = this;
            contentEl.empty();

            contentEl.createEl("h2", {text: "What type of workout would you like to log?"});
            new Setting(contentEl)
                .addButton(btn => btn
                    .setButtonText('Log New Workout')
                    .onClick(() => {
                        this.close()
                        new WorkoutModal(this.app, this.plugin).open();
                    }));

            new Setting(contentEl)
                .addButton(btn => btn
                    .setButtonText('Log A Quick Workout')
                    .onClick(() => {
                        this.close()
                        new QuickWorkoutModal(this.app, this.plugin).open();
                    }));
        }

        onClose(): void {
            const {contentEl} = this;
            contentEl.empty();
        }
}