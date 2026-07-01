"use client";

import { Suspense } from "react";

import { MapView } from "./MapView";
import { ResultsPanel } from "./ResultsPanel";
import { SearchForm } from "./SearchForm";
import { useSearchWorkspace } from "../_hooks/useSearchWorkspace";

function SearchPageContent() {
  const search = useSearchWorkspace();

  if (!search.hasCheckedSavedState) {
    return <main className="app" />;
  }

  return (
    <main className={search.hasResults ? "app resultsMode" : "app"}>
      {search.hasResults && (
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
          <div className={search.listMode === "empty" ? "workspaceBody mapOnly" : "workspaceBody"}>
            <MapView
              center={search.center}
              buildings={search.markerBuildings}
              filters={search.filters}
              detailPanelOpen={search.detailPanelOpen}
              resultsPanelOpen={search.listMode !== "empty"}
              selectedId={search.selectedId}
              onSelect={search.handleMarkerSelect}
              onFiltersApply={search.applyFilters}
              onBoundsChange={search.fetchBuildingsInBounds}
              onMapMove={search.handleMapMove}
              onViewportChange={search.handleMapViewportChange}
              boundsRefreshKey={search.boundsRefreshKey}
            />
            {search.listMode !== "empty" && (
              <ResultsPanel
                displayedBuildings={search.displayedBuildings}
                selectedId={search.selectedId}
                resultCount={search.resultCount}
                listLoading={search.listLoading}
                error={search.error}
                onLoadMore={search.fetchNextClusterListPage}
                onClose={search.handleCloseResultsPanel}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export function SearchPageClient() {
  return (
    <Suspense fallback={<main className="app" />}>
      <SearchPageContent />
    </Suspense>
  );
}
