import { type Block, type ExtendedRecordMap } from 'notion-types'
import { defaultMapImageUrl } from 'notion-utils'

import { defaultPageCover, defaultPageIcon } from './config'

const CUSTOM_EMOJI_SCHEME = 'notion://custom_emoji'
const CUSTOM_EMOJI_IDENTIFIER = 'notion%3A%2F%2Fcustom_emoji'

const isCustomEmojiUrl = (url?: string): boolean =>
  typeof url === 'string' &&
  (url.startsWith(CUSTOM_EMOJI_SCHEME) || url.includes(CUSTOM_EMOJI_IDENTIFIER))

const resolveSignedUrl = (
  block: Block,
  recordMap?: ExtendedRecordMap | null
): string | undefined => {
  if (!recordMap) {
    return undefined
  }

  const signedUrls = (recordMap as any).signed_urls
  if (!signedUrls) {
    return undefined
  }

  const blockId = block.id
  if (typeof blockId !== 'string') {
    return signedUrls?.[blockId as any]
  }

  return signedUrls?.[blockId] ?? signedUrls?.[blockId.replaceAll('-', '')]
}

export const mapImageUrlWithRecordMap = (
  url: string | undefined,
  block: Block,
  recordMap?: ExtendedRecordMap | null
) => {
  if (!url) {
    return url
  }

  if (url === defaultPageCover || url === defaultPageIcon) {
    return url
  }

  if (isCustomEmojiUrl(url)) {
    const signedUrl = resolveSignedUrl(block, recordMap)
    if (signedUrl) {
      return signedUrl
    }
  }

  const mappedUrl = defaultMapImageUrl(url, block)

  if (isCustomEmojiUrl(mappedUrl)) {
    const signedUrl = resolveSignedUrl(block, recordMap)
    if (signedUrl) {
      return signedUrl
    }
  }

  return mappedUrl
}

export const createMapImageUrl = (
  recordMap?: ExtendedRecordMap | null
): ((url: string | undefined, block: Block) => string | undefined) => {
  return (url, block) => mapImageUrlWithRecordMap(url, block, recordMap)
}

export const mapImageUrl = createMapImageUrl()
