/**
 * coserwiki（Coser百科）活动面板 · Host 半侧
 * - 定时抓取 https://coserwiki.com/events
 * - 优先从页面内嵌的 RSC/JSON 数据解析（活动名 / dateTime / 省市 / 场馆 / 参演名单），
 *   HTML 卡片只在 JSON 缺字段时兜底，站方改 class 名也不会整体失效
 * - 关注嘉宾参演的活动：按设置的提醒节点（默认提前 1 个月 / 1 周）提醒
 * - 对外提供 /coserwiki/data · /coserwiki/refresh · /coserwiki/read
 *          /coserwiki/reminders · /coserwiki/reminders/ack
 *          /coserwiki/settings · /coserwiki/calendar.ics
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const name = 'dsh-coserwiki-reminder'
export const inject = { webServer: true }

const SITE = 'https://coserwiki.com/events'
const INTERVAL_MS = 30 * 60 * 1000 // 30 分钟抓一次
const RETRY_MS = 5 * 60 * 1000 // 抓取失败后 5 分钟就重试，不吃满 30 分钟
const STATE_SCHEMA = 4
const STATE_DIR = path.join(os.homedir(), '.dsh', 'coserwiki-reminder')
const STATE_FILE = path.join(STATE_DIR, 'state.json')
const SETTINGS_FILE = path.join(STATE_DIR, 'settings.json')

// 默认关注嘉宾；用户可以在「设置 → 漫展提醒」里改
const DEFAULT_WATCHED_GUESTS = ['egg258', '腥味猫罐', '兔娘', '害羞7', '听霜']
// 默认提醒节点（天）；同样可以在设置里改
const DEFAULT_REMINDER_DAYS = [30, 7]
const MAX_REMINDER_NODES = 6
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_GUESTS = 120
// 状态文件别无限长：只保留最近这么多条
const STATE_CAPS = { seen: 600, reminded: 300 }

/** 名字归一化：全角转半角、忽略大小写与空白，用来做关注匹配和去重 */
function foldName(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u200b-\u200d\ufeff]+/g, '')
}

function normalizeWatchlist(list) {
  const out = []
  const seen = new Set()
  for (const raw of Array.isArray(list) ? list : []) {
    const name = String(raw || '').trim().slice(0, 40)
    if (!name) continue
    const key = foldName(name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(name)
    if (out.length >= 40) break
  }
  return out
}

/** 提醒节点：0–365 天、去重、从大到小、最多 6 个 */
function normalizeReminderDays(list) {
  const out = []
  for (const raw of Array.isArray(list) ? list : []) {
    const days = Math.round(Number(raw))
    if (!Number.isFinite(days) || days < 0 || days > 365) continue
    if (!out.includes(days)) out.push(days)
  }
  if (out.length === 0) return DEFAULT_REMINDER_DAYS.slice()
  return out.sort((a, b) => b - a).slice(0, MAX_REMINDER_NODES)
}

function readSettingsFile() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
  } catch {
    /* 还没保存过设置 */
    return null
  }
}

function loadWatchlist() {
  const parsed = readSettingsFile()
  const names = normalizeWatchlist(parsed && parsed.watchedGuests)
  return names.length > 0 ? names : DEFAULT_WATCHED_GUESTS.slice()
}

function loadReminderDays() {
  const parsed = readSettingsFile()
  if (!parsed || !Array.isArray(parsed.reminderDays) || parsed.reminderDays.length === 0) {
    return DEFAULT_REMINDER_DAYS.slice()
  }
  return normalizeReminderDays(parsed.reminderDays)
}

function saveSettings(names, days) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true })
    const tmp = SETTINGS_FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify({ watchedGuests: names, reminderDays: days }, null, 2), 'utf8')
    fs.renameSync(tmp, SETTINGS_FILE)
    return true
  } catch {
    return false
  }
}

let activeWatchlist = loadWatchlist()
let activeReminderDays = loadReminderDays()

/** 里程碑 id：d30 / d7 / d0 */
function milestoneKey(days) {
  return 'd' + days
}

/** 兼容 1.2 之前写下的 30d / 7d 记录 */
function hasMilestoneMark(marks, days) {
  if (!marks || typeof marks !== 'object') return false
  if (marks[milestoneKey(days)]) return true
  if (days === 30 && marks['30d']) return true
  if (days === 7 && marks['7d']) return true
  return false
}

/** 解析 d7 / 7d 两种写法 */
function parseMilestone(value) {
  const text = String(value || '').trim().toLowerCase()
  const match = text.match(/^d(\d{1,3})$/) || text.match(/^(\d{1,3})d$/)
  if (!match) return null
  const days = Number(match[1])
  if (!Number.isFinite(days) || days < 0 || days > 365) return null
  return days
}

function watchKeys(list = activeWatchlist) {
  return new Map(list.map((name) => [foldName(name), name]))
}

function watchedCanonical(name, keys = watchKeys()) {
  return keys.get(foldName(name)) || ''
}

function emptyState() {
  return {
    schema: STATE_SCHEMA,
    seen: {},
    events: [],
    newIds: [],
    reminded: {},
    initialized: false,
    updatedAt: '',
    lastAttemptAt: '',
    lastError: '',
  }
}

function readState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    // 结构变化时整份重来，避免把全部活动误报成“新”
    if (parsed.schema !== STATE_SCHEMA) return emptyState()
    return {
      schema: STATE_SCHEMA,
      seen: parsed.seen && typeof parsed.seen === 'object' ? parsed.seen : {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
      reminded: parsed.reminded && typeof parsed.reminded === 'object' ? parsed.reminded : {},
      initialized: parsed.initialized === true,
      newIds: Array.isArray(parsed.newIds) ? parsed.newIds : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      lastAttemptAt: typeof parsed.lastAttemptAt === 'string' ? parsed.lastAttemptAt : '',
      lastError: typeof parsed.lastError === 'string' ? parsed.lastError : '',
    }
  } catch {
    return emptyState()
  }
}

function writeState(state) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true })
    const tmp = STATE_FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8')
    fs.renameSync(tmp, STATE_FILE)
  } catch {
    /* 写不了就算了，内存里还有 */
  }
}

/** 按数值大小留最近的 N 条，避免 seen / reminded 无限增长 */
function capMap(map, limit) {
  const keys = Object.keys(map || {})
  if (keys.length <= limit) return map || {}
  const scored = keys.map((key) => {
    const value = map[key]
    const score = typeof value === 'number'
      ? value
      : value && typeof value === 'object'
        ? Math.max(0, ...Object.values(value).filter((v) => typeof v === 'number'), 0)
        : 0
    return [key, score]
  })
  scored.sort((a, b) => b[1] - a[1])
  const kept = {}
  for (const [key] of scored.slice(0, limit)) kept[key] = map[key]
  return kept
}

function decodeEntities(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 用日期自己算状态，不依赖站点的 phase 徽章 */
function statusFromDates(start, end) {
  const today = todayKey()
  if (!start) return ''
  if (end && start <= today && today <= end) return 'now'
  return start > today ? 'future' : 'past'
}

/** 从 dateTime 与 aria-label("1.1–1.3") 推出结束日期（HTML 兜底用） */
function resolveEnd(start, label) {
  if (!start) return ''
  const range = String(label || '').split(/[–—~-]/)
  if (range.length < 2) return start
  const part = range[1].match(/(\d{1,2})\s*\.\s*(\d{1,2})/)
  if (!part) return start
  const month = Number(part[1])
  const day = Number(part[2])
  if (!month || !day) return start
  const startYear = Number(start.slice(0, 4))
  const startMonth = Number(start.slice(5, 7))
  const year = month < startMonth ? startYear + 1 : startYear
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function parseJsonString(raw) {
  try {
    return JSON.parse('"' + raw + '"')
  } catch {
    return raw
  }
}

function makeEvent(fields) {
  const start = fields.start || ''
  const end = fields.end || start
  return {
    id: fields.id,
    title: fields.title || '',
    province: fields.province || '',
    city: fields.city || '',
    venue: fields.venue || '',
    start,
    end,
    status: statusFromDates(start, end),
    special: fields.special === true,
    url: 'https://coserwiki.com/events/' + fields.id,
    guests: [],
    guestCount: 0,
    hasWatched: false,
    watchedNames: [],
    watchedDays: [],
    // 兼容旧版字段（早期只关注 egg258）
    hasEgg258: false,
    egg258Names: [],
    egg258Days: [],
  }
}

/**
 * 站点的 Next.js flight 数据里，JSON 是二次转义的（\"id\":\"…\"）。
 * 统一抹掉这一层，后续既可以用 JSON 正则，也能兼容旧版 HTML 卡片。
 */
function normalizePage(text) {
  return String(text).replace(/\\"/g, '"')
}

/**
 * 从内嵌 JSON 里读活动：字段顺序固定，直接按结构匹配。
 * 形如 {"id":"<uuid>","name":"…","startsOn":"2026-12-19","endsOn":"2026-12-20",
 *       "province":"广东省","city":"广州市","venue":"…"}
 */
function parsePayloadEvents(raw) {
  const out = []
  const re = /"id":"([0-9a-f-]{36})","name":"((?:[^"\\]|\\.)*)","startsOn":"(\d{4}-\d{2}-\d{2})","endsOn":"((?:\d{4}-\d{2}-\d{2})?)","province":"((?:[^"\\]|\\.)*)","city":"((?:[^"\\]|\\.)*)","venue":"((?:[^"\\]|\\.)*)"/g
  let match
  while ((match = re.exec(raw))) {
    out.push(makeEvent({
      id: match[1],
      title: decodeEntities(parseJsonString(match[2])),
      start: match[3],
      end: match[4],
      province: decodeEntities(parseJsonString(match[5])),
      city: decodeEntities(parseJsonString(match[6])),
      venue: decodeEntities(parseJsonString(match[7])),
    }))
  }
  return out
}

/**
 * HTML 卡片兜底：站点改版后 JSON 结构若变化，至少还有卡片可读。
 * 每张卡片形如：<article class="IKaIaq_card" id="event-<uuid>"> … </article>
 */
function parseHtmlCards(raw) {
  const starts = [...raw.matchAll(/<article class="IKaIaq_card" id="event-([0-9a-f-]{36})"/g)]
  const out = []
  for (let i = 0; i < starts.length; i++) {
    const begin = starts[i].index
    const stop = i + 1 < starts.length ? starts[i + 1].index : raw.length
    const block = raw.slice(begin, stop)

    const link = block.match(/<h2[^>]*class="IKaIaq_title"[^>]*>[\s\S]*?<a[^>]+href="\/events\/[0-9a-f-]{36}[^"]*"[^>]*>([\s\S]*?)<\/a>/)
    if (!link) continue
    const title = decodeEntities(link[1].replace(/<[^>]*>/g, ''))
    if (!title) continue

    const timeTag = block.match(/<time[^>]*class="IKaIaq_date"[^>]*>/)
    const start = timeTag ? ((timeTag[0].match(/dateTime="(\d{4}-\d{2}-\d{2})"/) || [])[1] || '') : ''
    const label = timeTag ? ((timeTag[0].match(/aria-label="([^"]*)"/) || [])[1] || '') : ''

    // 新版是 <span class="IKaIaq_city">广州</span>；旧版是 place + 内联 svg
    const city = (block.match(/class="IKaIaq_city"[^>]*>([^<]*)</) || [])[1] ||
      (block.match(/<span class="IKaIaq_place">[\s\S]*?<\/svg>([^<]*)<\/span>/) || [])[1] || ''
    const venue = (block.match(/<span class="IKaIaq_venue">([^<]*)<\/span>/) || [])[1] || ''

    out.push(makeEvent({
      id: starts[i][1],
      title,
      start,
      end: resolveEnd(start, label),
      province: '',
      city: decodeEntities(city),
      venue: decodeEntities(venue),
      special: /超级活动/.test(block),
    }))
  }
  return out
}

/**
 * 从页面内嵌数据里抽参演嘉宾。
 * 形如：{"day":"2026-11-29","eventId":"<uuid>","id":"<uuid>","name":"egg258",…}
 * 也有不带 day 的名单形态。
 */
function attachGuests(raw, events, watchedGuests = activeWatchlist) {
  const byId = new Map(events.map((e) => [e.id, e]))
  const guestMap = new Map() // eventId -> { names:Map<fold, name>, watched:Set, days:Set }
  const keys = watchKeys(watchedGuests)

  const entryOf = (eventId) => {
    let entry = guestMap.get(eventId)
    if (!entry) {
      entry = { names: new Map(), watched: new Set(), days: new Set() }
      guestMap.set(eventId, entry)
    }
    return entry
  }

  const note = (eventId, name, day) => {
    if (!byId.has(eventId) || !name) return
    const entry = entryOf(eventId)
    const key = foldName(name)
    if (key && !entry.names.has(key)) entry.names.set(key, name)
    const watched = watchedCanonical(name, keys)
    if (watched) {
      entry.watched.add(watched)
      if (day) entry.days.add(day)
    }
  }

  // 带 day 的完整名单对象
  const withDay = /"day":"(\d{4}-\d{2}-\d{2})","eventId":"([0-9a-f-]{36})","id":"[0-9a-f-]{36}","name":"((?:[^"\\]|\\.)*)"/g
  let match
  while ((match = withDay.exec(raw))) {
    note(match[2], decodeEntities(parseJsonString(match[3])), match[1])
  }
  // 不带 day 的名单形态
  const noDay = /"eventId":"([0-9a-f-]{36})","id":"[0-9a-f-]{36}","name":"((?:[^"\\]|\\.)*)"/g
  while ((match = noDay.exec(raw))) {
    note(match[1], decodeEntities(parseJsonString(match[2])), '')
  }

  for (const event of events) {
    const entry = guestMap.get(event.id)
    const names = entry ? [...entry.names.values()] : []
    const watchedNames = entry ? [...entry.watched] : []
    const watchedDays = entry ? [...entry.days].sort() : []
    event.guests = names.slice(0, MAX_GUESTS)
    event.guestCount = names.length
    event.hasWatched = watchedNames.length > 0
    event.watchedNames = watchedNames
    event.watchedDays = watchedDays
    if (event.hasWatched && event.watchedDays.length === 0 && event.start) {
      event.watchedDays = [event.start]
    }
    // 兼容旧字段（egg258 仍然在关注列表里）
    event.hasEgg258 = watchedNames.some((n) => foldName(n) === 'egg258')
    event.egg258Names = event.hasEgg258 ? ['egg258'] : []
    event.egg258Days = event.hasEgg258 ? event.watchedDays : []
  }
}

/**
 * 解析活动页：JSON 优先、HTML 卡片兜底，两边按 id 合并。
 */
export function parseEvents(html, watchedGuests = activeWatchlist) {
  const raw = normalizePage(html)
  const merged = new Map()

  for (const event of parsePayloadEvents(raw)) {
    if (!merged.has(event.id)) merged.set(event.id, event)
  }
  for (const card of parseHtmlCards(raw)) {
    const known = merged.get(card.id)
    if (!known) {
      merged.set(card.id, card)
      continue
    }
    // JSON 里缺的字段（比如超级活动标记、极端情况下漏掉的场馆）用卡片补
    if (!known.title) known.title = card.title
    if (!known.start) known.start = card.start
    if (!known.end) known.end = card.end
    if (!known.city) known.city = card.city
    if (!known.venue) known.venue = card.venue
    if (card.special) known.special = true
  }

  const events = [...merged.values()]
  for (const event of events) {
    if (!event.end) event.end = event.start
    if (!event.status) event.status = statusFromDates(event.start, event.end)
  }
  attachGuests(raw, events, watchedGuests)
  return events
}

async function fetchEvents(watchedGuests = activeWatchlist) {
  const res = await fetch(SITE, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DSH-coserwiki-reminder/1.3',
      accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const html = await res.text()
  const events = parseEvents(html, watchedGuests)
  if (events.length === 0) throw new Error('页面结构可能又变了：没解析到任何活动')
  return events
}

function sortEvents(events) {
  const rank = { now: 0, future: 1, past: 2 }
  return events.slice().sort((a, b) => {
    const ra = rank[a.status] ?? 1
    const rb = rank[b.status] ?? 1
    if (ra !== rb) return ra - rb
    if (ra === 2) return String(b.start).localeCompare(String(a.start))
    return String(a.start).localeCompare(String(b.start))
  })
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 距活动开始还有几天（按本地日历日；0 = 今天开始，负数 = 已开始） */
export function daysUntil(start) {
  const time = Date.parse(String(start || '') + 'T00:00:00')
  if (!Number.isFinite(time)) return NaN
  return Math.round((time - startOfToday()) / DAY_MS)
}

/**
 * 计算关注嘉宾参演活动的待提醒项。
 * - 提醒节点来自设置（默认 30 天、7 天，可在设置里增删）
 * - 每场活动同一时间只提醒“最近的一个还没提醒过的节点”：
 *   差 3 天而节点是 30/7，就按 7 天提醒，不再补 30 天
 * - 同一活动同一节点只提醒一次，由 ack 记录
 */
export function pendingReminders(state) {
  const pending = []
  const nodes = activeReminderDays.slice().sort((a, b) => b - a)
  for (const event of state.events) {
    if (!event.hasWatched) continue
    const days = daysUntil(event.start)
    if (!Number.isFinite(days) || days < 0) continue
    const marks = state.reminded?.[event.id] || {}
    // 取“还够得着”的节点里最小的那个
    const reachable = nodes.filter((node) => days <= node)
    if (reachable.length === 0) continue
    const threshold = reachable[reachable.length - 1]
    if (hasMilestoneMark(marks, threshold)) continue
    pending.push({ event, milestone: milestoneKey(threshold), threshold, daysLeft: days })
  }
  pending.sort((a, b) => a.daysLeft - b.daysLeft || String(a.event.start).localeCompare(String(b.event.start)))
  return pending
}

function reminderView({ event, milestone, threshold, daysLeft }) {
  return {
    eventId: event.id,
    milestone,
    threshold,
    daysLeft,
    title: event.title,
    start: event.start,
    end: event.end,
    province: event.province,
    city: event.city,
    venue: event.venue,
    url: event.url,
    watchedNames: event.watchedNames,
    watchedDays: event.watchedDays,
    egg258Days: event.egg258Days,
    egg258Names: event.egg258Names,
  }
}

function shape(state) {
  const pending = pendingReminders(state)
  return {
    updatedAt: state.updatedAt,
    lastAttemptAt: state.lastAttemptAt,
    lastError: state.lastError,
    watchedGuests: activeWatchlist,
    reminderDays: activeReminderDays.slice(),
    newCount: state.newIds.length,
    newIds: state.newIds,
    reminderCount: pending.length,
    reminders: pending.map(reminderView),
    events: sortEvents(state.events).map((e) => {
      const days = daysUntil(e.start)
      return {
        ...e,
        isNew: state.newIds.includes(e.id),
        daysLeft: Number.isFinite(days) ? days : null,
      }
    }),
  }
}

async function refresh(force) {
  const state = readState()
  const now = Date.now()
  const last = Date.parse(state.lastAttemptAt || state.updatedAt || '') || 0
  // 失败后别等满 30 分钟，5 分钟后就可以再试
  const ttl = state.lastError ? RETRY_MS : INTERVAL_MS
  if (!force && last && now - last < ttl) return state
  try {
    const events = await fetchEvents()
    const seen = state.seen && typeof state.seen === 'object' ? state.seen : {}
    const firstRun = !state.initialized
    const fresh = []
    for (const e of events) {
      if (!seen[e.id]) {
        seen[e.id] = now
        if (!firstRun) fresh.push(e.id)
      }
    }
    const iso = new Date(now).toISOString()
    const next = {
      schema: STATE_SCHEMA,
      seen: capMap(seen, STATE_CAPS.seen),
      events,
      newIds: [...new Set(fresh)],
      reminded: capMap(state.reminded && typeof state.reminded === 'object' ? state.reminded : {}, STATE_CAPS.reminded),
      initialized: true,
      updatedAt: iso,
      lastAttemptAt: iso,
      lastError: '',
    }
    writeState(next)
    return next
  } catch (err) {
    state.lastError = err && err.message ? err.message : String(err)
    state.lastAttemptAt = new Date(now).toISOString()
    writeState(state)
    return state
  }
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return null
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}

/** iCalendar 文本转义 */
function icsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** 生成 .ics：关注嘉宾参演的活动（scope=all 时导出全部未来活动） */
export function buildCalendar(state, scope) {
  const watchedOnly = scope !== 'all'
  const list = sortEvents(state.events).filter((event) => {
    if (!event.start) return false
    if (watchedOnly && !event.hasWatched) return false
    return event.status === 'now' || event.status === 'future'
  })
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DSH//dsh-coserwiki-reminder//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CoserWiki 漫展活动',
    'X-WR-TIMEZONE:Asia/Shanghai',
  ]
  for (const event of list) {
    const endDate = event.end || event.start
    const endExclusive = new Date(Date.parse(endDate + 'T00:00:00') + DAY_MS)
    const endKey = `${endExclusive.getFullYear()}-${pad2(endExclusive.getMonth() + 1)}-${pad2(endExclusive.getDate())}`.replace(/-/g, '')
    const who = event.watchedNames.length ? `关注嘉宾：${event.watchedNames.join('、')}` : ''
    const days = event.watchedDays.length ? `参演日期：${event.watchedDays.join('、')}` : ''
    const where = [event.city, event.venue].filter(Boolean).join(' · ')
    const desc = [who, days, where ? `场馆：${where}` : '', event.url]
      .filter(Boolean)
      .map(icsText)
      .join('\\n')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@coserwiki`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${event.start.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${endKey}`,
      `SUMMARY:${icsText(event.title)}`,
      `LOCATION:${icsText(where)}`,
      'DESCRIPTION:' + desc,
      'URL:' + event.url,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldIcsLine).join('\r\n') + '\r\n'
}

/** iCalendar 按 75 字节折行 */
function foldIcsLine(line) {
  if (Buffer.byteLength(line, 'utf8') <= 74) return line
  const out = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = Buffer.byteLength(char, 'utf8')
    if (bytes + size > 73) {
      out.push(current)
      current = ' ' + char
      bytes = size + 1
    } else {
      current += char
      bytes += size
    }
  }
  out.push(current)
  return out.join('\r\n')
}

export function apply(ctx) {
  // 后台定时抓取
  ctx.effect(() => {
    let stopped = false
    const tick = () => { if (!stopped) refresh(false).catch(() => {}) }
    tick()
    const timer = setInterval(tick, INTERVAL_MS)
    if (typeof timer.unref === 'function') timer.unref()
    return () => { stopped = true; clearInterval(timer) }
  }, 'coserwiki-reminder.poll')

  ctx.inject(['webServer'], (sub) => {
    sub.effect(() => sub.webServer.register({
      kind: 'prefix',
      path: '/coserwiki',
      handler: async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://local')
        const send = (code, obj) => {
          const body = JSON.stringify(obj)
          res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
          res.end(body)
        }
        try {
          if (url.pathname === '/coserwiki/data' && req.method === 'GET') {
            return send(200, shape(readState()))
          }
          if (url.pathname === '/coserwiki/reminders' && req.method === 'GET') {
            const state = readState()
            const pending = pendingReminders(state).map(reminderView)
            return send(200, { reminders: pending, pendingCount: pending.length })
          }
          if (url.pathname === '/coserwiki/reminders/ack' && req.method === 'POST') {
            const body = await readJsonBody(req)
            const eventId = String((body && body.eventId) || '')
            const days = parseMilestone(body && body.milestone)
            if (!eventId || days === null) return send(400, { error: 'eventId and milestone are required' })
            const state = readState()
            const marks = state.reminded[eventId] && typeof state.reminded[eventId] === 'object'
              ? state.reminded[eventId]
              : {}
            marks[milestoneKey(days)] = Date.now()
            state.reminded[eventId] = marks
            writeState(state)
            return send(200, shape(state))
          }
          if (url.pathname === '/coserwiki/settings' && req.method === 'GET') {
            return send(200, {
              watchedGuests: activeWatchlist,
              reminderDays: activeReminderDays.slice(),
              defaults: DEFAULT_WATCHED_GUESTS,
              defaultReminderDays: DEFAULT_REMINDER_DAYS.slice(),
            })
          }
          if (url.pathname === '/coserwiki/settings' && req.method === 'POST') {
            const body = await readJsonBody(req)
            const next = normalizeWatchlist(body && body.watchedGuests)
            if (next.length === 0) return send(400, { error: '至少保留一位嘉宾' })
            const nextDays = normalizeReminderDays(body && body.reminderDays)
            if (!saveSettings(next, nextDays)) return send(500, { error: '保存设置失败' })
            activeWatchlist = next
            activeReminderDays = nextDays
            const state = await refresh(true)
            return send(200, {
              watchedGuests: activeWatchlist,
              reminderDays: activeReminderDays.slice(),
              defaults: DEFAULT_WATCHED_GUESTS,
              defaultReminderDays: DEFAULT_REMINDER_DAYS.slice(),
              ...shape(state),
            })
          }
          if (url.pathname === '/coserwiki/refresh' && req.method === 'POST') {
            const next = await refresh(true)
            return send(200, shape(next))
          }
          if (url.pathname === '/coserwiki/read' && req.method === 'POST') {
            const state = readState()
            state.newIds = []
            writeState(state)
            return send(200, shape(state))
          }
          if (url.pathname === '/coserwiki/calendar.ics' && req.method === 'GET') {
            const state = readState()
            const scope = url.searchParams.get('scope') === 'all' ? 'all' : 'watch'
            const body = buildCalendar(state, scope)
            res.writeHead(200, {
              'content-type': 'text/calendar; charset=utf-8',
              'content-disposition': 'attachment; filename="coserwiki-events.ics"',
              'cache-control': 'no-store',
            })
            res.end(body)
            return undefined
          }
          return send(404, { error: 'not found' })
        } catch (err) {
          return send(500, { error: err && err.message ? err.message : String(err) })
        }
      },
    }))
  })
}
