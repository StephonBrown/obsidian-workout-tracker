import { App, Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin } from 'obsidian';
import { WorkoutTrackerSettings, Workout } from './types';
import { DEFAULT_SETTINGS } from './settings/defaults';
import { WorkoutFileGenerator } from './utils/workoutGenerator';
import { 
	WorkoutModal, 
	ExerciseTemplateModal, 
	QuickWorkoutModal, 
    WorkoutTypeSelectionModal
} from './modals';
import { WorkoutTrackerSettingTab } from './settings';

export default class WorkoutTrackerPlugin extends Plugin {
	settings: WorkoutTrackerSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('biceps-flexed', 'Workout Tracker', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new WorkoutTypeSelectionModal(this.app, this).open();
		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('workout-tracker-ribbon-class');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'create-new-workout',
			name: 'Create New Workout',
			callback: () => {
				new WorkoutModal(this.app, this).open();
			}
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'insert-exercise-template',
			name: 'Insert Exercise Template',
			editorCallback: (editor: Editor, context: MarkdownView | MarkdownFileInfo) => {
				if (context instanceof MarkdownView) {
					new ExerciseTemplateModal(this.app, this, editor).open();
				} else {
					new Notice('This command can only be used in a Markdown view.');
				}
			}
		});

		this.addCommand({
			id: 'quick-log-workout',
			name: 'Quick Log Workout',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new QuickWorkoutModal(this.app, this).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		this.addSettingTab(new WorkoutTrackerSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createWorkoutFile(workout: Workout): Promise<void> {
		const folder = this.settings.defaultWorkoutFolder;
		const fileName = `${workout.date} - ${workout.name}.md`;
		const filePath = `${folder}/${fileName}`;

		// Ensure the folder exists
		if (!this.app.vault.getAbstractFileByPath(folder)) {
			await this.app.vault.createFolder(folder);
		}

		const content = WorkoutFileGenerator.generateWorkoutContent(workout);
		
		try {
			await this.app.vault.create(filePath, content);
			new Notice(`Workout logged: ${fileName}`);
		} catch (error) {
			new Notice(`Error creating workout file: ${error.message}`);
		}
	}
}
