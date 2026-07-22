'use client'

import Image from 'next/image'

import { type Browser } from '@/constants/enum'

interface BrowserIconProps extends Omit<React.ComponentProps<typeof Image>, 'src'> {
  value: Browser
}

export function BrowserIcon({ value, alt, ...props }: BrowserIconProps) {
  return <Image src={`/icons/${value}.svg`} alt={alt} {...props} />
}
