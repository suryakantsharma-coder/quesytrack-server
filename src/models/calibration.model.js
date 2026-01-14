const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    filePath: String,
    fileType: String,
    fileSize: Number,
  },
  { _id: false }
);

const calibrationSchema = new mongoose.Schema(
  {
    calibrationId: {
      type: String,
      required: [true, 'Calibration ID is required'],
      unique: true,
      trim: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },

    gaugeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gauge',
      required: false,
    },

    calibrationDate: {
      type: Date,
      required: [true, 'Calibration date is required'],
    },

    calibrationDueDate: {
      type: Date,
      required: [true, 'Calibration due date is required'],
    },

    calibratedBy: {
      type: String,
      trim: true,
      default: '',
    },

    calibrationType: {
      type: String,
      enum: ['Internal', 'External'],
      default: 'Internal',
    },

    traceability: {
      type: String,
      enum: ['NIST', 'ISO', 'NABL', 'None'],
      default: 'NIST',
    },

    certificateNumber: {
      type: String,
      trim: true,
      default: '',
    },

    reportLink: {
      type: String,
      trim: true,
      default: '',
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Overdue'],
      default: 'Completed',
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

module.exports = mongoose.model('Calibration', calibrationSchema);
