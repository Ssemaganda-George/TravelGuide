import Link from "next/link";

interface BreadcrumbsProps {
  items: { label: string; href: string }[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb" style={{ marginBottom: 20, fontSize: "0.9rem" }}>
      <ol style={{ display: "flex", flexWrap: "wrap", gap: "6px", listStyle: "none", padding: 0, margin: 0, color: "var(--muted)" }}>
        {items.map((item, i) => (
          <li key={item.href} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <Link href={item.href} style={{ color: "var(--lake)", textDecoration: "none" }}>{item.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
