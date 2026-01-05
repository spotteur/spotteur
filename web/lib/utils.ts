import { type AnyFormApi } from '@tanstack/react-form'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type $ZodFlattenedError } from 'zod/v4/core'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function humanReadableEpoch(ts: number = Date.now()): string {
  const d = new Date(ts)

  const pad = (n: number, l = 2) => n.toString().padStart(l, '0')

  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds()) +
    pad(d.getMilliseconds(), 3)
  )
}

export function humanReadableDecimal(num: number, decimalPlaces: number = 2): string {
  return num.toFixed(decimalPlaces)
}

export function setFormErrors<T>(form: AnyFormApi, errors?: $ZodFlattenedError<T>) {
  for (const [key, message] of Object.entries(errors?.fieldErrors || {})) {
    form.setFieldMeta(key, (meta) => ({
      ...meta,
      errorMap: { onSubmit: { message } },
    }))
  }
}

export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}
