import {
  App,
  Editor,
  EventRef,
  MarkdownFileInfo,
  MarkdownView,
  Notice,
  Plugin,
  TFile,
} from "obsidian";
import { WorkoutTrackerSettings, Workout } from "./types";
import { DEFAULT_SETTINGS } from "./settings/defaults";
import { WorkoutFileService } from "./utils/workoutFileService";
import {
  WorkoutModal,
  ExerciseTemplateModal,
  QuickWorkoutModal,
  WorkoutTypeSelectionModal,
  WorkoutStatsModal,
  WorkoutEditModal,
} from "./modals";
import { WorkoutTrackerSettingTab } from "./settings";

export default class WorkoutTrackerPlugin extends Plugin {
  settings: WorkoutTrackerSettings;
  fileService: WorkoutFileService;
  private fileModifyEventRef: EventRef | undefined;
  // A map that holds timouts for each file to debounce sync operations
  private syncTimeouts: Map<string, NodeJS.Timeout> = new Map();

  async onload() {
    await this.loadSettings();

    // Initialize file service
    this.fileService = new WorkoutFileService(
      this.app,
      this.settings.defaultWorkoutFolder
    );

    // Register file modification event handler for workout files
    this.fileModifyEventRef = this.app.vault.on(
      "modify",
      this.handleFileModify.bind(this)
    );
    this.registerEvent(this.fileModifyEventRef);

    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon(
      "biceps-flexed",
      "Workout Tracker",
      (evt: MouseEvent) => {
        // Called when the user clicks the icon.
        new WorkoutTypeSelectionModal(this.app, this).open();
      }
    );

    // Perform additional things with the ribbon
    ribbonIconEl.addClass("workout-tracker-ribbon-class");

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: "create-new-workout",
      name: "Create New Workout",
      callback: () => {
        new WorkoutModal(this.app, this).open();
      },
    });

    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: "insert-exercise-template",
      name: "Insert Exercise Template",
      editorCallback: (
        editor: Editor,
        context: MarkdownView | MarkdownFileInfo
      ) => {
        if (context instanceof MarkdownView) {
          new ExerciseTemplateModal(this.app, this, editor).open();
        } else {
          new Notice("This command can only be used in a Markdown view.");
        }
      },
    });

    this.addCommand({
      id: "quick-log-workout",
      name: "Quick Log Workout",
      checkCallback: (checking: boolean) => {
        // Conditions to check
        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new QuickWorkoutModal(this.app, this).open();
          }

          // This command will only show up in Command Palette when the check function returns true
          return true;
        }
      },
    });

    this.addCommand({
      id: "view-workout-statistics",
      name: "View Workout Statistics",
      callback: () => {
        new WorkoutStatsModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "edit-current-workout",
      name: "Edit Current Workout",
      checkCallback: (checking: boolean) => {
        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView && markdownView.file) {
          if (!checking) {
            this.editWorkoutFile(markdownView.file);
          }
          return true;
        }
      },
    });

    this.addSettingTab(new WorkoutTrackerSettingTab(this.app, this));
  }

  onunload() {
    // Clean up event handlers
    if (this.fileModifyEventRef) {
      this.app.vault.offref(this.fileModifyEventRef);
    }

    // Clear any pending sync timeouts
    this.syncTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.syncTimeouts.clear();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // Update file service if it exists
    if (this.fileService) {
      this.fileService = new WorkoutFileService(
        this.app,
        this.settings.defaultWorkoutFolder
      );
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async createWorkoutFile(workout: Workout): Promise<void> {
    try {
      await this.fileService.saveWorkout(workout);
    } catch (error) {
      new Notice(`Error creating workout file: ${error.message}`);
    }
  }

  async editWorkoutFile(file: TFile): Promise<void> {
    try {
      const workout = await this.fileService.loadWorkout(file);
      if (workout) {
        new WorkoutEditModal(this.app, this, file, workout).open();
      } else {
        new Notice("This file does not contain valid workout data");
      }
    } catch (error) {
      new Notice(`Error loading workout file: ${error.message}`);
    }
  }

  /**
   * Handle file modification events for workout files with debouncing
   */
  private handleFileModify(file: TFile): void {
    // Check if auto-sync is enabled
    if (!this.settings.enableAutoSyncFrontmatter) {
      return;
    }

    // Only process markdown files
    if (file.extension !== "md") {
      return;
    }

    // Clear existing timeout for this file
    const existingTimeout = this.syncTimeouts.get(file.path);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set a new timeout to sync after user stops typing
    const timeout = setTimeout(async () => {
      try {
        // Check if this is a workout file
        const isWorkout = await this.fileService.isWorkoutFile(file);
        if (!isWorkout) {
          return;
        }

        // Sync frontmatter with file content
        const wasUpdated = await this.fileService.syncFrontmatterWithContent(
          file
        );
        if (wasUpdated) {
          console.log(`Auto-synced frontmatter for: ${file.path}`);
        }
      } catch (error) {
        console.error(`Error syncing frontmatter for ${file.path}:`, error);
      } finally {
        // Remove the timeout from the map
        this.syncTimeouts.delete(file.path);
      }
    }, this.settings.autoSyncDelayMs); // Use configurable delay

    this.syncTimeouts.set(file.path, timeout);
  }
}
