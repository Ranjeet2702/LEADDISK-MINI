import { useState } from 'react';
import { api } from '../api.js';

const BUDGET_OPTIONS = [
  { value: '', label: 'Select a range' },
  { value: 'under_1k', label: 'Under $1,000' },
  { value: '1k_5k', label: '$1,000 – $5,000' },
  { value: '5k_15k', label: '$5,000 – $15,000' },
  { value: '15k_plus', label: '$15,000+' },
];

const initialForm = { name: '', email: '', budgetRange: '', message: '' };

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.budgetRange) errors.budgetRange = 'Choose a budget range.';
  if (form.message.trim().length < 10) errors.message = 'Tell us a bit more — at least 10 characters.';
  return errors;
}

export default function LeadForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [ticket, setTicket] = useState(null);
  const [serverError, setServerError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setStatus('submitting');
    setServerError('');
    try {
      const res = await api.submitLead(form);
      setTicket(res.lead);
      setStatus('done');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      if (err.fields) setErrors(err.fields);
      setServerError(err.message || 'Something went wrong. Try again in a moment.');
    }
  }

  if (status === 'done' && ticket) {
    const ref = String(ticket.id).slice(-6).toUpperCase();
    return (
      <div className="ticket" role="status">
        <div className="ticket__row">
          <span className="ticket__label">Inquiry logged</span>
          <span className="ticket__ref">#{ref}</span>
        </div>
        <p className="ticket__body">
          We've filed your request at the desk. Expect a reply from a human, not an autoresponder,
          within one business day.
        </p>
        <button type="button" className="btn btn--ghost" onClick={() => setStatus('idle')}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && <span className="field__error" id="name-error">{errors.name}</span>}
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && <span className="field__error" id="email-error">{errors.email}</span>}
      </div>

      <div className="field">
        <label htmlFor="budgetRange">Budget range</label>
        <select
          id="budgetRange"
          name="budgetRange"
          value={form.budgetRange}
          onChange={handleChange}
          aria-invalid={Boolean(errors.budgetRange)}
        >
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.budgetRange && <span className="field__error">{errors.budgetRange}</span>}
      </div>

      <div className="field">
        <label htmlFor="message">What are you looking to build?</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && <span className="field__error" id="message-error">{errors.message}</span>}
      </div>

      {serverError && <p className="form__server-error">{serverError}</p>}

      <button type="submit" className="btn btn--primary" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Filing your request…' : 'Send to the desk'}
      </button>
    </form>
  );
}
