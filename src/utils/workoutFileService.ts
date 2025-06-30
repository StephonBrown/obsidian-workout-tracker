import { App, TFile, Notice } from 'obsidian';
import { Workout, Exercise } from '../types';
import { parseYaml, stringifyYaml } from 'obsidian';

export class WorkoutFileService {
	app: App;
	workoutFolder: string;

	constructor(app: App, workoutFolder: string) {
		this.app = app;
		this.workoutFolder = workoutFolder;
	}

	/**
	 * Save workout data to a markdown file with frontmatter
	 */
	async saveWorkout(workout: Workout): Promise<TFile | null> {
		try {
			const fileName = this.generateFileName(workout);
			const filePath = `${this.workoutFolder}/${fileName}`;

			// Ensure the folder exists
			if (!this.app.vault.getAbstractFileByPath(this.workoutFolder)) {
				await this.app.vault.createFolder(this.workoutFolder);
			}

			const content = this.generateWorkoutFileContent(workout);
			
			// Check if file already exists
			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile instanceof TFile) {
				// Update existing file
				await this.app.vault.modify(existingFile, content);
				new Notice(`Workout updated: ${fileName}`);
				return existingFile;
			} else {
				// Create new file
				const newFile = await this.app.vault.create(filePath, content);
				new Notice(`Workout saved: ${fileName}`);
				return newFile;
			}
		} catch (error) {
			new Notice(`Error saving workout: ${error.message}`);
			return null;
		}
	}

	/**
	 * Load a workout from a file with frontmatter
	 */
	async loadWorkout(file: TFile): Promise<Workout | null> {
		try {
			const content = await this.app.vault.read(file);
			return this.parseWorkoutFromContent(content, file.basename);
		} catch (error) {
			console.error(`Error loading workout from ${file.path}:`, error);
			return null;
		}
	}

	/**
	 * Update an existing workout file
	 */
	async updateWorkout(file: TFile, workout: Workout): Promise<boolean> {
		try {
			const content = this.generateWorkoutFileContent(workout);
			await this.app.vault.modify(file, content);
			new Notice(`Workout updated: ${file.basename}`);
			return true;
		} catch (error) {
			new Notice(`Error updating workout: ${error.message}`);
			return false;
		}
	}

	/**
	 * Get all workout files from the workout folder
	 */
	async getAllWorkoutFiles(): Promise<TFile[]> {
		const folder = this.app.vault.getAbstractFileByPath(this.workoutFolder);
		if (!folder || !(folder instanceof this.app.vault.adapter.constructor)) {
			return [];
		}

		const files = this.app.vault.getMarkdownFiles().filter(file => 
			file.path.startsWith(this.workoutFolder + '/') && 
			file.extension === 'md'
		);

		return files;
	}

	/**
	 * Load all workouts from the workout folder
	 */
	async loadAllWorkouts(): Promise<Workout[]> {
		const workoutFiles = await this.getAllWorkoutFiles();
		const workouts: Workout[] = [];

		for (const file of workoutFiles) {
			const workout = await this.loadWorkout(file);
			if (workout) {
				workouts.push(workout);
			}
		}

		return workouts;
	}

	/**
	 * Check if a file is a workout file by checking for workoutTracker frontmatter
	 */
	async isWorkoutFile(file: TFile): Promise<boolean> {
		try {
			const content = await this.app.vault.read(file);
			const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
			if (!frontmatterMatch) return false;

			const frontmatter = parseYaml(frontmatterMatch[1]);
			return frontmatter?.workoutTracker === true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Generate filename for workout
	 */
	private generateFileName(workout: Workout): string {
		const timestamp = workout.id || Date.now().toString();
		const safeName = workout.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
		return `${workout.date}-${timestamp}-${safeName}.md`;
	}

	/**
	 * Generate markdown content with frontmatter
	 */
	private generateWorkoutFileContent(workout: Workout): string {
		const frontmatter = {
			id: workout.id,
			date: workout.date,
			name: workout.name,
			duration: workout.duration,
			exercises: workout.exercises.map(exercise => ({
				name: exercise.name,
				sets: exercise.sets,
				notes: exercise.notes
			})),
			notes: workout.notes,
			workoutTracker: true // Tag to identify workout files
		};

		let content = '---\n';
		content += stringifyYaml(frontmatter);
		content += '---\n\n';

		// Add readable content below frontmatter
		content += `# ${workout.name}\n\n`;
		content += `**Date:** ${workout.date}\n`;
		if (workout.duration) {
			content += `**Duration:** ${workout.duration} minutes\n`;
		}
		content += `\n## Exercises\n\n`;

		workout.exercises.forEach(exercise => {
			content += `### ${exercise.name}\n\n`;
			if (exercise.sets && exercise.sets.length > 0) {
				content += `| Set | Reps | Weight | Duration | Distance | Rest |\n`;
				content += `|-----|------|--------|----------|----------|------|\n`;
				exercise.sets.forEach((set, index) => {
					content += `| ${index + 1} | ${set.reps || '-'} | ${set.weight || '-'} | ${set.duration || '-'} | ${set.distance || '-'} | ${set.restTime || '-'} |\n`;
				});
			}
			if (exercise.notes) {
				content += `\n**Notes:** ${exercise.notes}\n`;
			}
			content += `\n`;
		});

		if (workout.notes) {
			content += `## Notes\n\n${workout.notes}\n`;
		}

		return content;
	}

	/**
	 * Parse workout data from file content
	 */
	private parseWorkoutFromContent(content: string, fallbackName: string): Workout | null {
		try {
			// Extract frontmatter
			const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
			if (!frontmatterMatch) {
				console.warn(`No frontmatter found in workout file: ${fallbackName}`);
				return null;
			}

			const yamlContent = frontmatterMatch[1];
			const frontmatter = parseYaml(yamlContent);

			// Validate and construct workout object
			if (!frontmatter || !frontmatter.workoutTracker) {
				console.warn(`Invalid workout frontmatter in file: ${fallbackName}`);
				return null;
			}

			const workout: Workout = {
				id: frontmatter.id || Date.now().toString(),
				date: frontmatter.date || new Date().toISOString().split('T')[0],
				name: frontmatter.name || fallbackName,
				exercises: this.parseExercises(frontmatter.exercises || []),
				duration: frontmatter.duration,
				notes: frontmatter.notes
			};

			return workout;
		} catch (error) {
			console.error(`Error parsing workout content:`, error);
			return null;
		}
	}

	/**
	 * Parse exercises from frontmatter
	 */
	private parseExercises(exercisesData: any[]): Exercise[] {
		if (!Array.isArray(exercisesData)) {
			return [];
		}

		return exercisesData.map(exerciseData => ({
			name: exerciseData.name || 'Unknown Exercise',
			sets: exerciseData.sets || [],
			notes: exerciseData.notes
		}));
	}
}
