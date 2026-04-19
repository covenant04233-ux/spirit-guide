/**
 * Rider–Waite–Smith 维特牌：22 张大牌 + 56 张小牌（权杖/圣杯/宝剑/星币各 14 张）。
 * 牌序：0–21 大牌；22–35 权杖；36–49 圣杯；50–63 宝剑；64–77 星币。
 * 牌面默认从本地 public/cards/ 加载（/cards/000.jpg … /cards/077.jpg）。
 * 图源为 Wikimedia Commons 上的 Rider–Waite 系列扫描；可用
 * `npm run download:cards`（见 scripts/download_rider_waite_cards.py）重新拉取。
 */

export const RIDER_WAITE_IMAGE_URLS = Array.from(
  { length: 78 },
  (_, i) => `/cards/${String(i).padStart(3, '0')}.jpg`,
)

const MAJOR_EN = [
  'The Fool',
  'The Magician',
  'The High Priestess',
  'The Empress',
  'The Emperor',
  'The Hierophant',
  'The Lovers',
  'The Chariot',
  'Strength',
  'The Hermit',
  'Wheel of Fortune',
  'Justice',
  'The Hanged Man',
  'Death',
  'Temperance',
  'The Devil',
  'The Tower',
  'The Star',
  'The Moon',
  'The Sun',
  'Judgement',
  'The World',
]

const MAJOR_ZH_CN = [
  '愚人',
  '魔术师',
  '女祭司',
  '皇后',
  '皇帝',
  '教皇',
  '恋人',
  '战车',
  '力量',
  '隐士',
  '命运之轮',
  '正义',
  '倒吊人',
  '死神',
  '节制',
  '恶魔',
  '高塔',
  '星星',
  '月亮',
  '太阳',
  '审判',
  '世界',
]

const MAJOR_ZH_TW = [
  '愚人',
  '魔術師',
  '女祭司',
  '皇后',
  '皇帝',
  '教皇',
  '戀人',
  '戰車',
  '力量',
  '隱士',
  '命運之輪',
  '正義',
  '倒吊人',
  '死神',
  '節制',
  '惡魔',
  '高塔',
  '星星',
  '月亮',
  '太陽',
  '審判',
  '世界',
]

const SUITS_EN = ['Wands', 'Cups', 'Swords', 'Pentacles']
const SUITS_ZH_CN = ['权杖', '圣杯', '宝剑', '星币']
const SUITS_ZH_TW = ['權杖', '聖杯', '寶劍', '星幣']

const RANK_EN = [
  'Ace',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Page',
  'Knight',
  'Queen',
  'King',
]

const RANK_ZH_CN = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王']
const RANK_ZH_TW = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍從', '騎士', '王后', '國王']

function buildMinorNames() {
  const en = []
  const zhCN = []
  const zhTW = []
  for (let s = 0; s < 4; s++) {
    for (let r = 0; r < 14; r++) {
      en.push(`${RANK_EN[r]} of ${SUITS_EN[s]}`)
      zhCN.push(`${SUITS_ZH_CN[s]}${RANK_ZH_CN[r]}`)
      zhTW.push(`${SUITS_ZH_TW[s]}${RANK_ZH_TW[r]}`)
    }
  }
  return { en, zhCN, zhTW }
}

const MINOR = buildMinorNames()

/** @param {number} index 0–77 */
export function getRiderWaiteCardNameEn(index) {
  if (index < 0 || index > 77) return `Card ${index}`
  if (index < 22) return MAJOR_EN[index]
  return MINOR.en[index - 22]
}

/** @param {number} index 0–77 @param {'zh-CN'|'zh-TW'} lang */
export function getRiderWaiteCardNameZh(index, lang = 'zh-CN') {
  if (index < 0 || index > 77) return `第 ${index} 张`
  const major = lang === 'zh-TW' ? MAJOR_ZH_TW : MAJOR_ZH_CN
  if (index < 22) return major[index]
  const m = lang === 'zh-TW' ? MINOR.zhTW : MINOR.zhCN
  return m[index - 22]
}

/**
 * @param {number} index 0–77
 * @param {'en'|'zh-CN'|'zh-TW'} i18nLang
 */
export function getRiderWaiteCardLabel(index, i18nLang) {
  if (i18nLang === 'en') return getRiderWaiteCardNameEn(index)
  return getRiderWaiteCardNameZh(index, i18nLang === 'zh-TW' ? 'zh-TW' : 'zh-CN')
}
