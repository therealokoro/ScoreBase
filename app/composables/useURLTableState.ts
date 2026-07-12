import { refDebounced, useDebounceFn } from "@vueuse/core"

interface BaseOptions {
  searchKey?: string
  pageKey?: string
  sizeKey?: string
  defaultPageSize?: number
}

interface ClientOptions extends BaseOptions {
  mode: "client"
}

interface ServerOptions extends BaseOptions {
  mode: "server"
  /** Debounce delay for search in ms before it triggers a refetch. Default: 300 */
  debounce?: number
}

type UseUrlTableStateOptions = ClientOptions | ServerOptions

// ---------------------------------------------------------------------------
// Client mode — URL is the single source of truth.
// All state is derived via computed getters/setters that read/write
// route.query directly. router.replace is used so filter/page interactions
// don't pollute the browser history stack.
// ---------------------------------------------------------------------------
function useClientState(opts: Required<BaseOptions>) {
  const route = useRoute()
  const router = useRouter()

  const { searchKey, pageKey, sizeKey, defaultPageSize } = opts

  const search = computed({
    get: () => (route.query[searchKey] as string) || "",
    set: (val) =>
      router.replace({
        query: {
          ...route.query,
          [searchKey]: val || undefined,
          // Reset page whenever search changes so user lands on first page
          [pageKey]: undefined
        }
      })
  })

  // Page is 1-based in the URL, 0-based for TanStack Table internally
  const _page = computed({
    get: () => Math.max(1, Number(route.query[pageKey]) || 1),
    set: (val) =>
      router.replace({
        query: {
          ...route.query,
          [pageKey]: val > 1 ? String(val) : undefined
        }
      })
  })

  const _size = computed({
    get: () => Number(route.query[sizeKey]) || defaultPageSize,
    set: (val) =>
      router.replace({
        query: {
          ...route.query,
          [sizeKey]: val !== defaultPageSize ? String(val) : undefined,
          // Reset page when page size changes — current page may no longer exist
          [pageKey]: undefined
        }
      })
  })

  // TanStack Table expects 0-based pageIndex
  const pagination = computed(() => ({
    pageIndex: _page.value - 1,
    pageSize: _size.value
  }))

  function onPaginationChange(p: { pageIndex: number; pageSize: number }) {
    // Only write to URL if values actually changed — avoids redundant replaces
    // that would trigger unnecessary route watchers elsewhere on the page
    if (p.pageIndex !== pagination.value.pageIndex) _page.value = p.pageIndex + 1
    if (p.pageSize !== pagination.value.pageSize) _size.value = p.pageSize
  }

  function onFilterChange(val: any) {
    search.value = val
  }

  return {
    search,
    page: _page,
    pageSize: _size,
    pagination,
    onPaginationChange,
    onFilterChange
  }
}

// ---------------------------------------------------------------------------
// Server mode — local refs stay in sync with the URL bidirectionally.
// router.push is used (not replace) so the user can navigate back through
// meaningful filter states. Writes are debounced to collapse rapid clicks
// into a single history entry.
// ---------------------------------------------------------------------------
function useServerState(opts: Required<BaseOptions> & { debounce: number }) {
  const route = useRoute()
  const router = useRouter()

  const { searchKey, pageKey, sizeKey, defaultPageSize, debounce } = opts

  // Initialise from URL on load so a hard refresh or shared link restores state
  const search = ref<string>((route.query[searchKey] as string) ?? "")
  const pagination = ref({
    pageIndex: Number(route.query[pageKey] ?? 0),
    pageSize: Number(route.query[sizeKey] ?? defaultPageSize)
  })

  // Debounced search — this is what actually drives the API call in the
  // component. Raw `search` updates instantly for the input; the debounced
  // copy settles after the user stops typing, preventing a request per keystroke.
  const debouncedSearch = refDebounced(search, debounce)

  // Collapse rapid pagination clicks into one history entry
  const pushQuery = useDebounceFn((p: typeof pagination.value, s: string) => {
    router.push({
      query: {
        ...route.query,
        [searchKey]: s || undefined,
        [pageKey]: p.pageIndex > 0 ? String(p.pageIndex) : undefined,
        [sizeKey]: p.pageSize !== defaultPageSize ? String(p.pageSize) : undefined
      }
    })
  }, debounce)

  // State → URL
  watch([pagination, debouncedSearch], ([p, s]) => pushQuery(p, s))

  // URL → state (browser back/forward restores table to the correct page/search)
  watch(
    () => route.query,
    (query) => {
      pagination.value = {
        pageIndex: Number(query[pageKey] ?? 0),
        pageSize: Number(query[sizeKey] ?? defaultPageSize)
      }
      search.value = (query[searchKey] as string) ?? ""
    }
  )

  // Reset to first page when search changes — results count changes so
  // current page may be out of range
  watch(debouncedSearch, () => {
    pagination.value = { ...pagination.value, pageIndex: 0 }
  })

  function onPaginationChange(p: { pageIndex: number; pageSize: number }) {
    pagination.value = p
  }

  function onFilterChange(val: any) {
    search.value = val
  }

  const pageSize = computed({
    get: () => pagination.value.pageSize,
    set: (val) => {
      pagination.value = { pageIndex: 0, pageSize: val }
    }
  })

  const page = computed({
    get: () => pagination.value.pageIndex,
    set: (val) => {
      pagination.value = { ...pagination.value, pageIndex: val }
    }
  })

  return {
    search,
    page,
    pageSize,
    pagination,
    debouncedSearch,
    onPaginationChange,
    onFilterChange
  }
}

// ---------------------------------------------------------------------------
// Public composable — overloaded so TypeScript knows exactly what comes back
// per mode. Without overloads, `debouncedSearch` would be `Ref<string> |
// undefined` in both branches, causing TS18048 on every server-mode caller.
// ---------------------------------------------------------------------------
export function useUrlTableState(options: ServerOptions): ReturnType<typeof useServerState>
export function useUrlTableState(options: ClientOptions): ReturnType<typeof useClientState>
export function useUrlTableState(options: UseUrlTableStateOptions) {
  const resolved = {
    searchKey: options.searchKey ?? "q",
    pageKey: options.pageKey ?? "page",
    sizeKey: options.sizeKey ?? "size",
    defaultPageSize: options.defaultPageSize ?? 10
  }

  if (options.mode === "server") {
    return useServerState({ ...resolved, debounce: options.debounce ?? 300 })
  }

  return useClientState(resolved)
}
