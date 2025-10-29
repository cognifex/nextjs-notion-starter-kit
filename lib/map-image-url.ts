import { type Block, type ExtendedRecordMap } from 'notion-types'
import { defaultMapImageUrl } from 'notion-utils'

import { defaultPageCover, defaultPageIcon } from './config'

const CUSTOM_EMOJI_SCHEME = 'notion://custom_emoji'
const CUSTOM_EMOJI_IDENTIFIER = 'notion%3A%2F%2Fcustom_emoji'

const isCustomEmojiUrl = (url?: string): boolean =>
  typeof url === 'string' &&
  (url.startsWith(CUSTOM_EMOJI_SCHEME) || url.includes(CUSTOM_EMOJI_IDENTIFIER))

const CUSTOM_EMOJI_ID_REGEX = /custom_emoji\/([^?]+)/

const decodeCustomEmojiUrl = (url: string): string => {
  if (url.startsWith(CUSTOM_EMOJI_SCHEME)) {
    return url
  }

  const identifierIndex = url.indexOf(CUSTOM_EMOJI_IDENTIFIER)

  if (identifierIndex === -1) {
    return url
  }

  const encodedPortion = url.slice(identifierIndex)

  try {
    return decodeURIComponent(encodedPortion)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to decode custom emoji URL', err)
    }
    return url
  }
}

const resolveSignedUrl = (
  url: string,
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

  const normalizedUrl = decodeCustomEmojiUrl(url)
  const customEmojiId = normalizedUrl.match(CUSTOM_EMOJI_ID_REGEX)?.[1]

  if (customEmojiId) {
    const normalizedCustomEmojiId = customEmojiId.replaceAll('-', '')

    return (
      signedUrls?.[customEmojiId] ??
      signedUrls?.[normalizedCustomEmojiId] ??
      signedUrls?.[normalizedCustomEmojiId.toUpperCase()]
    )
  }

  const blockId = block.id
  const normalizedBlockId = blockId?.replaceAll('-', '')

  return signedUrls?.[blockId] ?? signedUrls?.[normalizedBlockId]
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
    const signedUrl = resolveSignedUrl(url, block, recordMap)
    if (signedUrl) {
      return signedUrl
    }
  }

  const mappedUrl = defaultMapImageUrl(url, block)

  if (mappedUrl && isCustomEmojiUrl(mappedUrl)) {
    const signedUrl = resolveSignedUrl(mappedUrl, block, recordMap)
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
