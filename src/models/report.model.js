const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportName: {
      type: String,
      required: [true, 'Report name is required'],
      trim: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },

    calibrationDate: {
      type: Date,
      required: [true, 'Calibration date is required'],
    },

    calibrationDueDate: {
      type: Date,
      required: [true, 'Calibration due date is required'],
    },

    status: {
      type: String,
      enum: ['completed', 'pending', 'overdue'],
      default: 'completed',
    },

    reportLink: {
      type: String,
      trim: true,
      default: '',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);
