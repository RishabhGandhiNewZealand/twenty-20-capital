import Link from 'next/link';

export default function AboutPage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>About</h1>
      <p>This is a personal website to track my portfolio, analyses, and progress reports.</p>
      <Link href="/">Back to Home</Link>
    </main>
  );
} 