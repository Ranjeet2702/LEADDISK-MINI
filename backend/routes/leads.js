const express = require('express');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const Lead = require('../models/Lead');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public form is the one route anyone on the internet can hit - keep it
// tightly rate limited so it can't be used to spam the database.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many submissions from this device, try again later' },
});

function validateLeadInput(body) {
  const errors = {};
  const { name, email, budgetRange, message } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  if (!email || !validator.isEmail(String(email))) {
    errors.email = 'Enter a valid email address';
  }
  if (!Lead.BUDGET_RANGES.includes(budgetRange)) {
    errors.budgetRange = 'Select a valid budget range';
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  }

  return errors;
}

// POST /api/leads - public lead submission from the landing page
router.post('/', submitLimiter, async (req, res) => {
  try {
    const errors = validateLeadInput(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', fields: errors });
    }

    const lead = await Lead.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      budgetRange: req.body.budgetRange,
      message: req.body.message.trim(),
    });

    return res.status(201).json({
      message: 'Thanks - we will be in touch shortly.',
      lead: { id: lead._id, createdAt: lead.createdAt },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.message });
    }
    console.error('Lead creation error:', err);
    return res.status(500).json({ error: 'Something went wrong, please try again' });
  }
});

// GET /api/leads - admin only, supports ?search= and ?status=
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status && Lead.STATUSES.includes(status)) {
      filter.status = status;
    }
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(500);
    return res.json({ leads, count: leads.length });
  } catch (err) {
    console.error('Lead listing error:', err);
    return res.status(500).json({ error: 'Something went wrong, please try again' });
  }
});

// PATCH /api/leads/:id/status - admin only, moves a lead through the pipeline
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!Lead.STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status must be one of: ' + Lead.STATUSES.join(', ') });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    return res.json({ lead });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid lead id' });
    }
    console.error('Lead status update error:', err);
    return res.status(500).json({ error: 'Something went wrong, please try again' });
  }
});

module.exports = router;
