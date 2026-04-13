import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ currentPage, totalPages, onPageChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(i);
              }}
              href="#"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Logic for ellipsis
      const startPages = [1, 2];
      const endPages = [totalPages - 1, totalPages];
      const middlePages = [currentPage - 1, currentPage, currentPage + 1].filter(
        (p) => p > 2 && p < totalPages - 1
      );

      // Start
      startPages.forEach((p) => {
        pages.push(
          <PaginationItem key={p}>
            <PaginationLink
              isActive={currentPage === p}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(p);
              }}
              href="#"
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        );
      });

      // Left ellipsis
      if (currentPage > 4) {
        pages.push(
          <PaginationItem key="ellipsis-left">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else if (currentPage === 4) {
        pages.push(
            <PaginationItem key={3}>
              <PaginationLink
                isActive={currentPage === 3}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(3);
                }}
                href="#"
              >
                3
              </PaginationLink>
            </PaginationItem>
          );
      }

      // Middle
      middlePages.forEach((p) => {
        if (!startPages.includes(p) && !endPages.includes(p)) {
          pages.push(
            <PaginationItem key={p}>
              <PaginationLink
                isActive={currentPage === p}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
                href="#"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          );
        }
      });

      // Right ellipsis
      if (currentPage < totalPages - 3) {
        pages.push(
          <PaginationItem key="ellipsis-right">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else if (currentPage === totalPages - 3) {
        pages.push(
            <PaginationItem key={totalPages - 2}>
              <PaginationLink
                isActive={currentPage === totalPages - 2}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(totalPages - 2);
                }}
                href="#"
              >
                {totalPages - 2}
              </PaginationLink>
            </PaginationItem>
          );
      }

      // End
      endPages.forEach((p) => {
        pages.push(
          <PaginationItem key={p}>
            <PaginationLink
              isActive={currentPage === p}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(p);
              }}
              href="#"
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        );
      });
    }

    return pages;
  };

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            href="#"
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem>
          <PaginationNext
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            href="#"
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
