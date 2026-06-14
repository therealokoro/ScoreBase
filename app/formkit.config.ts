import { createLocalStoragePlugin } from "@formkit/addons"
import type { FormKitNode } from "@formkit/core"
import { defineFormKitConfig, createInput } from "@formkit/vue"

import FormKitSelect from "~/components/FormKit/Select.vue"
import FormKitTags from "~/components/FormKit/Tags.vue"

const ICON_ENDPOINT = "/api/_nuxt_icon"
const svgCache = new Map<string, string>()
const pendingRequests = new Map<string, Promise<string | undefined>>()

export interface IconData {
  prefix: string
  icons: Record<string, { body: string }>
  lastModified: number
  width: number
  height: number
}

async function fetchIcon(
  iconName: string,
  collection: string,
  icon: string
): Promise<string | undefined> {
  try {
    const res = await fetch(`${ICON_ENDPOINT}/${collection}.json?icons=${icon}`)
    if (!res.ok) return undefined

    const json = (await res.json()) as IconData
    const { width, height } = json
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${json.icons[icon]!.body}</svg>`

    svgCache.set(iconName, svg)
    return svg
  } catch {
    return undefined
  } finally {
    pendingRequests.delete(iconName)
  }
}

async function nuxtIconLoader(iconName: string): Promise<string | undefined> {
  if (iconName.trimStart().startsWith("<svg")) return undefined

  const [collection, icon] = iconName.trim().split(":")
  if (!collection || !icon) return undefined

  if (svgCache.has(iconName)) return svgCache.get(iconName)

  if (pendingRequests.has(iconName)) return pendingRequests.get(iconName)

  const request = fetchIcon(iconName, collection, icon)
  pendingRequests.set(iconName, request)
  return request
}

const exactLength = (node: FormKitNode, length: number | string) => {
  const { value } = node
  if (value == null || value === "") return true
  return String(value).length === Number(length)
}

export default defineFormKitConfig({
  iconLoader: nuxtIconLoader,
  rules: { exactLength },
  plugins: [createLocalStoragePlugin()],
  messages: {
    en: {
      validation: {
        exactLength: ({ args }) => `Must be exactly ${args?.[0]} digits long.`
      }
    }
  },
  inputs: {
    _select: createInput(FormKitSelect, {
      props: ["options", "placeholder", "multiple", "disabled"]
    }),
    _tags: createInput(FormKitTags, {
      props: ["addOnKeys", "placeholder", "disabled"]
    })
  }
})
