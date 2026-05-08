export type RssSource = {
  source_type: 'rss'
  source_id: string
  rss_url: string
  name: string
}

export const SOURCES: RssSource[] = [
  {
    source_type: 'rss',
    source_id: 'theedit',
    rss_url: 'https://the-edit.co.kr/feed',
    name: '디에디트',
  },
  {
    source_type: 'rss',
    source_id: 'uppity',
    rss_url: 'https://uppity.co.kr/feed',
    name: '어피티',
  },
]
