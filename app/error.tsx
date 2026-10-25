"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wrap page">
      <h1>Something went wrong!</h1>
      <button className="go" onClick={reset}>Try again</button>
    </div>
  );
}