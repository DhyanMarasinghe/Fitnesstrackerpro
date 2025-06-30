// app/api/auth/register/route.ts
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { 
  hashPassword, 
  generateToken, 
  isValidEmail, 
  isValidPassword,
  sanitizeUser,
  createErrorResponse,
  createSuccessResponse,
  checkRateLimit
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = checkRateLimit(`register:${clientIP}`, 3, 15 * 60 * 1000); // 3 attempts per 15 minutes
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many registration attempts. Please try again later.',
        429
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { name, email, password, weight, height, age, gender } = body;

    // Validation
    if (!name || !email || !password) {
      return createErrorResponse('Name, email, and password are required');
    }

    if (name.trim().length < 2) {
      return createErrorResponse('Name must be at least 2 characters long');
    }

    if (!isValidEmail(email)) {
      return createErrorResponse('Please provide a valid email address');
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return createErrorResponse(passwordValidation.errors.join(', '));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return createErrorResponse('A user with this email already exists');
    }

    // Validate optional profile fields
    if (weight && (weight < 20 || weight > 300)) {
      return createErrorResponse('Weight must be between 20 and 300 kg');
    }

    if (height && (height < 100 || height > 250)) {
      return createErrorResponse('Height must be between 100 and 250 cm');
    }

    if (age && (age < 13 || age > 120)) {
      return createErrorResponse('Age must be between 13 and 120 years');
    }

    if (gender && !['male', 'female'].includes(gender.toLowerCase())) {
      return createErrorResponse('Gender must be either "male" or "female"');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      profile: {
        weight: weight || undefined,
        height: height || undefined,
        age: age || undefined,
        gender: gender?.toLowerCase() || undefined
      },
      goals: {
        dailySteps: 10000,
        dailyCalories: 500,
        weeklyWorkouts: 3
      }
    });

    const savedUser = await newUser.save();

    // Generate JWT token
    const token = generateToken({
      userId: savedUser._id.toString(),
      email: savedUser.email,
      name: savedUser.name
    });

    // Sanitize user data (remove password)
    const userResponse = sanitizeUser(savedUser);

    // Set token in HTTP-only cookie
    const response = createSuccessResponse(
      {
        user: userResponse,
        token
      },
      'Account created successfully',
      201
    );

    // Add cookie header
    response.headers.set(
      'Set-Cookie',
      `auth-token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    return response;

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return createErrorResponse('A user with this email already exists');
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(errors.join(', '));
    }

    return createErrorResponse('Internal server error. Please try again.', 500);
  }
}

// Handle unsupported methods
export async function GET() {
  return createErrorResponse('Method not allowed', 405);
}

export async function PUT() {
  return createErrorResponse('Method not allowed', 405);
}

export async function DELETE() {
  return createErrorResponse('Method not allowed', 405);
}