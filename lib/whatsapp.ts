export function whatsappUrl({ title?: string, url?: string } = {}): string | null {
  const number = process.env.NEXT_PUBLIC_WHATSAPP;
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;

  const message = title || url
    ? `Hi, I'm interested in ${title}. ${url}`
    : "Hi, I have a question about travelling here.";
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}