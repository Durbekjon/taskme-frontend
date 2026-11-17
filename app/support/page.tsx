import type { Metadata } from 'next';
import LegalPage, { COMPANY } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Support' };

export default function SupportPage() {
  return (
    <LegalPage title="Support">
      <p>
        Need help? Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and we usually reply within one
        business day.
      </p>
      <h2>Delete your account</h2>
      <p>
        Send a request from your account email to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> with the
        subject &quot;Delete my account&quot;. Your account and data are removed within 30 days.
      </p>
      <h2>Disconnect Google</h2>
      <p>
        Remove Task.me from your{' '}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Google Account permissions</a>.
      </p>
    </LegalPage>
  );
}
