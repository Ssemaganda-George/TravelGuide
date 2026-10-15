import Country from "./[country]/page";

export const revalidate = 3600;
// Home shows Uganda for now. Add a country picker when a second country exists.
export default async function Home() {
  return Country({ params: Promise.resolve({ country: "uganda" }) });
}
