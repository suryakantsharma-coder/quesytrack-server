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
        'pressure',
        'temperature',
        'flow',
        'vacuum',
        'electrical',
        'mechanical',
        'other',
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
      enum: ['NIST', 'ISO', 'NABL', 'None', 'UKAS', 'NABL'],
      default: 'NIST',
    },

    nominalSize: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'under calibration', 'retired'],
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
