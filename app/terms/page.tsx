import type { Metadata } from 'next';
import LegalPage, { COMPANY } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>By using {COMPANY.name} you agree to these terms.</p>

      <h2>The service</h2>
      <p>{COMPANY.name} helps creative studios and freelancers manage bookings, crews, invoices and payments.</p>

      <h2>Your account</h2>
      <ul>
        <li>You must provide accurate information and keep your login secure.</li>
        <li>You are responsible for activity in your account and workspace.</li>
        <li>You must be at least 16 years old to use the service.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own the data you put into {COMPANY.name}. You give us permission to store and process it only to run
        the service for you.
      </p>

      <h2>Acceptable use</h2>
      <p>Do not misuse the service, attempt to access other workspaces, send spam, or break the law.</p>

      <h2>Payments</h2>
      <p>Invoices and payment records in {COMPANY.name} are tools for your business; you remain responsible for your own tax and accounting obligations.</p>

      <h2>Termination</h2>
      <p>You can stop using the service at any time. We may suspend accounts that violate these terms.</p>

      <h2>Disclaimer</h2>
      <p>The service is provided &quot;as is&quot;. To the extent permitted by law we are not liable for indirect or consequential losses.</p>

      <h2>Changes</h2>
      <p>We may update these terms and will notify you of material changes.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
    </LegalPage>
  );
}
