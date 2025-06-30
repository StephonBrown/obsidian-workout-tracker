import { App, TFile, Notice } from "obsidian";
import { Workout, Exercise } from "../types";
import { parseYaml, stringifyYaml } from "obsidian";

export interface WorkoutStatistics {
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalVolume: number; // total weight lifted
  averageWorkoutDuration: number;
  exerciseFrequency: Record<string, number>;
  workoutsByDate: Record<string, Workout[]>;
  personalRecords: Record<
    string,
    { weight: number; reps: number; date: string }
  >;
  workoutStreak: number;
  lastWorkoutDate: string;
}

export class WorkoutDataService {
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

    const files = this.app.vault
      .getMarkdownFiles()
      .filter(
        (file) =>
          file.path.startsWith(this.workoutFolder + "/") &&
          file.extension === "md"
      );

    return files;
  }

  /**
   * Load all workouts and calculate statistics
   */
  async getWorkoutStatistics(): Promise<WorkoutStatistics> {
    const workoutFiles = await this.getAllWorkoutFiles();
    const workouts: Workout[] = [];

    for (const file of workoutFiles) {
      const workout = await this.loadWorkout(file);
      if (workout) {
        workouts.push(workout);
      }
    }

    return this.calculateStatistics(workouts);
  }

  /**
   * Generate filename for workout
   */
  private generateFileName(workout: Workout): string {
    const timestamp = workout.id || Date.now().toString();
    const safeName = workout.name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-");
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
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        notes: exercise.notes,
      })),
      notes: workout.notes,
      workoutTracker: true, // Tag to identify workout files
    };

    let content = "---\n";
    content += stringifyYaml(frontmatter);
    content += "---\n\n";

    // Add readable content below frontmatter
    content += `# ${workout.name}\n\n`;
    content += `**Date:** ${workout.date}\n`;
    if (workout.duration) {
      content += `**Duration:** ${workout.duration} minutes\n`;
    }
    content += `\n## Exercises\n\n`;

    workout.exercises.forEach((exercise) => {
      content += `### ${exercise.name}\n\n`;
      if (exercise.sets && exercise.sets.length > 0) {
        content += `| Set | Reps | Weight | Duration | Distance | Rest |\n`;
        content += `|-----|------|--------|----------|----------|------|\n`;
        exercise.sets.forEach((set, index) => {
          content += `| ${index + 1} | ${set.reps || "-"} | ${
            set.weight || "-"
          } | ${set.duration || "-"} | ${set.distance || "-"} | ${
            set.restTime || "-"
          } |\n`;
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
  private parseWorkoutFromContent(
    content: string,
    fallbackName: string
  ): Workout | null {
    try {
      // This regex matches the frontmatter section at the start of the file and captures everything between the `---` markers.
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        console.warn(`No frontmatter found in workout file: ${fallbackName}`);
        return null;
      }
      // Get the YAML content from the frontmatter
      const yamlContent = frontmatterMatch[1];
      const frontmatterContent = parseYaml(yamlContent);

      // Validate and construct workout object
      if (!frontmatterContent || !frontmatterContent.workoutTracker) {
        console.warn(`Invalid workout frontmatter in file: ${fallbackName}`);
        return null;
      }

      const workout: Workout = {
        id: frontmatterContent.id || Date.now().toString(),
        date: frontmatterContent.date || new Date().toISOString().split("T")[0],
        name: frontmatterContent.name || fallbackName,
        exercises: this.parseExercises(frontmatterContent.exercises || []),
        duration: frontmatterContent.duration,
        notes: frontmatterContent.notes,
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

    return exercisesData.map((exerciseData) => ({
      name: exerciseData.name || "Unknown Exercise",
      sets: exerciseData.sets || [],
      notes: exerciseData.notes,
    }));
  }

  /**
   * Calculate comprehensive workout statistics
   */
  private calculateStatistics(workouts: Workout[]): WorkoutStatistics {
    const stats: WorkoutStatistics = {
      totalWorkouts: workouts.length,
      totalExercises: 0,
      totalSets: 0,
      totalVolume: 0,
      averageWorkoutDuration: 0,
      exerciseFrequency: {},
      workoutsByDate: {},
      personalRecords: {},
      workoutStreak: 0,
      lastWorkoutDate: "",
    };

    if (workouts.length === 0) {
      return stats;
    }

    // Sort workouts by date
    const sortedWorkouts = workouts.sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    stats.lastWorkoutDate = sortedWorkouts[sortedWorkouts.length - 1].date;

    let totalDuration = 0;
    let durationCount = 0;

    workouts.forEach((workout) => {
      // Count exercises and sets
      stats.totalExercises += workout.exercises.length;

      // Group workouts by date
      if (!stats.workoutsByDate[workout.date]) {
        stats.workoutsByDate[workout.date] = [];
      }
      stats.workoutsByDate[workout.date].push(workout);

      // Duration
      if (workout.duration) {
        totalDuration += workout.duration;
        durationCount++;
      }

      workout.exercises.forEach((exercise) => {
        // Exercise frequency
        stats.exerciseFrequency[exercise.name] =
          (stats.exerciseFrequency[exercise.name] || 0) + 1;

        stats.totalSets += exercise.sets.length;

        exercise.sets.forEach((set) => {
          // Total volume (weight × reps)
          if (set.weight && set.reps) {
            stats.totalVolume += set.weight * set.reps;
          }

          // Personal records (max weight for each exercise)
          if (set.weight && set.reps) {
            const currentPR = stats.personalRecords[exercise.name];
            if (
              !currentPR ||
              set.weight > currentPR.weight ||
              (set.weight === currentPR.weight && set.reps > currentPR.reps)
            ) {
              stats.personalRecords[exercise.name] = {
                weight: set.weight,
                reps: set.reps,
                date: workout.date,
              };
            }
          }
        });
      });
    });

    // Calculate average duration
    if (durationCount > 0) {
      stats.averageWorkoutDuration = totalDuration / durationCount;
    }

    // Calculate workout streak
    stats.workoutStreak = this.calculateWorkoutStreak(sortedWorkouts);

    return stats;
  }

  /**
   * Calculate current workout streak
   */
  private calculateWorkoutStreak(sortedWorkouts: Workout[]): number {
    if (sortedWorkouts.length === 0) return 0;

    const today = new Date();
    const uniqueDates = [...new Set(sortedWorkouts.map((w) => w.date))].sort();

    let streak = 0;
    let currentDate = new Date(today);

    // Check backwards from today
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const workoutDate = new Date(uniqueDates[i]);
      const diffDays = Math.floor(
        (currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1) {
        // Allow for today or yesterday
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }

    return streak;
  }
}
