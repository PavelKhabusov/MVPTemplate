export type QueryResult<T> = {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export type QueryState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'empty'; message?: string }
  | { status: 'success'; data: T; children?: never }

export function useQueryState<T>(
  query: QueryResult<T>,
  options?: { emptyCheck?: (data: T) => boolean; emptyMessage?: string }
): QueryState<T> {
  if (query.isLoading) {
    return { status: 'loading' }
  }

  if (query.isError) {
    return {
      status: 'error',
      message: query.error?.message ?? 'Something went wrong',
      onRetry: query.refetch,
    }
  }

  const data = query.data
  if (!data) {
    return { status: 'empty', message: options?.emptyMessage }
  }

  const isEmpty = options?.emptyCheck?.(data) ?? false
  if (isEmpty) {
    return { status: 'empty', message: options?.emptyMessage }
  }

  return { status: 'success', data }
}
