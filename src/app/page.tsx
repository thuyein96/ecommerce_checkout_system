import Link from "next/link";

export default function Home() {
  return (
    <>
      <main style={{ padding: 24 }}>
      <h1>Welcome</h1>
      <nav>
        <Link href="/checkout">Go to Checkout</Link>
      </nav>
    </main>
    </>
  );
}
