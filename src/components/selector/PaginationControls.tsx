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
}) => {
  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const maxPage = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 min-h-[2rem]">
      {loading ? (
        <p className="text-secondary text-sm">Loading items...</p>
      ) : totalCount > pageSize ? (
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted">
            {startItem}-{endItem} of {totalCount}
          </div>
          <div className="flex items-center space-x-1">
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
      ) : null}
    </div>
  );
});


export default PaginationControls;
