import { createLocalStoragePlugin } from "@formkit/addons"
import { defineFormKitConfig, createInput } from "@formkit/vue"

import FormKitSelect from "~/components/FormKit/Select.vue"
import FormKitTags from "~/components/FormKit/Tags.vue"

const ICON_ENDPOINT = "/api/_nuxt_icon"
const svgCache = new Map<string, string>()

async function nuxtIconLoader(iconName: string): Promise<string | undefined> {
  // Skip if it looks like a raw SVG already
  if (iconName.trimStart().startsWith("<svg")) return undefined

  // return icon from cache if stored before
  if (svgCache.has(iconName)) return svgCache.get(iconName)

  try {
    const res = await fetch(`${ICON_ENDPOINT}/${iconName}.svg`)
    if (!res.ok) return undefined
    const svg = await res.text()
    svgCache.set(iconName, svg)
    return svg
  } catch {
    return undefined
  }
}

const exactLength = (node: any, length: number | string) => {
  const value = node.value

  if (value === null || value === undefined || value === "") {
    return true
  }

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
