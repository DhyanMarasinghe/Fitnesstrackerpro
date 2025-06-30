// lib/models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  profile: {
    weight?: number;
    height?: number;
    age?: number;
    gender?: 'male' | 'female';
  };
  goals: {
    dailySteps: number;
    dailyCalories: number;
    weeklyWorkouts: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [6, 'Password must be at least 6 characters long']
    },
    profile: {
      weight: {
        type: Number,
        min: [20, 'Weight must be at least 20kg'],
        max: [300, 'Weight cannot exceed 300kg']
      },
      height: {
        type: Number,
        min: [100, 'Height must be at least 100cm'],
        max: [250, 'Height cannot exceed 250cm']
      },
      age: {
        type: Number,
        min: [13, 'Age must be at least 13'],
        max: [120, 'Age cannot exceed 120']
      },
      gender: {
        type: String,
        enum: ['male', 'female'],
        lowercase: true
      }
    },
    goals: {
      dailySteps: {
        type: Number,
        default: 10000,
        min: [1000, 'Daily steps goal must be at least 1000'],
        max: [50000, 'Daily steps goal cannot exceed 50000']
      },
      dailyCalories: {
        type: Number,
        default: 500,
        min: [100, 'Daily calories goal must be at least 100'],
        max: [2000, 'Daily calories goal cannot exceed 2000']
      },
      weeklyWorkouts: {
        type: Number,
        default: 3,
        min: [1, 'Weekly workouts goal must be at least 1'],
        max: [14, 'Weekly workouts goal cannot exceed 14']
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password; // Never send password in JSON response
        return ret;
      }
    }
  }
);

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for id
UserSchema.virtual('id').get(function() {
  return this._id.toString();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;