import WorkoutTrackerPlugin from "main";
import { App, Modal, Setting } from "obsidian";
import { WorkoutModal } from "./WorkoutModal";
import { QuickWorkoutModal } from "./QuickWorkoutModal";
import { WorkoutStatsModal } from "./WorkoutStatsModal";

export class WorkoutTypeSelectionModal extends Modal {
  plugin: WorkoutTrackerPlugin;
  constructor(app: App, plugin: WorkoutTrackerPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Workout Tracker" });

    new Setting(contentEl)
      .setName("Add New Workout")
      .setDesc("Create a detailed workout with multiple exercises")
      .addButton((btn) =>
        btn.setButtonText("Add Workout").onClick(() => {
          this.close();
          new WorkoutModal(this.app, this.plugin).open();
        })
      );

    new Setting(contentEl)
      .setName("Quick Workout")
      .setDesc("Log a workout using a template")
      .addButton((btn) =>
        btn.setButtonText("Quick Log").onClick(() => {
          this.close();
          new QuickWorkoutModal(this.app, this.plugin).open();
        })
      );

    new Setting(contentEl)
      .setName("View Statistics")
      .setDesc("See your workout progress and statistics")
      .addButton((btn) =>
        btn.setButtonText("View Stats").onClick(() => {
          this.close();
          new WorkoutStatsModal(this.app, this.plugin).open();
        })
      );
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
