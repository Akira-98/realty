"use client";

import { Suspense } from "react";

import { LandingView } from "./_components/LandingView";
import { MapView } from "./_components/MapView";
import { ResultsPanel } from "./_components/ResultsPanel";
import { SearchForm } from "./_components/SearchForm";
import { useSearchWorkspace } from "./_hooks/useSearchWorkspace";

function HomeContent() {
  const search = useSearchWorkspace();

  if (!search.hasCheckedSavedState) {
    return <main className="app" />;
  }

  return (
    <main className={search.hasResults ? "app resultsMode" : "app"}>
      {!search.hasResults ? (
        <LandingView />
      ) : (
        <section className="searchWorkspace">
          <header className="resultsHeader">
            <button
              type="button"
              className="brand brandButton"
              onClick={search.resetToLanding}
            >
              REALTY FIND
            </button>
            <SearchForm
              query={search.query}
              setQuery={search.setQuery}
              onSearch={search.handleSearch}
              loading={search.loading}
              compact
            />
          </header>
          <div className="workspaceBody">
            <MapView
              center={search.center}
              buildings={search.markerBuildings}
              filters={search.filters}
              selectedId={search.selectedId}
              onSelect={search.handleMarkerSelect}
              onFiltersApply={search.applyFilters}
              onFiltersReset={search.resetListingFilters}
              onBoundsChange={search.fetchBuildingsInBounds}
              onMapMove={search.handleMapMove}
              onViewportChange={search.handleMapViewportChange}
              boundsRefreshKey={search.boundsRefreshKey}
            />
            <ResultsPanel
              center={search.center}
              displayedBuildings={search.displayedBuildings}
              selectedId={search.selectedId}
              selectedBuilding={search.selectedBuilding}
              resultCount={search.resultCount}
              listLoading={search.listLoading}
              error={search.error}
              onLoadMore={search.fetchNextListPage}
            />
          </div>
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="app" />}>
      <HomeContent />
    </Suspense>
  );
}
