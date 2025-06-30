// lib/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  profile?: {
    weight?: number; // kg for calorie calculations
    height?: number; // cm
    age?: number;
    gender?: 'male' | 'female';
  };
  goals?: {
    dailySteps: number;
    dailyCalories: number;
    weeklyWorkouts: number;
  };
  createdAt: string;
}

export interface StepsEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  steps: number;
  duration: number; // minutes walked/active
  caloriesBurned: number;
  createdAt: string;
}

export interface Workout {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  type: WorkoutType;
  name: string;
  duration: number; // minutes
  intensity: Intensity;
  caloriesBurned: number;
  notes?: string;
  createdAt: string;
}

export type WorkoutType = 'cardio' | 'strength' | 'yoga' | 'sports' | 'other';
export type Intensity = 'low' | 'medium' | 'high';

export interface DailyGoals {
  steps: number;
  calories: number;
  workouts: number;
}

export interface UserStats {
  totalSteps: number;
  totalCalories: number;
  totalWorkouts: number;
  streakDays: number;
  averageStepsPerDay: number;
  averageCaloriesPerDay: number;
}

// Chart data interfaces
export interface ChartDataPoint {
  date: string;
  steps?: number;
  calories?: number;
  workouts?: number;
}

export interface ProgressData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
}

// Form interfaces
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female';
}

export interface StepsFormData {
  date: string;
  steps: number;
  duration: number;
}

export interface WorkoutFormData {
  date: string;
  type: WorkoutType;
  name: string;
  duration: number;
  intensity: Intensity;
  notes?: string;
}