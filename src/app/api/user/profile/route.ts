//user/profile/route.s
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { 
  getUserFromRequest,
  createErrorResponse,
  createSuccessResponse,
  sanitizeUser
} from '@/lib/auth';

// GET - Get user profile
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

    const sanitizedUser = sanitizeUser(userData);
    return createSuccessResponse(sanitizedUser);

  } catch (error) {
    console.error('Get profile error:', error);
    return createErrorResponse('Failed to retrieve profile', 500);
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    await connectDB();

    const body = await request.json();
    const { name, weight, height, age, gender } = body;

    const userData = await User.findById(user.userId);
    if (!userData) {
      return createErrorResponse('User not found', 404);
    }

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return createErrorResponse('Name must be at least 2 characters long');
      }
      userData.name = name.trim();
    }

    if (weight !== undefined) {
      if (weight !== null && (weight < 20 || weight > 300)) {
        return createErrorResponse('Weight must be between 20 and 300 kg');
      }
      userData.profile.weight = weight || undefined;
    }

    if (height !== undefined) {
      if (height !== null && (height < 100 || height > 250)) {
        return createErrorResponse('Height must be between 100 and 250 cm');
      }
      userData.profile.height = height || undefined;
    }

    if (age !== undefined) {
      if (age !== null && (age < 13 || age > 120)) {
        return createErrorResponse('Age must be between 13 and 120 years');
      }
      userData.profile.age = age || undefined;
    }

    if (gender !== undefined) {
      if (gender !== null && !['male', 'female'].includes(gender)) {
        return createErrorResponse('Gender must be either "male" or "female"');
      }
      userData.profile.gender = gender || undefined;
    }

    const updatedUser = await userData.save();
    const sanitizedUser = sanitizeUser(updatedUser);
    return createSuccessResponse(sanitizedUser, 'Profile updated successfully');

  } catch (error: any) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(errors.join(', '));
    }

    return createErrorResponse('Failed to update profile', 500);
  }
}