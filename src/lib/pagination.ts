export const LISTING_PAGE_SIZE = 6;

type ListItem = {
  id: string;
  featured?: boolean;
};

export type PaginationToken =
  | { type: 'page'; value: number }
  | { type: 'ellipsis'; value: string };

export function getPaginatedListing<T extends ListItem>(
  items: T[],
  currentPage = 1,
  pageSize = LISTING_PAGE_SIZE,
) {
  const leadItem = items.find((item) => item.featured) || items[0];
  const remainingItems = leadItem
    ? items.filter((item) => item.id !== leadItem.id)
    : [...items];

  const totalPages = Math.max(1, Math.ceil(remainingItems.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safeCurrentPage - 1) * pageSize;
  const entries = remainingItems.slice(start, start + pageSize);

  return {
    leadItem: safeCurrentPage === 1 ? leadItem : undefined,
    entries,
    currentPage: safeCurrentPage,
    totalPages,
    totalEntries: remainingItems.length,
  };
}

export function buildPaginationTokens(
  currentPage: number,
  totalPages: number,
): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: 'page' as const,
      value: index + 1,
    }));
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const clamped = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const tokens: PaginationToken[] = [];

  for (let index = 0; index < clamped.length; index += 1) {
    const page = clamped[index];
    const previous = clamped[index - 1];

    if (previous && page - previous > 1) {
      tokens.push({
        type: 'ellipsis',
        value: `${previous}-${page}`,
      });
    }

    tokens.push({
      type: 'page',
      value: page,
    });
  }

  return tokens;
}

export function buildPageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}page/${page}/`;
}

export function getAdditionalPageParams(totalPages: number) {
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}
