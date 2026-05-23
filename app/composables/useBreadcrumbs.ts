// composables/useBreadcrumbs.ts
import type { BreadcrumbItem } from "~/components/Ui/Breadcrumbs.vue"

interface UseBreadcrumbsOptions {
  root?: string
}

interface BreadcrumbPageLabel {
  path: string
  label: string | null
}

export function useBreadcrumbs(options?: UseBreadcrumbsOptions) {
  const route = useRoute()
  const root = options?.root ?? "/"
  const pageLabel = useState<BreadcrumbPageLabel>("breadcrumb-page-label", () => ({
    path: "",
    label: null
  }))

  const crumbs = computed<BreadcrumbItem[]>(() => {
    const segments = route.path.replace(root, "").split("/").filter(Boolean)

    // Only use the label if it belongs to the current path
    const activeLabel = pageLabel.value.path === route.path ? pageLabel.value.label : null

    const items: BreadcrumbItem[] = [{ label: "Home", link: root, icon: "lucide:home" }]

    segments.forEach((segment, index) => {
      const link = root + "/" + segments.slice(0, index + 1).join("/")
      const isLast = index === segments.length - 1
      const label =
        isLast && activeLabel
          ? activeLabel
          : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")

      items.push(isLast ? { label } : { label, link })
    })

    return items
  })

  return { crumbs }
}

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
