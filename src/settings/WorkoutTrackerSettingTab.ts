import { App, PluginSettingTab, Setting } from 'obsidian';
import WorkoutTrackerPlugin from '../plugin';
import { ExerciseTemplateSettingModal } from './ExerciseTemplateSettingModal';
import { WorkoutTemplateSettingModal } from './WorkoutTemplateSettingModal';

export class WorkoutTrackerSettingTab extends PluginSettingTab {
	plugin: WorkoutTrackerPlugin;

	constructor(app: App, plugin: WorkoutTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Workout Tracker Settings' });

		new Setting(containerEl)
			.setName('Default Workout Folder')
			.setDesc('Folder where workout files will be created')
			.addText(text => text
				.setPlaceholder('Workouts')
				.setValue(this.plugin.settings.defaultWorkoutFolder)
				.onChange(async (value) => {
					this.plugin.settings.defaultWorkoutFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Exercise Autocomplete')
			.setDesc('Show exercise suggestions when typing')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAutoComplete)
				.onChange(async (value) => {
					this.plugin.settings.enableAutoComplete = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Date Format')
			.setDesc('Format for workout dates')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

		// Exercise Templates Section
		containerEl.createEl('h3', { text: 'Exercise Templates' });
		
		const exerciseTemplatesContainer = containerEl.createDiv();
		this.renderExerciseTemplates(exerciseTemplatesContainer);

		new Setting(containerEl)
			.addButton(btn => btn
				.setButtonText('Add Exercise Template')
				.setCta()
				.onClick(() => {
					new ExerciseTemplateSettingModal(this.app, this.plugin, () => {
						this.renderExerciseTemplates(exerciseTemplatesContainer);
					}).open();
				}));

		// Workout Templates Section
		containerEl.createEl('h3', { text: 'Workout Templates' });
		
		const workoutTemplatesContainer = containerEl.createDiv();
		this.renderWorkoutTemplates(workoutTemplatesContainer);

		new Setting(containerEl)
			.addButton(btn => btn
				.setButtonText('Add Workout Template')
				.setCta()
				.onClick(() => {
					new WorkoutTemplateSettingModal(this.app, this.plugin, () => {
						this.renderWorkoutTemplates(workoutTemplatesContainer);
					}).open();
				}));
	}

	renderExerciseTemplates(container: HTMLElement) {
		container.empty();
		
		this.plugin.settings.exerciseTemplates.forEach((template, index) => {
			new Setting(container)
				.setName(template.name)
				.setDesc(`${template.type} | ${template.muscleGroups.join(', ')}`)
				.addButton(btn => btn
					.setButtonText('Remove')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.exerciseTemplates.splice(index, 1);
						await this.plugin.saveSettings();
						this.renderExerciseTemplates(container);
					}));
		});
	}

	renderWorkoutTemplates(container: HTMLElement) {
		container.empty();
		
		this.plugin.settings.workoutTemplates.forEach((template, index) => {
			new Setting(container)
				.setName(template.name)
				.setDesc(`${template.exercises.join(', ')} | ${template.estimatedDuration} min`)
				.addButton(btn => btn
					.setButtonText('Remove')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.workoutTemplates.splice(index, 1);
						await this.plugin.saveSettings();
						this.renderWorkoutTemplates(container);
					}));
		});
	}
}
