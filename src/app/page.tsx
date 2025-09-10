import Link from "next/link";

export default function Home() {
  return (
    <>
      <main style={{ padding: 24 }}>
      <h1>Welcome</h1>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <Link href="/checkout" style={{ padding: '8px 16px', backgroundColor: '#0891b2', color: 'white', textDecoration: 'none', borderRadius: '6px', textAlign: 'center' }}>
          Go to Checkout
        </Link>
      </nav>
    </main>
    </>
  );
}
