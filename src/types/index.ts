export interface WorkoutTrackerSettings {
	defaultWorkoutFolder: string;
	exerciseTemplates: ExerciseTemplate[];
	workoutTemplates: WorkoutTemplate[];
	enableAutoComplete: boolean;
	dateFormat: string;
}

export interface ExerciseTemplate {
	name: string;
	type: 'strength' | 'cardio' | 'flexibility' | 'other';
	defaultSets?: number;
	defaultReps?: number;
	defaultWeight?: number;
	defaultDuration?: number;
	muscleGroups: string[];
}

export interface WorkoutTemplate {
	name: string;
	exercises: string[];
	estimatedDuration: number;
}

export interface Exercise {
	name: string;
	sets: ExerciseSet[];
	notes?: string;
}

export interface ExerciseSet {
	reps?: number;
	weight?: number;
	duration?: number;
	distance?: number;
	restTime?: number;
}

export interface Workout {
	id: string;
	date: string;
	name: string;
	exercises: Exercise[];
	duration?: number;
	notes?: string;
}
