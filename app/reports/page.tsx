import Link from 'next/link';

export default function ReportsPage() {
  // Placeholder: List of markdown files (to be replaced with dynamic reading in production)
  const files = [
    { name: 'Q1 2024', file: 'q1-2024.md' },
    { name: '2023 Yearly', file: '2023-yearly.md' },
  ];
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Progress Reports</h1>
      <ul>
        {files.map(f => (
          <li key={f.file}>
            <Link href={`/reports/${f.file.replace('.md', '')}`}>{f.name}</Link>
          </li>
        ))}
      </ul>
      <Link href="/">Back to Home</Link>
    </main>
  );
} 