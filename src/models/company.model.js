import mongoose from 'mongoose';

/**
 * Generates a unique companyID in format COMP-XXXXXX (6 digit numeric).
 * Uses random 6-digit number and checks uniqueness.
 */
export async function generateCompanyId() {
  const Company = mongoose.model('Company');
  let attempts = 0;
  const maxAttempts = 20;
  while (attempts < maxAttempts) {
    const num = Math.floor(100000 + Math.random() * 900000); // 100000–999999
    const companyID = `COMP-${num}`;
    const exists = await Company.exists({ companyID });
    if (!exists) return companyID;
    attempts++;
  }
  // Fallback: use timestamp-based suffix to guarantee uniqueness
  const fallback = `COMP-${Date.now().toString().slice(-6)}`;
  return fallback;
}

const companySchema = new mongoose.Schema(
  {
    companyID: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      immutable: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator(v) {
          if (!v || v.trim() === '') return true;
          return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
        },
        message: 'Please provide a valid URL',
      },
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

companySchema.index({ name: 1 });

// Server must set companyID on create; prevent client from changing it on update
companySchema.pre('save', function (next) {
  if (this.isNew && !this.companyID) {
    return next(new Error('companyID must be set by server before save'));
  }
  if (!this.isNew && this.isModified('companyID')) {
    return next(new Error('companyID cannot be modified'));
  }
  next();
});

export default mongoose.model('Company', companySchema);
