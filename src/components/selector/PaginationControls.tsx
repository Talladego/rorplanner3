import React, { memo } from 'react';

export interface PaginationControlsProps {
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageHistoryLength: number;
  onPrev: () => void;
  onNext: () => void;
  pageSizeOptions?: number[];
  onChangePageSize?: (n: number) => void;
}

// eslint-disable-next-line react/display-name
export const PaginationControls: React.FC<PaginationControlsProps> = memo(({ 
  loading,
  totalCount,
  currentPage,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  pageHistoryLength,
  onPrev,
  onNext,
  pageSizeOptions,
  onChangePageSize,
}) => {
  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const safeStart = totalCount === 0 ? 0 : startItem;
  const safeEnd = totalCount === 0 ? 0 : endItem;
  const maxPage = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 min-h-[2rem]">
      {loading ? (
        <p className="text-secondary text-sm">Loading items...</p>
      ) : (
        <div className="grid grid-cols-3 items-center w-full">
          <div className="flex items-center gap-3 justify-self-start">
            {pageSizeOptions && onChangePageSize ? (
              <label className="inline-flex items-center gap-1 text-xs text-muted">
                <span>Items per page</span>
                <select
                  className="form-input form-input-text text-xs py-0.5 px-1 rounded"
                  value={pageSize}
                  onChange={(e) => onChangePageSize(Number(e.currentTarget.value))}
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="text-xs text-muted text-center justify-self-center">
            {safeStart}-{safeEnd} of {totalCount}
          </div>
          <div className="flex items-center space-x-1 justify-self-end">
            <button
              onClick={onPrev}
              disabled={!hasPreviousPage && currentPage === 1 && pageHistoryLength === 0}
              className="btn btn-primary btn-sm"
            >
              Prev
            </button>
            
            <span className="text-xs text-muted px-1">
              {currentPage}
            </span>
            
            <button
              onClick={onNext}
              disabled={!hasNextPage && currentPage >= maxPage}
              className="btn btn-primary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});


export default PaginationControls;
