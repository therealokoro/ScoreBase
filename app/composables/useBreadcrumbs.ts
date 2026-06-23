// composables/useBreadcrumbs.ts
import type { BreadcrumbItem } from "~/components/Ui/Breadcrumbs.vue"

interface UseBreadcrumbsOptions {
  root?: string
}

interface BreadcrumbPageLabel {
  path: string
  label: string | null
}

interface BreadcrumbPageLabels {
  path: string
  // Keyed by raw URL segment (e.g. a slug/id), not by full link path
  labels: Record<string, string>
}

type BreadcrumbLabelValue = string | null | undefined | Ref<string | null | undefined>
type BreadcrumbLabelsInput =
  | Record<string, BreadcrumbLabelValue>
  | Ref<Record<string, BreadcrumbLabelValue>>

export function useBreadcrumbs(options?: UseBreadcrumbsOptions) {
  const route = useRoute()
  const root = options?.root ?? "/"
  const pageLabel = useState<BreadcrumbPageLabel>("breadcrumb-page-label", () => ({
    path: "",
    label: null
  }))
  const pageLabels = useState<BreadcrumbPageLabels>("breadcrumb-page-labels", () => ({
    path: "",
    labels: {}
  }))

  const crumbs = computed<BreadcrumbItem[]>(() => {
    const segments = route.path.replace(root, "").split("/").filter(Boolean)

    // Only use overrides if they were registered for the current path
    const activeLabel = pageLabel.value.path === route.path ? pageLabel.value.label : null
    const activeLabels = pageLabels.value.path === route.path ? pageLabels.value.labels : {}

    const items: BreadcrumbItem[] = [{ label: "Home", link: root, icon: "lucide:home" }]

    segments.forEach((segment, index) => {
      const link = root + "/" + segments.slice(0, index + 1).join("/")
      const isLast = index === segments.length - 1
      const override = (isLast && activeLabel) || activeLabels[segment]
      const label =
        override || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")

      items.push(isLast ? { label } : { label, link })
    })

    return items
  })

  return { crumbs }
}

/**
 * Override the breadcrumb label for the current page (the last crumb).
 *
 * @example
 *   setPageBreadcrumbLabel(computed(() => product.value?.name))
 */
export function setPageBreadcrumbLabel(label: string | Ref<string | undefined>) {
  const route = useRoute()
  const pageLabel = useState<BreadcrumbPageLabel>("breadcrumb-page-label", () => ({
    path: "",
    label: null
  }))

  watchEffect(() => {
    const resolved = (isRef(label) ? label.value : label) ?? null
    pageLabel.value = { path: route.path, label: resolved }
  })
}

/**
 * Override multiple breadcrumb labels for the current route at once.
 *
 * Pass an object keyed by the raw URL segment (e.g. an id or slug) whose label you want to replace,
 * mapped to the desired display label. Values can be plain strings or refs, so async/fetched data
 * updates the breadcrumb automatically.
 *
 * @example
 *   // /dashboard/results/result_123/ssheet_456
 *   setPageBreadcrumbLabels({
 *     result_123: computed(() => result.value?.name),
 *     ssheet_456: computed(() => sheet.value?.name)
 *   })
 */
export function setPageBreadcrumbLabels(labels: BreadcrumbLabelsInput) {
  const route = useRoute()
  const pageLabels = useState<BreadcrumbPageLabels>("breadcrumb-page-labels", () => ({
    path: "",
    labels: {}
  }))

  watchEffect(() => {
    const resolvedMap = isRef(labels) ? labels.value : labels
    const cleaned: Record<string, string> = {}

    for (const [segment, value] of Object.entries(resolvedMap)) {
      const resolvedValue = isRef(value) ? value.value : value
      if (resolvedValue) cleaned[segment] = resolvedValue
    }

    pageLabels.value = { path: route.path, labels: cleaned }
  })
}
