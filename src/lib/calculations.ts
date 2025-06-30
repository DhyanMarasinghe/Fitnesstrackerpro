// src/lib/calculations.ts
import { WorkoutType, Intensity } from './types';

// MET (Metabolic Equivalent of Task) values for different activities
const MET_VALUES: Record<string, number> = {
  // Cardio activities
  'cardio-low': 3.5,      // Light walking
  'cardio-medium': 7.0,   // Jogging/moderate cycling
  'cardio-high': 10.0,    // Running/intense cycling

  // Strength training
  'strength-low': 3.0,    // Light weights
  'strength-medium': 5.0, // Moderate weights
  'strength-high': 8.0,   // Heavy weights/circuit training

  // Other activities
  'yoga-low': 2.5,
  'yoga-medium': 3.0,
  'yoga-high': 4.0,
  
  'sports-low': 4.0,
  'sports-medium': 6.0,
  'sports-high': 8.0,
  
  'other-low': 3.0,
  'other-medium': 5.0,
  'other-high': 7.0,
};

/**
 * Calculate calories burned from steps
 * Formula: steps * 0.04 * (weight/70) 
 * Average person burns ~0.04 calories per step
 */
export function calculateStepsCalories(
  steps: number, 
  weight: number = 70, // default 70kg
  duration?: number // optional for more accuracy
): number {
  if (steps <= 0) return 0;
  
  // Basic calculation
  let calories = steps * 0.04 * (weight / 70);
  
  // Adjust for pace if duration is provided
  if (duration && duration > 0) {
    const stepsPerMinute = steps / duration;
    // Higher pace = slightly more calories per step
    const paceMultiplier = Math.min(1.3, 1 + (stepsPerMinute - 100) / 500);
    calories *= Math.max(0.8, paceMultiplier);
  }
  
  return Math.round(calories);
}

/**
 * Calculate calories burned from workout
 * Formula: (MET * weight in kg * duration in hours)
 */
export function calculateWorkoutCalories(
  type: WorkoutType,
  intensity: Intensity,
  duration: number, // minutes
  weight: number = 70 // kg
): number {
  if (duration <= 0) return 0;
  
  const metKey = `${type}-${intensity}`;
  const met = MET_VALUES[metKey] || 5.0; // default MET value
  
  // Convert duration to hours for calculation
  const durationHours = duration / 60;
  
  // MET formula: calories = MET * weight * time
  const calories = met * weight * durationHours;
  
  return Math.round(calories);
}

/**
 * Get activity level description based on daily steps
 */
export function getActivityLevel(steps: number): {
  level: string;
  description: string;
  color: string;
} {
  if (steps < 5000) {
    return {
      level: 'Sedentary',
      description: 'Try to get more active!',
      color: 'text-red-600'
    };
  } else if (steps < 7500) {
    return {
      level: 'Lightly Active',
      description: 'Good start, keep it up!',
      color: 'text-orange-600'
    };
  } else if (steps < 10000) {
    return {
      level: 'Moderately Active',
      description: 'Great progress!',
      color: 'text-yellow-600'
    };
  } else if (steps < 12500) {
    return {
      level: 'Very Active',
      description: 'Excellent work!',
      color: 'text-green-600'
    };
  } else {
    return {
      level: 'Highly Active',
      description: 'Outstanding!',
      color: 'text-blue-600'
    };
  }
}

/**
 * Calculate progress percentage toward a goal
 */
export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

/**
 * Format steps for display
 */
export function formatSteps(steps: number): string {
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(1)}k`;
  }
  return steps.toString();
}

/**
 * Format calories for display
 */
export function formatCalories(calories: number): string {
  return `${calories.toLocaleString()} cal`;
}