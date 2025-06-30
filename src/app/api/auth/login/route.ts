// app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { 
  verifyPassword, 
  generateToken, 
  isValidEmail,
  sanitizeUser,
  createErrorResponse,
  createSuccessResponse,
  checkRateLimit
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = checkRateLimit(`login:${clientIP}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many login attempts. Please try again later.',
        429
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return createErrorResponse('Email and password are required');
    }

    if (!isValidEmail(email)) {
      return createErrorResponse('Please provide a valid email address');
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return createErrorResponse('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return createErrorResponse('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    });

    await user.save();

    // Sanitize user data (remove password)
    const userResponse = sanitizeUser(user);

    // Set token in HTTP-only cookie
    const response = createSuccessResponse(
      {
        user: userResponse,
        token
      },
      'Login successful'
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
    console.error('Login error:', error);
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