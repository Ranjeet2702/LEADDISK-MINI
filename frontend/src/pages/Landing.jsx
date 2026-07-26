import LeadForm from '../components/LeadForm.jsx';

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__header">
        <span className="wordmark">LeadDesk</span>
        <span className="wordmark__mini">Mini</span>
      </header>

      <main className="landing__hero">
        <div className="landing__copy">
          <p className="eyebrow">Project intake — open now</p>
          <h1>
            Tell us what you're building.
            <br />
            We'll take it from here.
          </h1>
          <p className="lede">
            One form, one desk, one person reading every submission. No queue of bots,
            no chatbot triage — just a straight line from your message to someone who can
            actually scope the work.
          </p>
        </div>

        <div className="landing__form-card">
          <LeadForm />
        </div>
      </main>

      <footer className="landing__footer">
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          className="credit-line"
        >
          Built for Digital Heroes Training Task
        </a>
      </footer>
    </div>
  );
}
