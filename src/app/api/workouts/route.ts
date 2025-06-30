//api/workouts/route.ts
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Workout from '@/lib/models/Workout';
import { 
  getUserFromRequest,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/auth';
import { calculateWorkoutCalories } from '@/lib/calculations';

// GET - Retrieve user's workout data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = { userId: user.userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);
      query.date = { $gte: daysAgo };
    }

    const workoutData = await Workout.find(query)
      .sort({ date: -1 })
      .limit(365);

    return createSuccessResponse(workoutData);

  } catch (error) {
    console.error('Get workouts error:', error);
    return createErrorResponse('Failed to retrieve workout data', 500);
  }
}

// POST - Add new workout entry
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    const body = await request.json();
    const { date, type, name, duration, intensity, notes } = body;

    if (!date || !type || !name || !duration || !intensity) {
      return createErrorResponse('Date, type, name, duration, and intensity are required');
    }

    if (duration < 5 || duration > 480) {
      return createErrorResponse('Duration must be between 5 and 480 minutes');
    }

    if (!['cardio', 'strength', 'yoga', 'sports', 'other'].includes(type)) {
      return createErrorResponse('Invalid workout type');
    }

    if (!['low', 'medium', 'high'].includes(intensity)) {
      return createErrorResponse('Invalid intensity level');
    }

    // Calculate calories burned (using default weight of 70kg)
    const caloriesBurned = calculateWorkoutCalories(type, intensity, duration, 70);

    const newWorkout = new Workout({
      userId: user.userId,
      date: new Date(date),
      type,
      name: name.trim(),
      duration,
      intensity,
      caloriesBurned,
      notes: notes?.trim() || undefined
    });

    const savedWorkout = await newWorkout.save();
    return createSuccessResponse(savedWorkout, 'Workout added successfully', 201);

  } catch (error: any) {
    console.error('Add workout error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(errors.join(', '));
    }

    return createErrorResponse('Failed to add workout data', 500);
  }
}

// PUT - Update existing workout entry
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    const body = await request.json();
    const { id, type, name, duration, intensity, notes } = body;

    if (!id) {
      return createErrorResponse('Workout ID is required');
    }

    const workout = await Workout.findOne({
      _id: id,
      userId: user.userId
    });

    if (!workout) {
      return createErrorResponse('Workout not found', 404);
    }

    if (type !== undefined) workout.type = type;
    if (name !== undefined) workout.name = name.trim();
    if (duration !== undefined) workout.duration = duration;
    if (intensity !== undefined) workout.intensity = intensity;
    if (notes !== undefined) workout.notes = notes?.trim() || undefined;

    if (type !== undefined || duration !== undefined || intensity !== undefined) {
      workout.caloriesBurned = calculateWorkoutCalories(
        workout.type,
        workout.intensity,
        workout.duration,
        70
      );
    }

    const updatedWorkout = await workout.save();
    return createSuccessResponse(updatedWorkout, 'Workout updated successfully');

  } catch (error) {
    console.error('Update workout error:', error);
    return createErrorResponse('Failed to update workout data', 500);
  }
}

// DELETE - Delete workout entry
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse('Workout ID is required');
    }

    const deletedWorkout = await Workout.findOneAndDelete({
      _id: id,
      userId: user.userId
    });

    if (!deletedWorkout) {
      return createErrorResponse('Workout not found', 404);
    }

    return createSuccessResponse(null, 'Workout deleted successfully');

  } catch (error) {
    console.error('Delete workout error:', error);
    return createErrorResponse('Failed to delete workout', 500);
  }
}