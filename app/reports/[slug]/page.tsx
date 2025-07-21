import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';

export default async function ReportPage({ params }: { params: { slug: string } }) {
  const filePath = path.join(process.cwd(), 'app', 'reports', `${params.slug}.md`);
  let source = '';
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    notFound();
  }
  return (
    <main style={{ padding: '2rem' }}>
      <MDXRemote source={source} />
      <Link href="/reports">Back to Reports</Link>
    </main>
  );
} 