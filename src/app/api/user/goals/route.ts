//user/goals/route.ts
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { 
  getUserFromRequest,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/auth';

// GET - Get user goals
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    const userData = await User.findById(user.userId);
    if (!userData) {
      return createErrorResponse('User not found', 404);
    }

    // Check if user has goals set (for new user detection)
    if (!userData.goals || userData.goals.dailySteps === undefined) {
      return createErrorResponse('Goals not found', 404);
    }

    return createSuccessResponse({
      steps: userData.goals.dailySteps,
      calories: userData.goals.dailyCalories,
      workouts: userData.goals.weeklyWorkouts
    });

  } catch (error) {
    console.error('Get goals error:', error);
    return createErrorResponse('Failed to retrieve goals', 500);
  }
}

// PUT - Update user goals
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    const body = await request.json();
    const { steps, calories, workouts } = body;

    if (steps !== undefined && (steps < 1000 || steps > 50000)) {
      return createErrorResponse('Daily steps goal must be between 1,000 and 50,000');
    }

    if (calories !== undefined && (calories < 100 || calories > 2000)) {
      return createErrorResponse('Daily calories goal must be between 100 and 2,000');
    }

    if (workouts !== undefined && (workouts < 1 || workouts > 14)) {
      return createErrorResponse('Weekly workouts goal must be between 1 and 14');
    }

    const userData = await User.findById(user.userId);
    if (!userData) {
      return createErrorResponse('User not found', 404);
    }

    if (steps !== undefined) userData.goals.dailySteps = steps;
    if (calories !== undefined) userData.goals.dailyCalories = calories;
    if (workouts !== undefined) userData.goals.weeklyWorkouts = workouts;

    await userData.save();

    return createSuccessResponse({
      steps: userData.goals.dailySteps,
      calories: userData.goals.dailyCalories,
      workouts: userData.goals.weeklyWorkouts
    }, 'Goals updated successfully');

  } catch (error: any) {
    console.error('Update goals error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(errors.join(', '));
    }

    return createErrorResponse('Failed to update goals', 500);
  }
}

// POST - Set initial goals for new users
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    const body = await request.json();
    const { steps, calories, workouts } = body;

    if (!steps || !calories || !workouts) {
      return createErrorResponse('Steps, calories, and workouts goals are required');
    }

    if (steps < 1000 || steps > 50000) {
      return createErrorResponse('Daily steps goal must be between 1,000 and 50,000');
    }

    if (calories < 100 || calories > 2000) {
      return createErrorResponse('Daily calories goal must be between 100 and 2,000');
    }

    if (workouts < 1 || workouts > 14) {
      return createErrorResponse('Weekly workouts goal must be between 1 and 14');
    }

    const userData = await User.findById(user.userId);
    if (!userData) {
      return createErrorResponse('User not found', 404);
    }

    userData.goals.dailySteps = steps;
    userData.goals.dailyCalories = calories;
    userData.goals.weeklyWorkouts = workouts;

    await userData.save();

    return createSuccessResponse({
      steps: userData.goals.dailySteps,
      calories: userData.goals.dailyCalories,
      workouts: userData.goals.weeklyWorkouts
    }, 'Goals set successfully', 201);

  } catch (error: any) {
    console.error('Set goals error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(errors.join(', '));
    }

    return createErrorResponse('Failed to set goals', 500);
  }
}