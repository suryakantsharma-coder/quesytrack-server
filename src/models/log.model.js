import mongoose from 'mongoose';

/**
 * Audit Log Schema (immutable - no update/delete).
 * Indexed for logs API filters and default sort.
 */
const logSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'UPLOAD',
        'REVOKE_ACCESS',
        'PERMISSION_CHANGE',
        'ROLE_CHANGE',
        'USER_CREATED',
        'USER_UPDATED',
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['USER', 'PROJECT', 'GAUGE', 'CALIBRATION', 'REPORT'],
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    entityName: {
      type: String,
      default: '',
      trim: true,
    },
    performedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    performedByUserName: {
      type: String,
      default: '',
      trim: true,
    },
    performedByCompany: {
      type: String,
      default: '',
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: false,
      index: true,
    },
    previousData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'logs',
  }
);

logSchema.index({ createdAt: -1 });
logSchema.index({ entityType: 1, createdAt: -1 });
logSchema.index({ performedByUserId: 1, createdAt: -1 });
logSchema.index({ company: 1, createdAt: -1 });

export default mongoose.model('Log', logSchema);
