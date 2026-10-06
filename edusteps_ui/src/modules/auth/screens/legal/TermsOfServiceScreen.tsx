import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfServiceScreen() {
  const navigate = useNavigate();

  return (
    <div className="content-sequence p-4 md:p-6 max-w-3xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
        </div>
      </div>

      <div className="surface-elevated rounded-2xl p-6 space-y-6 text-sm text-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By creating an account and using InternSteps, you agree to these Terms of Service.
            If you do not agree, please do not use the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Use of Service</h2>
          <p className="text-muted-foreground">
            InternSteps is a SaaS platform for coaching institutes to manage students, courses,
            attendance, and payments. You may use the service only for lawful purposes and in
            accordance with these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Account Responsibility</h2>
          <p className="text-muted-foreground">
            You are responsible for maintaining the confidentiality of your account credentials.
            You are responsible for all activity that occurs under your account. Notify us
            immediately of any unauthorized use.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Data Ownership</h2>
          <p className="text-muted-foreground">
            You retain full ownership of all data you enter into InternSteps — student records,
            payment data, attendance records, and course information. We do not claim ownership
            of your data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. Service Availability</h2>
          <p className="text-muted-foreground">
            We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled
            maintenance will be communicated in advance where possible.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. Termination</h2>
          <p className="text-muted-foreground">
            You may terminate your account at any time. We reserve the right to suspend or
            terminate accounts that violate these terms. Upon termination, your data will be
            deleted per our Privacy Policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">7. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these terms, contact us at{' '}
            <span className="text-primary">legal@internsteps.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
