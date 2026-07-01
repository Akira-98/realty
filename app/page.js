import { LandingView } from "./_components/LandingView";
import { SearchPageClient } from "./_components/SearchPageClient";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const hasSearchState = Boolean(params?.q && params?.lat && params?.lng);

  if (!hasSearchState) {
    return (
      <main className="app">
        <LandingView />
      </main>
    );
  }

  return <SearchPageClient />;
}
