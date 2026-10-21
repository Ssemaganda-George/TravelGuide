export default function CountryLoading() {
  return (
    <div className="wrap page">
      <h1 className="page-title">Loading destinations…</h1>
      <div className="skeleton-grid">
        {[1, 2, 3, 4, 5, 6].map(() => (
          <div key={Math.random()} className="skeleton-card">
            <div className="skeleton-img" />
            <div className="skeleton-body">
              <div className="skeleton-line skeleton-wide" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-short" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
