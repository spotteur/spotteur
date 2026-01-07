import { parseAsIndex, parseAsInteger, useQueryStates } from 'nuqs'
import { useCallback } from 'react'

export function usePagination({ defaultPageIndex = 0, defaultPageSize = 5 }) {
  const [pagination, setPagination] = useQueryStates(
    {
      pageIndex: parseAsIndex.withDefault(defaultPageIndex),
      pageSize: parseAsInteger.withDefault(defaultPageSize),
    },
    {
      urlKeys: {
        pageIndex: 'page',
        pageSize: 'perPage',
      },
    },
  )

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: defaultPageIndex }))
  }, [setPagination, defaultPageIndex])

  const { pageSize, pageIndex } = pagination

  return {
    onPaginationChange: setPagination,
    resetPagination,
    pagination,
    pageSize,
    pageIndex,
    page: pageIndex + 1,
  }
}
