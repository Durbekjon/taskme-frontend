import type { Metadata } from 'next';
import LegalPage, { COMPANY } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>This policy explains what {COMPANY.name} collects, why, and the choices you have.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><b>Account data</b> — name, email address and profile photo from Google Sign‑In, or the email and password you register with.</li>
        <li><b>Phone number</b> — used to verify your account with a one‑time code sent over WhatsApp and to send booking notifications.</li>
        <li><b>Workspace data</b> — bookings, crew, invoices, payments and files you create in the service.</li>
        <li><b>Technical data</b> — logs and device information needed to keep the service secure and working.</li>
      </ul>

      <h2>Google user data</h2>
      <p>
        If you sign in with Google we request access to your basic profile, email address and Google Calendar.
        Calendar access is used only to read your events so they can be shown alongside your bookings and to
        avoid scheduling conflicts. We do not use Google user data for advertising, we do not sell it, and we do
        not allow humans to read it except with your consent, for security purposes, or where required by law.
      </p>
      <p>
        {COMPANY.name}&apos;s use and transfer of information received from Google APIs adheres to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Google API Services User Data Policy
        </a>, including the Limited Use requirements.
      </p>
      <p>
        You can revoke access at any time from your{' '}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Google Account permissions</a>.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To provide, maintain and secure the service.</li>
        <li>To verify your identity and send transactional messages (codes, confirmations, reminders).</li>
        <li>To respond to support requests.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We share data only with service providers that help us run {COMPANY.name} (hosting, WhatsApp Business
        messaging by Meta, email delivery), with members of your own workspace, or when required by law.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        We keep your data while your account is active. You can delete your account at any time from
        Settings → Profile (web) or Profile (mobile app): your personal details are removed immediately, while
        bookings and payments you took part in remain with the studio without identifying you. You can also
        write to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and we will complete deletion within 30 days. Stored Google tokens are deleted immediately when you disconnect Google or delete your account.
      </p>

      <h2>Security</h2>
      <p>Data is encrypted in transit (HTTPS) and access is limited to staff who need it to run the service.</p>

      <h2>Contact</h2>
      <p>Questions about this policy: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.</p>
    </LegalPage>
  );
}
