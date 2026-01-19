import pixelmatch from 'pixelmatch'
import sharp from 'sharp'

interface ImageDiffInput {
  imgUrl1?: string
  imgUrl2?: string
  imgBuffer1?: Buffer
  imgBuffer2?: Buffer
  threshold?: number
}

interface ImageDiffOutput {
  diffPercentage: number
  diffImage: Buffer
  diffImageFileName: string
  diffImageMimetype: string
}

export class ImageDiffDimensionMismatchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageDiffDimensionMismatchError'
  }
}

export async function bufferFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image from ${url}`)

  return Buffer.from(await res.arrayBuffer())
}

export async function getImageDiff({
  imgBuffer1,
  imgBuffer2,
  imgUrl1,
  imgUrl2,
  threshold = 0.2,
}: ImageDiffInput): Promise<ImageDiffOutput> {
  const buffer1 = imgBuffer1 ?? (imgUrl1 ? await bufferFromUrl(imgUrl1) : undefined)
  const buffer2 = imgBuffer2 ?? (imgUrl2 ? await bufferFromUrl(imgUrl2) : undefined)

  if (!buffer1 || !buffer2) {
    throw new Error('Both images must be provided either as buffers or URLs')
  }

  const image1 = sharp(buffer1).ensureAlpha().raw()
  const image2 = sharp(buffer2).ensureAlpha().raw()

  const { data: data1, info: info1 } = await image1.toBuffer({ resolveWithObject: true })
  const { data: data2, info: info2 } = await image2.toBuffer({ resolveWithObject: true })

  if (info1.width !== info2.width || info1.height !== info2.height || info1.channels !== info2.channels) {
    // TODO: Add handling when images have different dimensions or channels
    throw new ImageDiffDimensionMismatchError('Image dimensions or channels did not match')
  }

  const { width, height, channels } = info1
  const diffBuffer = Buffer.alloc(width * height * channels)

  const diffPixels = pixelmatch(data1, data2, diffBuffer, width, height, {
    threshold,
  })

  const totalPixels = width * height
  const diffPercentage = (diffPixels / totalPixels) * 100
  const diffPngBuffer = await sharp(diffBuffer, {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer()

  return {
    diffPercentage,
    diffImage: diffPngBuffer,
    diffImageFileName: `diff-${Date.now()}.png`,
    diffImageMimetype: 'image/png',
  }
}
