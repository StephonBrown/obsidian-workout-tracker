import { WorkoutTrackerSettings, ExerciseTemplate, WorkoutTemplate } from '../types';

export const DEFAULT_SETTINGS: WorkoutTrackerSettings = {
	defaultWorkoutFolder: 'Workouts',
	exerciseTemplates: [
		{
			name: 'Push-up',
			type: 'strength',
			defaultSets: 3,
			defaultReps: 10,
			muscleGroups: ['chest', 'triceps', 'shoulders']
		},
		{
			name: 'Running',
			type: 'cardio',
			defaultDuration: 30,
			muscleGroups: ['legs', 'cardiovascular']
		},
		{
			name: 'Bench Press',
			type: 'strength',
			defaultSets: 3,
			defaultReps: 8,
			defaultWeight: 135,
			muscleGroups: ['chest', 'triceps', 'shoulders']
		}
	],
	workoutTemplates: [
		{
			name: 'Push Day',
			exercises: ['Bench Press', 'Push-up', 'Shoulder Press'],
			estimatedDuration: 60
		}
	],
	enableAutoComplete: true,
	dateFormat: 'YYYY-MM-DD'
};
