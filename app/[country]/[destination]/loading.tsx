export default function DestinationLoading() {
  return (
    <div className="wrap page">
      <h1 className="page-title">Loading destination…</h1>
      <div className="skeleton-grid">
        <div className="skeleton-line skeleton-wide" />
        <div className="skeleton-line skeleton-medium" />
        <div className="skeleton-line skeleton-short" />
        <div className="skeleton-img skeleton-wide" />
        <div className="skeleton-line skeleton-medium" />
        <div className="skeleton-line skeleton-medium" />
        <div className="skeleton-line skeleton-short" />
        <div className="skeleton-img" />
      </div>
    </div>
  );
}
