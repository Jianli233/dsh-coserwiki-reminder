/**
 * coserwiki（Coser百科）活动面板 · Web 半侧
 * - 左侧栏「漫展活动」入口（主面板）
 * - 右侧栏「漫展活动」Tab
 * - 会话顶部「漫展活动」视图
 * - 关注嘉宾（egg258 / 腥味猫罐 / 兔娘 / 害羞7 / 听霜）参演活动：列表标注 + 提前 1 个月 / 1 周弹窗提醒
 */
window.__ModuleLoader__.load({
  id: 'dsh-coserwiki-reminder',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const KIND = 'coserwiki-events'
    const TAB_ID = 'dsh-coserwiki-reminder/panel'
    const PANEL_ID = 'coserwiki-events'
    const POLL_MS = 5 * 60 * 1000
    const REMINDER_POLL_MS = 60 * 1000
    const WATCH_FILTER = 'watch'
    const WATCH_LABEL = '关注嘉宾'
    const ACK_STORAGE = 'dsh-coserwiki-acked-v4'

    const CSS = `
.cw-root{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--dsw-alias-label-primary,#1f2329);font-size:13px;background:var(--dsw-alias-bg-layer-1,#fff)}
.cw-page{max-width:860px;margin:0 auto;width:100%}
.cw-head{display:flex;align-items:flex-start;gap:10px;padding:16px 18px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,#eceef2)}
.cw-side .cw-head{padding:12px 12px 8px}
.cw-title{font-size:16px;font-weight:650;line-height:1.2;margin:0}
.cw-side .cw-title{font-size:14px}
.cw-sub{color:var(--dsw-alias-label-tertiary,#8a9099);font-size:11.5px;margin-top:4px;line-height:1.5}
.cw-sub a{color:inherit;text-decoration:none;border-bottom:1px dotted currentColor}
.cw-grow{flex:1;min-width:0}
.cw-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
.cw-btn{border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-2,#f7f8fa);color:inherit;border-radius:7px;padding:4px 9px;font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap}
.cw-btn:hover{background:var(--dsw-alias-bg-layer-3,#fff)}
.cw-btn:disabled{opacity:.55;cursor:default}
.cw-btn-primary{border-color:transparent;background:var(--dsw-alias-state-business-primary,#3964fe);color:#fff}
.cw-btn-primary:hover{background:var(--dsw-alias-state-business-primary,#3964fe);opacity:.9}
.cw-chips{display:flex;gap:6px;flex-wrap:wrap;padding:10px 18px 4px}
.cw-side .cw-chips{padding:8px 12px 2px;gap:5px}
.cw-chip{border:1px solid var(--dsw-alias-border-l2,#dfe2e8);background:transparent;color:var(--dsw-alias-label-secondary,#5b6470);border-radius:999px;padding:2px 10px;font-size:12px;line-height:20px;cursor:pointer}
.cw-chip:hover{border-color:var(--dsw-alias-state-business-primary,#3964fe);color:var(--dsw-alias-state-business-primary,#3964fe)}
.cw-chip-on{background:var(--dsw-alias-state-business-primary,#3964fe);border-color:transparent;color:#fff}
.cw-chip-on:hover{color:#fff}
.cw-chip-watch{border-color:#f0a8c8;color:#c2185b;background:#fff6fa}
.cw-chip-watch.cw-chip-on{background:#c2185b;border-color:transparent;color:#fff}
.cw-chip em{font-style:normal;opacity:.62;margin-left:4px;font-size:11px}
.cw-scroll{flex:1;min-height:0;overflow:auto;padding:8px 18px 24px}
.cw-side .cw-scroll{padding:6px 12px 18px}
.cw-section{margin-top:12px}
.cw-section h3{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-tertiary,#8a9099);letter-spacing:.04em}
.cw-section h3::after{content:'';flex:1;height:1px;background:var(--dsw-alias-border-l1,#eceef2)}
.cw-list{display:flex;flex-direction:column;gap:7px}
.cw-item{display:flex;gap:11px;padding:10px 11px;border:1px solid var(--dsw-alias-border-l2,#e6e8ec);border-radius:10px;background:var(--dsw-alias-bg-layer-2,#fafbfc);text-decoration:none;color:inherit;transition:border-color .12s ease,background .12s ease}
.cw-item:hover{border-color:var(--dsw-alias-state-business-primary,#3964fe);background:var(--dsw-alias-bg-layer-3,#fff)}
.cw-item-watch{border-color:#f0a8c8;background:linear-gradient(90deg,#fff7fb,#fafbfc 55%)}
.cw-item-watch:hover{border-color:#d81b60}
.cw-date{min-width:48px;flex-shrink:0;font-size:12px;line-height:1.35;font-weight:650;color:var(--dsw-alias-state-business-primary,#3964fe);display:flex;flex-direction:column;gap:1px;padding-top:1px}
.cw-date span{font-weight:500;color:var(--dsw-alias-label-tertiary,#8a9099);font-size:11px}
.cw-main{flex:1;min-width:0}
.cw-name{font-weight:600;line-height:1.4;word-break:break-word}
.cw-meta{color:var(--dsw-alias-label-tertiary,#8a9099);font-size:11.5px;line-height:1.5;margin-top:3px;word-break:break-word}
.cw-watch-line{color:#c2185b;font-size:11.5px;line-height:1.5;margin-top:2px;font-weight:500}
.cw-tag{display:inline-block;vertical-align:1px;margin-left:5px;padding:0 5px;border-radius:4px;font-size:10.5px;line-height:16px;font-weight:500;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);color:var(--dsw-alias-label-tertiary,#8a9099)}
.cw-tag-new{background:var(--dsw-alias-state-business-primary,#3964fe);border-color:transparent;color:#fff}
.cw-tag-now{color:var(--dsw-alias-state-error-primary,#d93026);border-color:currentColor}
.cw-tag-special{color:#b26a00;border-color:#e8c37a;background:#fff8e8}
.cw-tag-watch{color:#c2185b;border-color:#f0a8c8;background:#ffe6f2;font-weight:650}
.cw-tag-soon{color:#b35c00;border-color:#f0c48a;background:#fff3e0}
.cw-empty{padding:34px 10px;text-align:center;color:var(--dsw-alias-label-tertiary,#8a9099);font-size:12px;line-height:1.7}
.cw-error{margin:8px 18px 0;padding:7px 10px;border-radius:7px;background:var(--dsw-alias-state-error-bg,#fff1f0);color:var(--dsw-alias-state-error-primary,#d93026);font-size:12px;line-height:1.5}
.cw-side .cw-error{margin:6px 12px 0}
.cw-more{display:flex;justify-content:center;margin-top:12px}
.cw-muted-link{color:var(--dsw-alias-label-tertiary,#8a9099);font-size:11.5px;text-decoration:none}
.cw-foot{padding:0 18px 16px;text-align:center}
.cw-side .cw-foot{padding:0 12px 12px}
.cw-loading{padding:40px 0;text-align:center;color:var(--dsw-alias-label-tertiary,#8a9099);font-size:12px}
.cw-settings{max-width:720px;padding:8px 0 24px;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary,#1f2329)}
.cw-settings h3{margin:0 0 4px;font-size:15px}
.cw-settings-hint{color:var(--dsw-alias-label-tertiary,#8a9099);font-size:12px;margin:0 0 12px}
.cw-settings-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px;min-height:30px}
.cw-settings-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 10px;border-radius:999px;background:#ffe6f2;border:1px solid #f0a8c8;color:#c2185b;font-size:12.5px}
.cw-settings-chip button{border:0;background:transparent;color:#c2185b;cursor:pointer;font-size:14px;line-height:1;padding:0 2px}
.cw-settings-add{display:flex;gap:8px;align-items:center}
.cw-settings-add input{flex:1;min-width:0;padding:7px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:13px;outline:none}
.cw-settings-add input:focus{border-color:#c2185b}
.cw-settings-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.cw-settings-actions button{border-radius:8px;padding:6px 12px;font-size:12.5px;line-height:18px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-2,#f7f8fa);color:inherit}
.cw-settings-actions button:hover{background:var(--dsw-alias-bg-layer-3,#fff)}
.cw-settings-actions button.cw-settings-primary{border-color:transparent;background:#c2185b;color:#fff}
.cw-settings-actions button.cw-settings-primary:hover{background:#a3154b}
.cw-settings-actions button:disabled{opacity:.55;cursor:default}
.cw-settings-status{font-size:12px;margin-top:8px;color:var(--dsw-alias-label-tertiary,#8a9099)}
.cw-settings-status.ok{color:#1a8f4a}
.cw-settings-status.err{color:var(--dsw-alias-state-error-primary,#d93026)}
.cw-modal-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(12,14,24,.46);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
.cw-modal{position:relative;width:min(460px,100%);max-height:calc(100vh - 48px);overflow:auto;box-sizing:border-box;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1f2329);border:1px solid #f0a8c8;border-radius:16px;padding:22px 22px 18px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
.cw-modal-kicker{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:650;color:#c2185b;background:#ffe6f2;border-radius:999px;padding:3px 10px}
.cw-modal h3{margin:12px 0 6px;font-size:19px;line-height:1.35}
.cw-modal-sub{color:var(--dsw-alias-label-secondary,#5b6470);font-size:13px;line-height:1.6}
.cw-modal-watch{margin-top:10px;padding:8px 10px;border-radius:9px;background:#fff6fa;border:1px solid #f7c6dd;color:#c2185b;font-size:13px;line-height:1.55;font-weight:550}
.cw-modal-count{margin-top:10px;font-size:12.5px;color:var(--dsw-alias-label-tertiary,#8a9099)}
.cw-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
.cw-modal-actions button{border-radius:9px;padding:8px 14px;font-size:13px;line-height:18px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-2,#f7f8fa);color:inherit}
.cw-modal-actions button:hover{background:var(--dsw-alias-bg-layer-3,#fff)}
.cw-modal-actions .cw-modal-primary{border-color:transparent;background:#c2185b;color:#fff}
.cw-modal-actions .cw-modal-primary:hover{background:#a3154b}
.cw-modal-close{position:absolute;top:10px;right:10px;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary,#8a9099);font-size:18px;line-height:1;cursor:pointer}
.cw-modal-close:hover{background:var(--dsw-alias-bg-layer-2,#f0f1f4)}
.cw-modal-queue{margin-top:8px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#8a9099);text-align:right}
`

    function installStyles() {
      if (typeof document === 'undefined') return
      let style = document.getElementById('dsh-coserwiki-reminder-style')
      if (!style) {
        style = document.createElement('style')
        style.id = 'dsh-coserwiki-reminder-style'
        document.head.appendChild(style)
      }
      if (style.textContent !== CSS) style.textContent = CSS
    }

    function cityName(city) {
      const value = String(city || '').trim()
      if (!value) return '其他'
      return value.replace(/市$/, '')
    }

    function pad2(n) {
      return String(n).padStart(2, '0')
    }

    function todayString() {
      const d = new Date()
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    }

    function daysUntilLocal(start) {
      const time = Date.parse(String(start || '') + 'T00:00:00')
      if (!Number.isFinite(time)) return NaN
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return Math.round((time - today.getTime()) / 86400000)
    }

    function statusOf(event) {
      const today = todayString()
      const start = event.start || ''
      const end = event.end || start
      if (start && end && start <= today && today <= end) return 'now'
      if (start && start > today) return 'future'
      if (event.status === 'now') return 'now'
      if (event.status === 'future') return 'future'
      return 'past'
    }

    function formatDay(value) {
      const text = String(value || '')
      if (!text) return '--.--'
      return text.slice(5, 7) + '.' + text.slice(8, 10)
    }

    function formatWatchDays(days) {
      if (!Array.isArray(days) || days.length === 0) return ''
      return days.map(formatDay).join('、')
    }

    function timeLabel(iso) {
      if (!iso) return ''
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      return `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    }

    function Tag({ className, children }) {
      return h('span', { className: 'cw-tag ' + (className || '') }, children)
    }

    function Item({ event, isNew }) {
      const status = statusOf(event)
      const end = event.end && event.end !== event.start ? ' → ' + formatDay(event.end) : ''
      const days = typeof event.daysLeft === 'number' ? event.daysLeft : daysUntilLocal(event.start)
      const soon = Number.isFinite(days) && days >= 0 && days <= 30 ? (days === 0 ? '今天' : '还有 ' + days + ' 天') : ''
      const watchedNames = Array.isArray(event.watchedNames) ? event.watchedNames : []
      const watchDays = formatWatchDays(event.watchedDays)
      return h('a', {
        className: 'cw-item' + (event.hasWatched ? ' cw-item-watch' : ''),
        href: event.url,
        target: '_blank',
        rel: 'noreferrer',
        title: event.title,
      },
        h('div', { className: 'cw-date' }, formatDay(event.start), end ? h('span', {}, end) : null),
        h('div', { className: 'cw-main' },
          h('div', { className: 'cw-name' }, event.title,
            isNew ? h(Tag, { className: 'cw-tag-new' }, '新') : null,
            event.hasWatched ? h(Tag, { className: 'cw-tag-watch' }, '关注') : null,
            soon ? h(Tag, { className: 'cw-tag-soon' }, soon) : null,
            status === 'now' ? h(Tag, { className: 'cw-tag-now' }, '进行中') : null,
            event.special ? h(Tag, { className: 'cw-tag-special' }, '超级活动') : null,
          ),
          h('div', { className: 'cw-meta' },
            [cityName(event.city), event.venue].filter(Boolean).join(' · '),
          ),
          event.hasWatched
            ? h('div', { className: 'cw-watch-line' },
                WATCH_LABEL + '：' + (watchedNames.length ? watchedNames.join('、') : '') + (watchDays ? ' · ' + watchDays : ''))
            : null,
        ),
      )
    }

    function Section({ title, events, newIds }) {
      if (!events.length) return null
      return h('div', { className: 'cw-section' },
        h('h3', {}, title + ' · ' + events.length),
        h('div', { className: 'cw-list' },
          ...events.map((event) => h(Item, { key: event.id, event, isNew: newIds.includes(event.id) })),
        ),
      )
    }

    function Panel({ variant }) {
      const side = variant === 'side'
      const [data, setData] = React.useState({ loading: true, events: [], newIds: [], updatedAt: '', error: '' })
      const [busy, setBusy] = React.useState(false)
      const [city, setCity] = React.useState('全部')
      const [showPast, setShowPast] = React.useState(false)

      const load = React.useCallback(async (force) => {
        if (force) setBusy(true)
        try {
          if (force) {
            try { await fetch('/coserwiki/refresh', { method: 'POST', cache: 'no-store' }) } catch { /* 刷新失败也读缓存 */ }
          }
          const res = await fetch('/coserwiki/data', { cache: 'no-store' })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const json = await res.json()
          setData({
            loading: false,
            events: Array.isArray(json.events) ? json.events : [],
            newIds: Array.isArray(json.newIds) ? json.newIds : [],
            updatedAt: json.updatedAt || '',
            error: json.lastError || '',
          })
        } catch (err) {
          setData((prev) => ({ ...prev, loading: false, error: '读取失败：' + String((err && err.message) || err) }))
        } finally {
          if (force) setBusy(false)
        }
      }, [])

      React.useEffect(() => {
        let alive = true
        load(false)
        const timer = setInterval(() => { if (alive) load(false) }, POLL_MS)
        return () => { alive = false; clearInterval(timer) }
      }, [load])

      const markRead = async () => {
        try {
          const res = await fetch('/coserwiki/read', { method: 'POST', cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            setData((prev) => ({ ...prev, newIds: Array.isArray(json.newIds) ? json.newIds : [] }))
          }
        } catch { /* ignore */ }
      }

      const events = data.events || []
      const watchedEvents = events.filter((event) => event.hasWatched)
      const cityCount = new Map()
      for (const event of events) {
        const name = cityName(event.city)
        cityCount.set(name, (cityCount.get(name) || 0) + 1)
      }
      const cities = [...cityCount.entries()].sort((a, b) => {
        if (a[0] === '成都') return -1
        if (b[0] === '成都') return 1
        return b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN')
      })

      const visible = city === '全部'
        ? events
        : city === WATCH_FILTER
          ? watchedEvents
          : events.filter((event) => cityName(event.city) === city)
      const now = visible.filter((event) => statusOf(event) === 'now')
      const upcoming = visible.filter((event) => statusOf(event) === 'future')
      const past = visible.filter((event) => statusOf(event) === 'past')

      const chips = [
        h('button', {
          key: '全部',
          type: 'button',
          className: 'cw-chip' + (city === '全部' ? ' cw-chip-on' : ''),
          onClick: () => setCity('全部'),
        }, '全部', h('em', {}, String(events.length))),
      ]
      if (watchedEvents.length > 0) {
        chips.push(h('button', {
          key: WATCH_FILTER,
          type: 'button',
          className: 'cw-chip cw-chip-watch' + (city === WATCH_FILTER ? ' cw-chip-on' : ''),
          onClick: () => setCity(WATCH_FILTER),
          title: '只看关注嘉宾参演的活动',
        }, WATCH_LABEL, h('em', {}, String(watchedEvents.length))))
      }
      for (const [name, count] of cities) {
        chips.push(h('button', {
          key: name,
          type: 'button',
          className: 'cw-chip' + (city === name ? ' cw-chip-on' : ''),
          onClick: () => setCity(name),
        }, name, h('em', {}, String(count))))
      }

      return h('div', { className: 'cw-root ' + (side ? 'cw-side' : 'cw-page') },
        h('div', { className: 'cw-head' },
          h('div', { className: 'cw-grow' },
            h('h2', { className: 'cw-title' }, '漫展活动'),
            h('div', { className: 'cw-sub' },
              'coserwiki · ' + events.length + ' 场',
              watchedEvents.length > 0 ? ' · ' + WATCH_LABEL + ' ' + watchedEvents.length + ' 场' : '',
              data.updatedAt ? ' · 更新于 ' + timeLabel(data.updatedAt) : '',
              h('a', { href: 'https://coserwiki.com/events', target: '_blank', rel: 'noreferrer' }, ' 打开网站'),
            ),
          ),
          h('div', { className: 'cw-actions' },
            data.newIds.length > 0 ? h('button', {
              type: 'button',
              className: 'cw-btn',
              onClick: markRead,
              title: '把新活动标记为已读',
            }, '已读 ' + data.newIds.length) : null,
            h('button', {
              type: 'button',
              className: 'cw-btn cw-btn-primary',
              disabled: busy,
              onClick: () => load(true),
            }, busy ? '刷新中…' : '刷新'),
          ),
        ),
        h('div', { className: 'cw-chips' }, ...chips),
        data.error ? h('div', { className: 'cw-error' }, data.error) : null,
        h('div', { className: 'cw-scroll' },
          data.loading
            ? h('div', { className: 'cw-loading' }, '正在读取 coserwiki 活动…')
            : (now.length === 0 && upcoming.length === 0 && past.length === 0)
              ? h('div', { className: 'cw-empty' }, city === WATCH_FILTER ? '暂时没有关注嘉宾参演的活动' : '这个城市暂时没有活动', h('br'), '换个筛选看看，或点右上角刷新')
              : h('div', {},
                  h(Section, { title: '进行中', events: now, newIds: data.newIds }),
                  h(Section, { title: '即将开始', events: upcoming, newIds: data.newIds }),
                  past.length > 0
                    ? h('div', { className: 'cw-section' },
                        h('div', { className: 'cw-more' },
                          h('button', {
                            type: 'button',
                            className: 'cw-btn',
                            onClick: () => setShowPast((value) => !value),
                          }, (showPast ? '收起已结束' : '显示已结束') + ' · ' + past.length),
                        ),
                        showPast
                          ? h('div', { className: 'cw-list', style: { marginTop: '10px' } },
                              ...past.map((event) => h(Item, { key: event.id, event, isNew: data.newIds.includes(event.id) })),
                            )
                          : null,
                      )
                    : null,
                ),
        ),
        h('div', { className: 'cw-foot' },
          h('a', { className: 'cw-muted-link', href: 'https://coserwiki.com/events', target: '_blank', rel: 'noreferrer' }, '数据来源：coserwiki.com'),
        ),
      )
    }

    function SettingsSection() {
      const [names, setNames] = React.useState([])
      const [defaults, setDefaults] = React.useState([])
      const [input, setInput] = React.useState('')
      const [status, setStatus] = React.useState({ text: '', kind: '' })
      const [busy, setBusy] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        fetch('/coserwiki/settings', { cache: 'no-store' })
          .then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status)
            return res.json()
          })
          .then((json) => {
            if (!alive) return
            setNames(Array.isArray(json.watchedGuests) ? json.watchedGuests : [])
            setDefaults(Array.isArray(json.defaults) ? json.defaults : [])
          })
          .catch((err) => {
            if (alive) setStatus({ text: '读取设置失败：' + String((err && err.message) || err), kind: 'err' })
          })
        return () => { alive = false }
      }, [])

      const add = () => {
        const name = input.trim()
        if (!name) {
          setStatus({ text: '先输入一个名字', kind: 'err' })
          return
        }
        if (names.some((item) => item.toLowerCase() === name.toLowerCase())) {
          setStatus({ text: '这个名字已经在名单里了', kind: 'err' })
          return
        }
        if (names.length >= 40) {
          setStatus({ text: '最多 40 位嘉宾', kind: 'err' })
          return
        }
        setNames((prev) => [...prev, name.slice(0, 40)])
        setInput('')
        setStatus({ text: '', kind: '' })
      }

      const remove = (name) => {
        setNames((prev) => prev.filter((item) => item !== name))
      }

      const save = async () => {
        if (names.length === 0) {
          setStatus({ text: '至少保留一位嘉宾', kind: 'err' })
          return
        }
        setBusy(true)
        setStatus({ text: '保存中…', kind: '' })
        try {
          const res = await fetch('/coserwiki/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ watchedGuests: names }),
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || ('HTTP ' + res.status))
          setNames(Array.isArray(json.watchedGuests) ? json.watchedGuests : names)
          setStatus({ text: '已保存，立即生效', kind: 'ok' })
        } catch (err) {
          setStatus({ text: '保存失败：' + String((err && err.message) || err), kind: 'err' })
        } finally {
          setBusy(false)
        }
      }

      return h('div', { className: 'cw-settings' },
        h('h3', {}, '漫展提醒 · 关注嘉宾'),
        h('p', { className: 'cw-settings-hint' }, '有这些嘉宾参演的活动，会在开始前 1 个月和 1 周弹窗提醒；活动列表里也会标「关注」。'),
        h('div', { className: 'cw-settings-chips' },
          names.length
            ? names.map((name) => h('span', { className: 'cw-settings-chip', key: name }, name,
                h('button', { type: 'button', title: '移除', onClick: () => remove(name) }, '×')))
            : h('span', { className: 'cw-settings-hint' }, '还没有关注嘉宾'),
        ),
        h('div', { className: 'cw-settings-add' },
          h('input', {
            value: input,
            placeholder: '输入 coser 名字，比如 兔娘',
            onChange: (event) => setInput(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                add()
              }
            },
          }),
          h('button', { type: 'button', onClick: add }, '添加'),
        ),
        h('div', { className: 'cw-settings-actions' },
          h('button', {
            type: 'button',
            className: 'cw-settings-primary',
            disabled: busy,
            onClick: save,
          }, busy ? '保存中…' : '保存关注名单'),
          h('button', {
            type: 'button',
            disabled: busy,
            onClick: () => {
              setNames(defaults.slice())
              setStatus({ text: '已恢复默认，记得保存', kind: '' })
            },
          }, '恢复默认'),
        ),
        status.text ? h('div', { className: 'cw-settings-status ' + status.kind }, status.text) : null,
      )
    }

    function CalendarIcon({ size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
        h('rect', { x: 3, y: 5, width: 18, height: 16, rx: 3 }),
        h('path', { d: 'M8 3v4M16 3v4M3 10h18' }),
        h('path', { d: 'M8 14h2M14 14h2M8 17h2M14 17h2' }),
      )
    }

    function dom(tag, className, text) {
      const node = document.createElement(tag)
      if (className) node.className = className
      if (text !== undefined) node.textContent = text
      return node
    }

    function readAcked() {
      try {
        const raw = localStorage.getItem(ACK_STORAGE)
        const list = raw ? JSON.parse(raw) : []
        return new Set(Array.isArray(list) ? list : [])
      } catch {
        return new Set()
      }
    }

    function saveAcked(acked) {
      try {
        localStorage.setItem(ACK_STORAGE, JSON.stringify([...acked].slice(-200)))
      } catch { /* ignore */ }
    }

    function installReminderModal(openEvents) {
      if (typeof document === 'undefined') return () => {}
      // 清理旧版调试标记 / HMR 残留弹窗
      try {
        for (const node of document.querySelectorAll('.cw-modal-backdrop')) node.remove()
        for (const node of document.querySelectorAll('div')) {
          if (node.childElementCount === 0 && node.textContent === 'COSER MODAL TEST') node.remove()
        }
      } catch { /* ignore */ }
      const state = {
        current: null,
        queue: [],
        acked: readAcked(),
        root: null,
        timer: null,
        stopped: false,
        nextTimer: null,
      }

      const keyOf = (reminder) => reminder.eventId + ':' + reminder.milestone

      const removeModal = () => {
        if (state.root) {
          state.root.remove()
          state.root = null
        }
        state.current = null
      }

      const showNext = () => {
        if (state.stopped || state.current || state.root) return
        const next = state.queue.find((reminder) => !state.acked.has(keyOf(reminder)))
        if (!next) return
        state.current = next
        render(next)
      }

      const hideAndContinue = () => {
        removeModal()
        if (state.nextTimer) clearTimeout(state.nextTimer)
        state.nextTimer = setTimeout(showNext, 350)
      }

      const ack = async (reminder) => {
        state.acked.add(keyOf(reminder))
        saveAcked(state.acked)
        state.queue = state.queue.filter((item) => keyOf(item) !== keyOf(reminder))
        hideAndContinue()
        try {
          await fetch('/coserwiki/reminders/ack', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ eventId: reminder.eventId, milestone: reminder.milestone }),
          })
        } catch { /* 本地已记，下次轮询服务器还会返回，但 localStorage 会挡掉 */ }
      }

      const render = (reminder) => {
        const backdrop = dom('div', 'cw-modal-backdrop')
        backdrop.style.position = 'fixed'
        backdrop.style.top = '0'
        backdrop.style.left = '0'
        backdrop.style.width = '100vw'
        backdrop.style.height = '100vh'
        backdrop.style.zIndex = '2147483000'
        backdrop.style.background = 'transparent'
        backdrop.style.display = 'block'
        backdrop.style.pointerEvents = 'none'
        backdrop.style.padding = '0'
        backdrop.style.boxSizing = 'border-box'
        const card = dom('div', 'cw-modal')
        card.style.position = 'fixed'
        card.style.left = '16px'
        card.style.top = '16px'
        card.style.transform = 'none'
        card.style.width = 'min(420px, calc(100vw - 32px))'
        card.style.zIndex = '2147483001'
        card.style.maxHeight = 'calc(100vh - 32px)'
        card.style.overflow = 'auto'
        card.style.pointerEvents = 'auto'
        backdrop.appendChild(card)

        const close = dom('button', 'cw-modal-close', '×')
        close.type = 'button'
        close.title = '关闭并标记已读'
        close.addEventListener('click', () => { ack(reminder) })
        card.appendChild(close)

        const kicker = dom('div', 'cw-modal-kicker',
          WATCH_LABEL + ' 参演提醒 · 提前' + (reminder.milestone === '7d' ? '1 周' : '1 个月'))
        card.appendChild(kicker)

        card.appendChild(dom('h3', '', reminder.title))

        const parts = []
        const range = reminder.end && reminder.end !== reminder.start
          ? formatDay(reminder.start) + ' – ' + formatDay(reminder.end)
          : formatDay(reminder.start)
        parts.push(range)
        if (reminder.city) parts.push(cityName(reminder.city))
        if (reminder.venue) parts.push(reminder.venue)
        card.appendChild(dom('div', 'cw-modal-sub', parts.join(' · ')))

        const watchNames = Array.isArray(reminder.watchedNames) ? reminder.watchedNames : []
        const watchDays = formatWatchDays(reminder.watchedDays)
        card.appendChild(dom('div', 'cw-modal-watch',
          WATCH_LABEL + '：' + (watchNames.length ? watchNames.join('、') : '') + (watchDays ? ' · ' + watchDays : '')))

        const days = typeof reminder.daysLeft === 'number' ? reminder.daysLeft : daysUntilLocal(reminder.start)
        const countdown = days === 0 ? '就是今天开始' : days > 0 ? '距开始还有 ' + days + ' 天' : '活动已经开始'
        card.appendChild(dom('div', 'cw-modal-count', countdown + ' · 点「查看活动」直接打开漫展列表'))

        const actions = dom('div', 'cw-modal-actions')
        const later = dom('button', '', '知道了')
        later.type = 'button'
        later.addEventListener('click', () => { ack(reminder) })
        const open = dom('button', 'cw-modal-primary', '查看活动')
        open.type = 'button'
        open.addEventListener('click', () => {
          ack(reminder)
          try { openEvents() } catch { /* ignore */ }
        })
        actions.appendChild(later)
        actions.appendChild(open)
        card.appendChild(actions)

        if (state.queue.length > 1) {
          card.appendChild(dom('div', 'cw-modal-queue', '还有 ' + (state.queue.length - 1) + ' 条提醒'))
        }

        state.root = backdrop
        document.body.appendChild(backdrop)

        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const note = new Notification(WATCH_LABEL + ' 参演提醒', {
              body: reminder.title + ' · ' + range + (watchNames.length ? ' · ' + watchNames.join('、') : ''),
              tag: keyOf(reminder),
            })
            note.onclick = () => { try { window.focus() } catch { /* ignore */ } }
          }
        } catch { /* ignore */ }
      }

      const poll = async () => {
        if (state.stopped) return
        try {
          const res = await fetch('/coserwiki/data', { cache: 'no-store' })
          if (!res.ok) return
          const json = await res.json()
          const pending = Array.isArray(json.reminders) ? json.reminders : []
          state.queue = pending.filter((reminder) => !state.acked.has(keyOf(reminder)))
          try {
            if (!state.current && !state.root) showNext()
          } catch { /* ignore */ }
          if (state.current && !state.queue.some((reminder) => keyOf(reminder) === keyOf(state.current))) {
            // 服务器已不再返回当前提醒（可能已在别处标记）
            removeModal()
            showNext()
          }
        } catch { /* ignore */ }
      }

      const onVisibility = () => {
        if (document.visibilityState === 'visible') poll()
      }

      state.timer = setInterval(poll, REMINDER_POLL_MS)
      document.addEventListener('visibilitychange', onVisibility)
      poll()

      return () => {
        state.stopped = true
        clearInterval(state.timer)
        if (state.nextTimer) clearTimeout(state.nextTimer)
        document.removeEventListener('visibilitychange', onVisibility)
        removeModal()
      }
    }

    function OpenAction({ subject, packageName, onOpen }) {
      if (!subject || (subject.kind !== 'bundle' && subject.kind !== 'row')) return null
      if (subject.pkg && subject.pkg.name !== packageName) return null
      if (subject.kind === 'row' && subject.row && subject.row.moduleName !== packageName) return null
      return h('button', { type: 'button', className: 'cw-btn', onClick: onOpen }, '打开漫展活动')
    }

    function apply(ctx) {
      installStyles()
      const tabs = ctx.sidebarRightTabs
      const right = ctx.sidebarRight
      const slots = ctx.slots
      const disposers = []

      if (tabs && slots) {
        disposers.push(tabs.register({
          id: TAB_ID,
          kind: KIND,
          priority: 'extension',
          title: () => '漫展活动',
          guide: [{
            id: 'coserwiki',
            order: 80,
            title: () => '漫展活动',
            description: () => 'coserwiki 漫展活动，按城市筛选，关注嘉宾参演会标注并提醒',
            icon: CalendarIcon,
          }],
        }))
        disposers.push(slots.inject('sidebar.right.pane.tab', () => slots.register({
          name: 'sidebar.right.pane.tab',
          key: TAB_ID,
          inject: () => ({ variant: 'side' }),
        }, Panel)))
        disposers.push(slots.inject('conversation.view', () => slots.register({
          name: 'conversation.view',
          id: 'coserwiki-events',
          order: 18,
          label: () => '漫展活动',
          inject: () => ({ variant: 'page' }),
        }, Panel)))
      }

      // 设置 → 漫展提醒：编辑关注嘉宾名单
      if (slots) {
        disposers.push(slots.inject('settings.section', () => slots.register({
          name: 'settings.section',
          id: 'coserwiki-watch',
          order: 41,
          label: '漫展提醒',
        }, SettingsSection)))
      }

      // 左侧栏入口 + 主面板（占满会话区）
      if (typeof ctx.inject === 'function') {
        ctx.inject(['layout'], (pageCtx) => {
          const pageSlots = pageCtx.slots
          const layout = pageCtx.layout
          if (!pageSlots || !layout) return
          disposers.push(pageSlots.inject('main', () => pageSlots.register({
            name: 'main',
            key: PANEL_ID,
          }, Panel)))
          disposers.push(pageSlots.inject('sidebar.panellist', () => pageSlots.register({
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 12,
            label: '漫展活动',
          }, CalendarIcon)))
          disposers.push(pageSlots.inject('plugins.detail.actions', () => pageSlots.register({
            name: 'plugins.detail.actions',
            id: 'coserwiki-open',
            order: 30,
            inject: () => ({
              packageName: 'dsh-coserwiki-reminder',
              onOpen: () => layout.selectPanel(PANEL_ID),
            }),
          }, OpenAction)))
        })
      }

      // 关注嘉宾提醒弹窗：独立于当前视图，轮询 /coserwiki/data
      ctx.effect(() => installReminderModal(() => {
        try {
          if (right && typeof right.openTab === 'function') right.openTab(KIND)
        } catch { /* ignore */ }
      }), 'coserwiki-reminder.modal')

      // 有新活动时自动打开右侧栏（每次页面加载最多一次）
      ctx.effect(() => {
        if (!right || typeof right.openTab !== 'function') return () => {}
        let stopped = false
        let opened = false
        const check = async () => {
          if (stopped || opened) return
          try {
            const res = await fetch('/coserwiki/data', { cache: 'no-store' })
            if (!res.ok) return
            const json = await res.json()
            if (!stopped && !opened && json.newCount > 0) {
              right.openTab(KIND)
              opened = true
            }
          } catch { /* ignore */ }
        }
        const timer = setInterval(check, POLL_MS)
        check()
        return () => { stopped = true; clearInterval(timer) }
      }, 'coserwiki-reminder.watch')

      ctx.effect(() => () => {
        for (const dispose of disposers.reverse()) {
          try { dispose() } catch { /* ignore */ }
        }
      }, 'coserwiki-reminder.ui')
    }

    return {
      inject: ['slots', 'sidebarRight', 'sidebarRightTabs'],
      apply,
    }
  },
})
