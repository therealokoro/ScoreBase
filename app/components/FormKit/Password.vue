<script setup>
const handleIconClick = (node, e) => {
  node.props.suffixIcon = node.props.suffixIcon === "lucide:eye" ? "lucide:eye-off" : "lucide:eye"
  node.props.type = node.props.type === "password" ? "text" : "password"
}

const attributes = useAttrs()
const formkitProps = computed(() => {
  const { suffixIcon, type, ...rest } = attributes
  return rest
})
</script>

<template>
  <FormKit
    v-bind="formkitProps"
    type="password"
    suffix-icon="lucide:eye"
    @suffix-icon-click="handleIconClick"
  />
</template>
