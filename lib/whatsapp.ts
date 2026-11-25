export function whatsappUrl({ title, path }: { title?: string; path?: string } = {}): string | null {
  const number = process.env.NEXT_PUBLIC_WHATSAPP;
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;

  const isDestination = Boolean(path && path.startsWith('/') && path !== '/' && !path.startsWith('/admin'));
  const message = isDestination
    ? `Hi, I'm interested in this destination. ${path}`
    : "Hi, I'd like help planning a trip to Uganda.";
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}

export function whatsappMessage({ title, path }: { title?: string; path?: string } = {}): string {
  const isDestination = Boolean(path && path.startsWith('/') && path !== '/' && !path.startsWith('/admin'));
  return isDestination
    ? `Hi, I'm interested in this destination. ${path}`
    : "Hi, I'd like help planning a trip to Uganda.";
}
