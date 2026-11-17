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
        In the web app open <b>Settings → Profile → Delete account</b>; in the mobile app open
        <b> Profile → Delete account</b>. Your personal data is removed immediately and you are signed out
        everywhere. If you can no longer sign in, email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from
        your account address and we will delete it within 30 days.
      </p>
      <h2>Disconnect Google</h2>
      <p>
        Remove Task.me from your{' '}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Google Account permissions</a>.
      </p>
    </LegalPage>
  );
}
