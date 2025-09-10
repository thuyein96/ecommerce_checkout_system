'use client'
import PersonIcon from "@mui/icons-material/Person";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Stack } from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Welcome</h1>
      <nav>
        <Stack direction="row" spacing={3}>
          <Link href="/checkout" style={{display:"inline-flex",alignItems:"center",gap:8}}>
            <ShoppingCartIcon fontSize="small" /> Go to Checkout
          </Link>
          <Link href="/profile" style={{display:"inline-flex",alignItems:"center",gap:8}}>
            <PersonIcon fontSize="small" /> Profile
          </Link>
        </Stack>
      </nav>
    </main>
  );
}
