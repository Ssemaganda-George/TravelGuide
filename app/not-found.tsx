import Link from "next/link";
export const dynamic = "force-static";
export default function NotFound() {
  return <div className="wrap page"><h1>Page not found</h1><p>It may have moved. <Link href="/">See all destinations</Link>.</p></div>;
}
