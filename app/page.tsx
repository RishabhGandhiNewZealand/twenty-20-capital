import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Portfolio Value</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '2rem', margin: '2rem 0', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <span style={{ color: '#888' }}>[Graph Placeholder]</span>
      </div>
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        <Link href="/analyses">Analyses</Link>
        <Link href="/reports">Progress Reports</Link>
        <Link href="/about">About</Link>
      </nav>
    </main>
  );
}
