/**
 * coserwiki（Coser百科）活动面板 · Host 半侧
 * - 定时抓取 https://coserwiki.com/events
 * - 解析活动卡片（活动名 / 城市 / 场馆 / 起止日期 / 状态 / 是否超级活动 / 参演嘉宾）
 * - 特别关注 egg258：有 egg258 参演的活动，在开始前 1 个月和 1 周各提醒一次
 * - 对外提供 /coserwiki/data · /coserwiki/refresh · /coserwiki/read
 *          /coserwiki/reminders · /coserwiki/reminders/ack
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const name = 'dsh-coserwiki-reminder'
export const inject = { webServer: true }

const SITE = 'https://coserwiki.com/events'
const INTERVAL_MS = 30 * 60 * 1000 // 30 分钟抓一次
const STATE_SCHEMA = 4
const STATE_DIR = path.join(os.homedir(), '.dsh', 'coserwiki-reminder')
const STATE_FILE = path.join(STATE_DIR, 'state.json')
const SETTINGS_FILE = path.join(STATE_DIR, 'settings.json')

// 默认关注嘉宾；用户可以在「设置 → 漫展提醒」里改
const DEFAULT_WATCHED_GUESTS = ['egg258', '腥味猫罐', '兔娘', '害羞7', '听霜']
const DAY_MS = 24 * 60 * 60 * 1000
const REMIND_DAYS = { '7d': 7, '30d': 30 }

function normalizeWatchlist(list) {
  const out = []
  const seen = new Set()
  for (const raw of Array.isArray(list) ? list : []) {
    const name = String(raw || '').trim().slice(0, 40)
    if (!name) continue
    const key = name.toLowerCase().replace(/\s+/g, '')
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(name)
    if (out.length >= 40) break
  }
  return out
}

function loadWatchlist() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
    const names = normalizeWatchlist(parsed && parsed.watchedGuests)
    if (names.length > 0) return names
  } catch {
    /* 还没保存过设置 */
  }
  return DEFAULT_WATCHED_GUESTS.slice()
}

function saveWatchlist(names) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true })
    const tmp = SETTINGS_FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify({ watchedGuests: names }, null, 2), 'utf8')
    fs.renameSync(tmp, SETTINGS_FILE)
    return true
  } catch {
    return false
  }
}

let activeWatchlist = loadWatchlist()

function watchKeys(list = activeWatchlist) {
  return new Map(list.map((name) => [name.toLowerCase().replace(/\s+/g, ''), name]))
}

function watchedCanonical(name, keys = watchKeys()) {
  const key = String(name || '').trim().toLowerCase().replace(/\s+/g, '')
  return keys.get(key) || ''
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
    lastError: '',
  }
}

function readState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    // 旧版没有 egg258 提醒；升级后重置一次，避免把全部活动误报成“新”
    if (parsed.schema !== STATE_SCHEMA) return emptyState()
    return {
      schema: STATE_SCHEMA,
      seen: parsed.seen && typeof parsed.seen === 'object' ? parsed.seen : {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
      reminded: parsed.reminded && typeof parsed.reminded === 'object' ? parsed.reminded : {},
      initialized: parsed.initialized === true,
      newIds: Array.isArray(parsed.newIds) ? parsed.newIds : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
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

/** 从 dateTime 与 aria-label("1.1–1.3") 推出结束日期 */
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

/**
 * 从页面内嵌的 RSC 数据里抽参演嘉宾。
 * 形如：{"day":"2026-11-29","eventId":"<uuid>","id":"<uuid>","name":"egg258",...}
 * 也有不带 day 的名单形态。
 */
function attachGuests(text, events, watchedGuests = activeWatchlist) {
  const byId = new Map(events.map((e) => [e.id, e]))
  const guestMap = new Map() // eventId -> { names:Set, watchedNames:Set, watchedDays:Set }
  const keys = watchKeys(watchedGuests)

  const note = (eventId, name, day) => {
    if (!byId.has(eventId) || !name) return
    let entry = guestMap.get(eventId)
    if (!entry) {
      entry = { names: new Set(), watchedNames: new Set(), watchedDays: new Set() }
      guestMap.set(eventId, entry)
    }
    entry.names.add(name)
    const watched = watchedCanonical(name, keys)
    if (watched) {
      entry.watchedNames.add(watched)
      if (day) entry.watchedDays.add(day)
    }
  }

  const raw = String(text).replace(/\\"/g, '"')
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
    const names = entry ? [...entry.names] : []
    const watchedNames = entry ? [...entry.watchedNames] : []
    const watchedDays = entry ? [...entry.watchedDays].sort() : []
    event.guests = names.slice(0, 60)
    event.guestCount = names.length
    event.hasWatched = watchedNames.length > 0
    event.watchedNames = watchedNames
    event.watchedDays = watchedDays
    if (event.hasWatched && event.watchedDays.length === 0 && event.start) {
      event.watchedDays = [event.start]
    }
    // 兼容旧字段（egg258 仍然在关注列表里）
    event.hasEgg258 = watchedNames.includes('egg258')
    event.egg258Names = event.hasEgg258 ? ['egg258'] : []
    event.egg258Days = event.hasEgg258 ? event.watchedDays : []
  }
}

/**
 * 解析活动页 HTML。页面是 Next.js 渲染结果，每张卡片形如：
 * <article class="IKaIaq_card" id="event-<uuid>"> … </article>
 */
export function parseEvents(html, watchedGuests = activeWatchlist) {
  const text = String(html)
  const starts = [...text.matchAll(/<article class="IKaIaq_card" id="event-([0-9a-f-]{36})"/g)]
  const out = []
  for (let i = 0; i < starts.length; i++) {
    const begin = starts[i].index
    const end = i + 1 < starts.length ? starts[i + 1].index : text.length
    const block = text.slice(begin, end)

    const link = block.match(/<h2 class="IKaIaq_title"><a href="\/events\/([0-9a-f-]{36})[^"]*"[^>]*>([\s\S]*?)<\/a>/)
    if (!link) continue
    const title = decodeEntities(link[2].replace(/<[^>]*>/g, ''))
    if (!title) continue

    const timeTag = block.match(/<time[^>]*class="IKaIaq_date"[^>]*>/)
    const start = timeTag ? (timeTag[0].match(/dateTime="(\d{4}-\d{2}-\d{2})"/) || [])[1] || '' : ''
    const label = timeTag ? (timeTag[0].match(/aria-label="([^"]*)"/) || [])[1] || '' : ''

    const cityMatch = block.match(/<span class="IKaIaq_place">[\s\S]*?<\/svg>([^<]*)<\/span>/)
    const venueMatch = block.match(/<span class="IKaIaq_venue">([^<]*)<\/span>/)
    const statusMatch = block.match(/badge phase-(now|future|past)/)

    out.push({
      id: starts[i][1],
      title,
      city: cityMatch ? decodeEntities(cityMatch[1]) : '',
      venue: venueMatch ? decodeEntities(venueMatch[1]) : '',
      start,
      end: resolveEnd(start, label),
      status: statusMatch ? statusMatch[1] : '',
      special: /超级活动/.test(block),
      url: 'https://coserwiki.com/events/' + starts[i][1],
      guests: [],
      guestCount: 0,
      hasWatched: false,
      watchedNames: [],
      watchedDays: [],
      hasEgg258: false,
      egg258Names: [],
      egg258Days: [],
    })
  }
  const map = new Map()
  for (const e of out) map.set(e.id, e)
  const events = [...map.values()]
  attachGuests(text, events, watchedGuests)
  return events
}

async function fetchEvents(watchedGuests = activeWatchlist) {
  const res = await fetch(SITE, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DSH-coserwiki-reminder/0.2',
      accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const html = await res.text()
  return parseEvents(html, watchedGuests)
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
 * - 30 天内：提醒“1 个月”
 * - 7 天内：提醒“1 周”（若 1 个月还没提醒，则直接以 1 周为准，不再补 1 个月）
 * - 同一活动同一里程碑只提醒一次，由 ack 记录
 */
export function pendingReminders(state) {
  const pending = []
  for (const event of state.events) {
    if (!event.hasWatched) continue
    const days = daysUntil(event.start)
    if (!Number.isFinite(days) || days < 0) continue
    const marks = state.reminded?.[event.id] || {}
    if (days <= REMIND_DAYS['7d'] && !marks['7d']) {
      pending.push({ event, milestone: '7d', daysLeft: days })
    } else if (days > REMIND_DAYS['7d'] && days <= REMIND_DAYS['30d'] && !marks['30d']) {
      pending.push({ event, milestone: '30d', daysLeft: days })
    }
  }
  pending.sort((a, b) => a.daysLeft - b.daysLeft || String(a.event.start).localeCompare(String(b.event.start)))
  return pending
}

function reminderView({ event, milestone, daysLeft }) {
  return {
    eventId: event.id,
    milestone,
    daysLeft,
    title: event.title,
    start: event.start,
    end: event.end,
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
  return {
    updatedAt: state.updatedAt,
    lastError: state.lastError,
    watchedGuests: activeWatchlist,
    newCount: state.newIds.length,
    newIds: state.newIds,
    reminderCount: pendingReminders(state).length,
    reminders: pendingReminders(state).map(reminderView),
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
  const last = state.updatedAt ? Date.parse(state.updatedAt) : 0
  if (!force && last && now - last < INTERVAL_MS) return state
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
    const next = {
      schema: STATE_SCHEMA,
      seen,
      events,
      newIds: [...new Set(fresh)],
      reminded: state.reminded && typeof state.reminded === 'object' ? state.reminded : {},
      initialized: true,
      updatedAt: new Date(now).toISOString(),
      lastError: '',
    }
    writeState(next)
    return next
  } catch (err) {
    state.lastError = err && err.message ? err.message : String(err)
    state.updatedAt = new Date(now).toISOString()
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
            return send(200, {
              updatedAt: state.updatedAt,
              pending,
              pendingCount: pending.length,
            })
          }
          if (url.pathname === '/coserwiki/reminders/ack' && req.method === 'POST') {
            const body = await readJsonBody(req)
            const eventId = String((body && body.eventId) || '')
            const milestone = body && (body.milestone === '30d' || body.milestone === '7d') ? body.milestone : ''
            if (!eventId || !milestone) return send(400, { error: 'eventId and milestone are required' })
            const state = readState()
            const marks = state.reminded[eventId] && typeof state.reminded[eventId] === 'object'
              ? state.reminded[eventId]
              : {}
            marks[milestone] = Date.now()
            // 7 天提醒已读时，如果 1 个月提醒还没发过，就不再补发
            if (milestone === '7d' && !marks['30d']) marks['30d'] = 'skipped'
            state.reminded[eventId] = marks
            writeState(state)
            return send(200, shape(state))
          }
          if (url.pathname === '/coserwiki/settings' && req.method === 'GET') {
            return send(200, {
              watchedGuests: activeWatchlist,
              defaults: DEFAULT_WATCHED_GUESTS,
            })
          }
          if (url.pathname === '/coserwiki/settings' && req.method === 'POST') {
            const body = await readJsonBody(req)
            const next = normalizeWatchlist(body && body.watchedGuests)
            if (next.length === 0) return send(400, { error: '至少保留一位嘉宾' })
            if (!saveWatchlist(next)) return send(500, { error: '保存设置失败' })
            activeWatchlist = next
            const state = await refresh(true)
            return send(200, {
              watchedGuests: activeWatchlist,
              defaults: DEFAULT_WATCHED_GUESTS,
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
          return send(404, { error: 'not found' })
        } catch (err) {
          return send(500, { error: err && err.message ? err.message : String(err) })
        }
      },
    }))
  })
}
