import Link from 'next/link';
import { Footer } from './Landing';

/** Edit these before submitting to Google / Meta / the app stores. */
export const COMPANY = {
  name: 'Task.me',
  email: 'support@gettask.me',
  updated: 'November 16, 2026',
};

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <main className="px-4 pt-10 pb-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-black">← Task.me</Link>
          <article className="glass rounded-[2rem] mt-6 p-6 sm:p-10 text-gray-700 leading-relaxed [&_h2]:text-gray-950 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mt-3 [&_a]:underline">
            <h1 className="text-4xl font-bold tracking-tight text-gray-950">{title}</h1>
            <p className="text-sm text-gray-500 mt-2">Last updated: {COMPANY.updated}</p>
            {children}
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
