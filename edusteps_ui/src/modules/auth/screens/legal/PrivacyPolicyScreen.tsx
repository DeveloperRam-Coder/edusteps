import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyScreen() {
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
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
        </div>
      </div>

      <div className="surface-elevated rounded-2xl p-6 space-y-6 text-sm text-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information you provide directly — such as your name, email address, phone number,
            and business details — when you register or update your profile. We also collect usage data
            such as login timestamps and IP addresses for security purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            Your data is used to operate and improve InternSteps, send transactional notifications
            (attendance alerts, fee reminders), and provide customer support. We do not sell your
            personal data to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Data Storage & Security</h2>
          <p className="text-muted-foreground">
            All data is stored in encrypted PostgreSQL databases. Passwords are hashed using bcrypt.
            JWT tokens are short-lived and stored in session storage only. We use HTTPS for all
            data in transit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Notifications & Marketing</h2>
          <p className="text-muted-foreground">
            You can control email notifications, SMS reminders, and marketing emails from your
            Profile &gt; Preferences settings. Transactional emails (password reset, fee reminders)
            cannot be disabled as they are essential to the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your data for as long as your account is active. You may delete your account
            at any time from Profile &gt; Danger Zone. Upon deletion, all personal data is permanently
            removed within 30 days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. Contact</h2>
          <p className="text-muted-foreground">
            For privacy-related queries, contact us via the Support section in your profile or
            email <span className="text-primary">privacy@internsteps.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
