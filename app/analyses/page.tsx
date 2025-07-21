import Link from 'next/link';

export default function AnalysesPage() {
  // Placeholder: List of markdown files (to be replaced with dynamic reading in production)
  const files = [
    { name: 'Apple', file: 'apple.md' },
    { name: 'Google', file: 'google.md' },
  ];
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Company Analyses</h1>
      <ul>
        {files.map(f => (
          <li key={f.file}>
            <Link href={`/analyses/${f.file.replace('.md', '')}`}>{f.name}</Link>
          </li>
        ))}
      </ul>
      <Link href="/">Back to Home</Link>
    </main>
  );
} 