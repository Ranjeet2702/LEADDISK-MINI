const mongoose = require('mongoose');

const BUDGET_RANGES = ['under_1k', '1k_5k', '5k_15k', '15k_plus'];
const STATUSES = ['New', 'Contacted', 'Closed'];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name is too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    budgetRange: {
      type: String,
      required: [true, 'Budget range is required'],
      enum: {
        values: BUDGET_RANGES,
        message: 'Budget range must be one of: ' + BUDGET_RANGES.join(', '),
      },
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message should be at least 10 characters'],
      maxlength: [2000, 'Message is too long'],
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'New',
    },
  },
  { timestamps: true }
);

// Speeds up admin search-by-name/email and the default "newest first" sort
leadSchema.index({ name: 'text', email: 'text' });
leadSchema.index({ createdAt: -1 });

leadSchema.statics.BUDGET_RANGES = BUDGET_RANGES;
leadSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Lead', leadSchema);
