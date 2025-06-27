import { Workout } from '../types';

export class WorkoutFileGenerator {
	static generateWorkoutContent(workout: Workout): string {
		let content = `# ${workout.name}\n\n`;
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
}
