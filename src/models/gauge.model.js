const mongoose = require('mongoose');

const gaugeSchema = new mongoose.Schema(
  {
    gaugeName: {
      type: String,
      required: [true, 'Gauge name is required'],
      trim: true,
    },

    gaugeType: {
      type: String,
      required: [true, 'Gauge type is required'],
      enum: [
        'Pressure',
        'Temperature',
        'Flow',
        'Vacuum',
        'Electrical',
        'Mechanical',
        'Other',
      ],
    },

    gaugeModel: {
      type: String,
      trim: true,
      default: '',
    },

    manufacturer: {
      type: String,
      trim: true,
      default: '',
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    traceability: {
      type: String,
      enum: ['NIST', 'ISO', 'NABL', 'None'],
      default: 'NIST',
    },

    nominalSize: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Under Calibration', 'Retired'],
      default: 'Active',
    },

    image: {
      type: String, // store image URL or file path
      default: '',
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Gauge', gaugeSchema);
