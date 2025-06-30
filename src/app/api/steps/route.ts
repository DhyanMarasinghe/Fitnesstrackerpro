// app/api/steps/route.ts
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Steps from '@/lib/models/Steps';
import { 
  getUserFromRequest,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/auth';
import { calculateStepsCalories } from '@/lib/calculations';

// GET - Retrieve user's steps data
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
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

    // Fetch steps data
    const stepsData = await Steps.find(query)
      .sort({ date: -1 })
      .limit(365); // Max 1 year of data

    return createSuccessResponse(stepsData);

  } catch (error) {
    console.error('Get steps error:', error);
    return createErrorResponse('Failed to retrieve steps data', 500);
  }
}

// POST - Add new steps entry
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    // Parse request body
    const body = await request.json();
    const { date, steps, duration } = body;

    // Validation
    if (!date || !steps || !duration) {
      return createErrorResponse('Date, steps, and duration are required');
    }

    if (steps < 0 || steps > 100000) {
      return createErrorResponse('Steps must be between 0 and 100,000');
    }

    if (duration < 1 || duration > 1440) {
      return createErrorResponse('Duration must be between 1 and 1440 minutes');
    }

    // Calculate calories burned
    const caloriesBurned = calculateStepsCalories(steps, 70, duration); // Using default weight

    // Check if entry already exists for this date
    const existingEntry = await Steps.findOne({
      userId: user.userId,
      date: new Date(date)
    });

    if (existingEntry) {
      // Update existing entry
      existingEntry.steps = steps;
      existingEntry.duration = duration;
      existingEntry.caloriesBurned = caloriesBurned;
      
      const updatedEntry = await existingEntry.save();
      return createSuccessResponse(updatedEntry, 'Steps updated successfully');
    } else {
      // Create new entry
      const newStepsEntry = new Steps({
        userId: user.userId,
        date: new Date(date),
        steps,
        duration,
        caloriesBurned
      });

      const savedEntry = await newStepsEntry.save();
      return createSuccessResponse(savedEntry, 'Steps added successfully', 201);
    }

  } catch (error: any) {
    console.error('Add steps error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(errors.join(', '));
    }

    return createErrorResponse('Failed to add steps data', 500);
  }
}

// PUT - Update existing steps entry
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    // Parse request body
    const body = await request.json();
    const { id, steps, duration } = body;

    if (!id) {
      return createErrorResponse('Steps entry ID is required');
    }

    // Find and update the entry
    const stepsEntry = await Steps.findOne({
      _id: id,
      userId: user.userId
    });

    if (!stepsEntry) {
      return createErrorResponse('Steps entry not found', 404);
    }

    // Update fields if provided
    if (steps !== undefined) {
      if (steps < 0 || steps > 100000) {
        return createErrorResponse('Steps must be between 0 and 100,000');
      }
      stepsEntry.steps = steps;
    }

    if (duration !== undefined) {
      if (duration < 1 || duration > 1440) {
        return createErrorResponse('Duration must be between 1 and 1440 minutes');
      }
      stepsEntry.duration = duration;
    }

    // Recalculate calories if steps or duration changed
    if (steps !== undefined || duration !== undefined) {
      stepsEntry.caloriesBurned = calculateStepsCalories(
        stepsEntry.steps, 
        70, 
        stepsEntry.duration
      );
    }

    const updatedEntry = await stepsEntry.save();
    return createSuccessResponse(updatedEntry, 'Steps updated successfully');

  } catch (error) {
    console.error('Update steps error:', error);
    return createErrorResponse('Failed to update steps data', 500);
  }
}

// DELETE - Delete steps entry
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    // Get entry ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse('Steps entry ID is required');
    }

    // Find and delete the entry
    const deletedEntry = await Steps.findOneAndDelete({
      _id: id,
      userId: user.userId
    });

    if (!deletedEntry) {
      return createErrorResponse('Steps entry not found', 404);
    }

    return createSuccessResponse(null, 'Steps entry deleted successfully');

  } catch (error) {
    console.error('Delete steps error:', error);
    return createErrorResponse('Failed to delete steps entry', 500);
  }
}