import { App, Modal, Notice, Setting } from 'obsidian';
import { WorkoutTemplate } from '../types';
import WorkoutTrackerPlugin from '../plugin';

export class WorkoutTemplateSettingModal extends Modal {
	plugin: WorkoutTrackerPlugin;
	template: WorkoutTemplate;
	onSave: () => void;

	constructor(app: App, plugin: WorkoutTrackerPlugin, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.onSave = onSave;
		this.template = {
			name: '',
			exercises: [],
			estimatedDuration: 60
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Add Workout Template" });

		new Setting(contentEl)
			.setName('Template Name')
			.addText(text => text
				.setPlaceholder('Push Day')
				.onChange(async (value) => {
					this.template.name = value;
				}));

		new Setting(contentEl)
			.setName('Exercises (comma-separated)')
			.setDesc('List exercise names that are part of this workout')
			.addTextArea(text => text
				.setPlaceholder('Bench Press, Push-up, Shoulder Press')
				.onChange(async (value) => {
					this.template.exercises = value.split(',').map(s => s.trim()).filter(s => s);
				}));

		new Setting(contentEl)
			.setName('Estimated Duration (minutes)')
			.addText(text => text
				.setPlaceholder('60')
				.setValue(this.template.estimatedDuration.toString())
				.onChange(async (value) => {
					this.template.estimatedDuration = value ? parseInt(value) : 60;
				}));

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save Template')
				.setCta()
				.onClick(async () => {
					if (this.template.name && this.template.exercises.length > 0) {
						this.plugin.settings.workoutTemplates.push(this.template);
						await this.plugin.saveSettings();
						this.onSave();
						this.close();
					} else {
						new Notice('Please fill in name and exercises');
					}
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
