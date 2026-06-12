export function Pagination({ currentPage, loading, pages, totalPages, onPage }) {
  return (
    <nav className="adminPagination" aria-label="매물 페이지">
      <button
        type="button"
        aria-label="첫 페이지"
        disabled={loading || currentPage === 1}
        onClick={() => onPage(1)}
      >
        |&lt;
      </button>
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={loading || currentPage === 1}
        onClick={() => onPage(currentPage - 1)}
      >
        &lt;
      </button>
      {pages[0] > 1 && <span>...</span>}
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={page === currentPage ? "active" : ""}
          disabled={loading || page === currentPage}
          onClick={() => onPage(page)}
        >
          {page}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages && <span>...</span>}
      <button
        type="button"
        aria-label="다음 페이지"
        disabled={loading || currentPage === totalPages}
        onClick={() => onPage(currentPage + 1)}
      >
        &gt;
      </button>
      <button
        type="button"
        aria-label="마지막 페이지"
        disabled={loading || currentPage === totalPages}
        onClick={() => onPage(totalPages)}
      >
        &gt;|
      </button>
    </nav>
  );
}
