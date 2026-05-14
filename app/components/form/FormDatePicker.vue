<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { InputGroup } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import FormField from './FormField.vue'
import FormAddon from './FormAddon.vue'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  locale?: string
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle']
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false,
  placeholder: 'Pick a date',
  locale: 'en-US',
  dateStyle: 'long',
  icon: "lucide:calendar"
})

const model = defineModel<string>()

const slots = useSlots()
const hasAddonStart = computed(() => !!slots['addon'] || !!props.icon || !!props.addonText)
const hasAddonEnd   = computed(() => !!slots['addon-right'] || !!props.iconRight || !!props.addonTextRight)

const open = ref(false)

const df = computed(() => new DateFormatter(props.locale, { dateStyle: props.dateStyle }))

const calendarValue = computed<DateValue | undefined>(() => {
  try { return model.value ? parseDate(model.value) : undefined }
  catch { return undefined }
})

const displayValue = computed(() =>
  calendarValue.value
    ? df.value.format(calendarValue.value.toDate(getLocalTimeZone()))
    : undefined,
)
</script>

<template>
  <FormField
    :name
    :validate-on-mount
    :label
    :description
    :class="props.class"
    v-slot="{ inputId, field, isInvalid }"
  >
    <Popover v-model:open="open" @update:open="(value) => !value && field.handleBlur()">
      <InputGroup>
        <FormAddon v-if="hasAddonStart" :icon :text="addonText">
          <template v-if="$slots['addon']" #default>
            <slot name="addon" />
          </template>
        </FormAddon>

        <PopoverTrigger as-child>
          <Button
            :id="inputId"
            variant="outline"
            :disabled
            :aria-invalid="isInvalid || undefined"
            size="sm"
            :aria-describedby="description ? `${inputId}-desc` : undefined"
            data-slot="input-group-control"
            :class="cn(
              'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 justify-start text-left font-normal',
              !displayValue && 'text-muted-foreground',
              isInvalid && 'border-destructive! focus-visible:ring-destructive/30!',
            )"
          >
            <!-- <Icon v-if="!hasAddonStart" name="lucide:calendar" class="size-4 shrink-0" /> -->
            {{ displayValue ?? placeholder }}
          </Button>
        </PopoverTrigger>

        <FormAddon v-if="hasAddonEnd" :icon="iconRight" :text="addonTextRight" align="inline-end">
          <template v-if="$slots['addon-right']" #default>
            <slot name="addon-right" />
          </template>
        </FormAddon>
      </InputGroup>

      <PopoverContent class="w-auto p-0" align="start">
        <Calendar
          :model-value="calendarValue"
          :disabled
          initial-focus
          @update:model-value="(date) => { model = date?.toString(); open = false }"
        />
      </PopoverContent>
    </Popover>
  </FormField>
</template>
