const mongoose = require('mongoose');

/**
 * Project Schema
 * Includes custom projectId for human-readable identification
 */

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      // Format: P-XXX (e.g., P-001, P-002)
    },

    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },

    projectDescription: {
      type: String,
      trim: true,
      default: '',
    },

    overdue: {
      type: Number,
      default: 0,
      min: [0, 'Overdue value cannot be negative'],
    },

    progress: {
      type: String,
      enum: [0, 25, 50, 75, 100],
      default: 'Not Started',
    },

    gauge: {
      type: Number,
      default: 0,
      min: [0, 'Gauge value cannot be negative'],
      max: [100, 'Gauge value cannot be greater than 100'],
    },

    calibration: {
      type: Number,
      default: 0,
      min: [0, 'Calibration value cannot be negative'],
      max: [100, 'Calibration value cannot be greater than 100'],
    },

    status: {
      type: String,
      enum: ['active', 'on-hold', 'completed'],
      required: [true, 'Status is required'],
      default: 'Active',
    },

    startedAt: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    // Optional: who created this project
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  },
);

module.exports = mongoose.model('Project', projectSchema);
