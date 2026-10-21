import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page">
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/" className="go">Go home</Link>
    </div>
  );
}