// lib/models/Steps.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISteps extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  date: Date;
  steps: number;
  duration: number; // in minutes
  caloriesBurned: number;
  createdAt: Date;
  updatedAt: Date;
}

const StepsSchema = new Schema<ISteps>(
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
    steps: {
      type: Number,
      required: [true, 'Steps count is required'],
      min: [0, 'Steps cannot be negative'],
      max: [100000, 'Steps count seems unrealistic (max 100,000)']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [1440, 'Duration cannot exceed 24 hours (1440 minutes)']
    },
    caloriesBurned: {
      type: Number,
      required: [true, 'Calories burned is required'],
      min: [0, 'Calories burned cannot be negative'],
      max: [5000, 'Calories burned seems unrealistic (max 5000)']
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

// Compound index for unique user-date combination
StepsSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for date range queries
StepsSchema.index({ userId: 1, date: -1 });

// Virtual for formatted date
StepsSchema.virtual('dateString').get(function() {
  return this.date.toISOString().split('T')[0];
});

const Steps: Model<ISteps> = mongoose.models.Steps || mongoose.model<ISteps>('Steps', StepsSchema);

export default Steps;