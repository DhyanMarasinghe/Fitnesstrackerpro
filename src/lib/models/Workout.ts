// lib/models/Workout.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWorkout extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  date: Date;
  type: 'cardio' | 'strength' | 'yoga' | 'sports' | 'other';
  name: string;
  duration: number; // in minutes
  intensity: 'low' | 'medium' | 'high';
  caloriesBurned: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSchema = new Schema<IWorkout>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Workout type is required'],
      enum: {
        values: ['cardio', 'strength', 'yoga', 'sports', 'other'],
        message: 'Workout type must be: cardio, strength, yoga, sports, or other'
      },
      lowercase: true
    },
    name: {
      type: String,
      required: [true, 'Workout name is required'],
      trim: true,
      maxLength: [100, 'Workout name cannot exceed 100 characters']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 8 hours (480 minutes)']
    },
    intensity: {
      type: String,
      required: [true, 'Intensity is required'],
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Intensity must be: low, medium, or high'
      },
      lowercase: true
    },
    caloriesBurned: {
      type: Number,
      required: [true, 'Calories burned is required'],
      min: [0, 'Calories burned cannot be negative'],
      max: [2000, 'Calories burned seems unrealistic (max 2000 per workout)']
    },
    notes: {
      type: String,
      trim: true,
      maxLength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for efficient queries
WorkoutSchema.index({ userId: 1, date: -1 });
WorkoutSchema.index({ userId: 1, type: 1 });
WorkoutSchema.index({ userId: 1, createdAt: -1 });

// Virtual for formatted date
WorkoutSchema.virtual('dateString').get(function() {
  return this.date.toISOString().split('T')[0];
});

const Workout: Model<IWorkout> = mongoose.models.Workout || mongoose.model<IWorkout>('Workout', WorkoutSchema);

export default Workout;