import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    filePath: String,
    fileType: String,
    fileSize: Number,
  },
  { _id: false },
);

const calibrationSchema = new mongoose.Schema(
  {
    calibrationId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      // Format: C-XXX (e.g., C-001, C-002)
      // Auto-generated if not provided
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },

    gaugeId: {
      type: String,
      required: false,
      trim: true,
      // Stores custom gaugeId (e.g., G-001) instead of MongoDB ObjectId
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
      enum: ['internal', 'external', 'third party'],
      default: 'third party',
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
      enum: ['internal', 'external', 'third party', 'completed', 'pending', 'overdue'],
      default: 'internal',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Calibration', calibrationSchema);
