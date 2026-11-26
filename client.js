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
:where(.cw-root,.cw-toast,.cw-settings){--cw-rose:#e0235f;--cw-rose-ink:#c2185b}
.cw-page{max-width:860px;margin:0 auto;width:100%}
.cw-head{display:flex;align-items:flex-start;gap:10px;padding:16px 18px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,#eceef2)}
.cw-side .cw-head{padding:12px 12px 8px}
.cw-title{font-size:16px;font-weight:650;line-height:1.2;margin:0}
.cw-side .cw-title{font-size:14px}
.cw-sub{color:var(--dsw-alias-label-tertiary,#8a9099);font-size:11.5px;margin-top:4px;line-height:1.5}
.cw-sub a{color:inherit;text-decoration:none;border-bottom:1px dotted currentColor}
.cw-grow{flex:1;min-width:0}
.cw-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
.cw-btn{border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-2,#f7f8fa);color:inherit;border-radius:7px;padding:4px 9px;font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center}
.cw-btn:hover{background:var(--dsw-alias-bg-layer-3,#fff)}
.cw-btn:disabled{opacity:.55;cursor:default}
.cw-btn-primary{border-color:transparent;background:var(--dsw-alias-state-business-primary,#3964fe);color:#fff}
.cw-btn-primary:hover{background:var(--dsw-alias-state-business-primary,#3964fe);opacity:.9}
.cw-chips{display:flex;gap:6px;flex-wrap:wrap;padding:10px 18px 4px}
.cw-side .cw-chips{padding:8px 12px 2px;gap:5px}
.cw-tools{display:flex;align-items:center;gap:8px;padding:8px 18px 0}
.cw-side .cw-tools{padding:6px 12px 0}
.cw-search{flex:1;min-width:0;box-sizing:border-box;padding:5px 9px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2,#dfe2e8);background:transparent;color:inherit;font:inherit;font-size:12px;line-height:18px;outline:none}
.cw-search:focus{border-color:var(--dsw-alias-state-business-primary,#3964fe)}
.cw-search::placeholder{color:var(--dsw-alias-label-tertiary,#8a9099)}
.cw-chip{border:1px solid var(--dsw-alias-border-l2,#dfe2e8);background:transparent;color:var(--dsw-alias-label-secondary,#5b6470);border-radius:999px;padding:2px 10px;font-size:12px;line-height:20px;cursor:pointer}
.cw-chip:hover{border-color:var(--dsw-alias-state-business-primary,#3964fe);color:var(--dsw-alias-state-business-primary,#3964fe)}
.cw-chip-on{background:var(--dsw-alias-state-business-primary,#3964fe);border-color:transparent;color:#fff}
.cw-chip-on:hover{color:#fff}
.cw-chip-watch{border-color:rgba(224,35,95,.44);color:var(--cw-rose-ink);color:color-mix(in srgb,var(--cw-rose) 52%,var(--dsw-alias-label-primary,#1f2329));background:rgba(224,35,95,.10)}
.cw-chip-watch:hover{border-color:var(--cw-rose);color:var(--cw-rose-ink);color:color-mix(in srgb,var(--cw-rose) 62%,var(--dsw-alias-label-primary,#1f2329))}
.cw-chip-watch.cw-chip-on{background:var(--cw-rose);border-color:transparent;color:#fff}
.cw-chip em{font-style:normal;opacity:.62;margin-left:4px;font-size:11px}
.cw-scroll{flex:1;min-height:0;overflow:auto;padding:8px 18px 24px}
.cw-side .cw-scroll{padding:6px 12px 18px}
.cw-section{margin-top:12px}
.cw-section h3{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-tertiary,#8a9099);letter-spacing:.04em}
.cw-section h3::after{content:'';flex:1;height:1px;background:var(--dsw-alias-border-l1,#eceef2)}
.cw-list{display:flex;flex-direction:column;gap:7px}
.cw-item-wrap{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l2,#e6e8ec);border-radius:10px;background:var(--dsw-alias-bg-layer-2,#fafbfc);transition:border-color .12s ease,background .12s ease;overflow:hidden}
.cw-item-wrap:hover{border-color:var(--dsw-alias-state-business-primary,#3964fe);background:var(--dsw-alias-bg-layer-3,#fff)}
.cw-item-wrap.cw-item-watch{border-color:rgba(224,35,95,.24);background:linear-gradient(90deg,rgba(224,35,95,.15),rgba(224,35,95,.04) 26%,rgba(224,35,95,0) 56%),var(--dsw-alias-bg-layer-3,#fff);box-shadow:inset 3px 0 0 0 var(--cw-rose)}
.cw-item-wrap.cw-item-watch:hover{border-color:rgba(224,35,95,.52);background:linear-gradient(90deg,rgba(224,35,95,.20),rgba(224,35,95,.05) 26%,rgba(224,35,95,0) 56%),var(--dsw-alias-bg-layer-3,#fff)}
.cw-item{display:flex;gap:11px;padding:10px 11px;text-decoration:none;color:inherit}
.cw-item:hover .cw-name{color:var(--dsw-alias-state-business-primary,#3964fe)}
.cw-item-wrap.cw-item-watch .cw-item:hover .cw-name{color:var(--cw-rose-ink)}
.cw-roster-bar{display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;padding:5px 11px 6px;border:0;border-top:1px dashed var(--dsw-alias-border-l1,#eceef2);background:transparent;color:var(--dsw-alias-label-tertiary,#8a9099);font-size:11.5px;line-height:16px;cursor:pointer;text-align:left}
.cw-roster-bar:hover{color:var(--dsw-alias-state-business-primary,#3964fe)}
.cw-roster-bar em{font-style:normal;margin-left:auto;opacity:.75}
.cw-item-wrap.cw-item-watch .cw-roster-bar:hover{color:var(--cw-rose-ink)}
.cw-roster{display:flex;flex-wrap:wrap;gap:5px;padding:8px 11px 10px;border-top:1px solid var(--dsw-alias-border-l1,#eceef2);background:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.5))}
.cw-guest{display:inline-block;padding:1px 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#e6e8ec);font-size:11px;line-height:17px;color:var(--dsw-alias-label-secondary,#5b6470);background:var(--dsw-alias-bg-layer-2,#fafbfc)}
.cw-guest-on{border-color:rgba(224,35,95,.42);background:rgba(224,35,95,.12);color:var(--cw-rose-ink);font-weight:600}
.cw-guest-more{border-style:dashed;color:var(--dsw-alias-label-tertiary,#8a9099)}
.cw-date{min-width:48px;flex-shrink:0;font-size:12px;line-height:1.35;font-weight:650;color:var(--dsw-alias-state-business-primary,#3964fe);display:flex;flex-direction:column;gap:1px;padding-top:1px}
.cw-date span{font-weight:500;color:var(--dsw-alias-label-tertiary,#8a9099);font-size:11px}
.cw-main{flex:1;min-width:0}
.cw-name{font-weight:600;line-height:1.4;word-break:break-word}
.cw-meta{color:var(--dsw-alias-label-tertiary,#8a9099);font-size:11.5px;line-height:1.5;margin-top:3px;word-break:break-word}
.cw-watch-line{color:var(--cw-rose-ink);color:color-mix(in srgb,var(--cw-rose) 52%,var(--dsw-alias-label-primary,#1f2329));font-size:11.5px;line-height:1.5;margin-top:2px;font-weight:500}
.cw-tag{display:inline-block;vertical-align:1px;margin-left:5px;padding:0 5px;border-radius:4px;font-size:10.5px;line-height:16px;font-weight:500;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);color:var(--dsw-alias-label-tertiary,#8a9099)}
.cw-tag-new{background:var(--dsw-alias-state-business-primary,#3964fe);border-color:transparent;color:#fff}
.cw-tag-now{color:var(--dsw-alias-state-error-primary,#d93026);border-color:currentColor}
.cw-tag-special{color:#b26a00;color:color-mix(in srgb,#ffb648 45%,var(--dsw-alias-label-primary,#1f2329));border-color:rgba(255,182,72,.42);background:rgba(255,182,72,.14)}
.cw-tag-watch{color:#fff;border-color:transparent;background:var(--cw-rose);font-weight:650}
.cw-tag-soon{color:#b35c00;color:color-mix(in srgb,#ff9d4d 45%,var(--dsw-alias-label-primary,#1f2329));border-color:rgba(255,157,77,.42);background:rgba(255,157,77,.13)}
.cw-empty{padding:34px 10px;text-align:center;color:var(--dsw-alias-label-tertiary,#8a9099);font-size:12px;line-height:1.7}
.cw-error{display:flex;align-items:center;gap:8px;margin:8px 18px 0;padding:7px 10px;border-radius:7px;background:var(--dsw-alias-state-error-bg,#fff1f0);color:var(--dsw-alias-state-error-primary,#d93026);font-size:12px;line-height:1.5}
.cw-error button{margin-left:auto;flex-shrink:0;border:1px solid currentColor;background:transparent;color:inherit;border-radius:6px;padding:1px 8px;font-size:11.5px;line-height:18px;cursor:pointer}
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
.cw-settings-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 10px;border-radius:999px;background:rgba(224,35,95,.10);border:1px solid rgba(224,35,95,.44);color:var(--cw-rose-ink);color:color-mix(in srgb,var(--cw-rose) 52%,var(--dsw-alias-label-primary,#1f2329));font-size:12.5px}
.cw-settings-chip button{border:0;background:transparent;color:inherit;cursor:pointer;font-size:14px;line-height:1;padding:0 2px}
.cw-settings-add{display:flex;gap:8px;align-items:center}
.cw-settings-add input{flex:1;min-width:0;padding:7px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:13px;outline:none}
.cw-settings-add input:focus{border-color:var(--cw-rose,#e0235f)}
.cw-settings-label{font-size:12.5px;font-weight:600;margin:18px 0 7px;color:var(--dsw-alias-label-secondary,#5b6470)}
.cw-node-chips{display:flex;flex-wrap:wrap;gap:6px}
.cw-node{border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:transparent;color:var(--dsw-alias-label-secondary,#5b6470);border-radius:999px;padding:2px 10px;font-size:12px;line-height:20px;cursor:pointer}
.cw-node:hover{border-color:rgba(224,35,95,.5);color:#a3164c}
.cw-node-on{background:#c2185b;border-color:transparent;color:#fff}
.cw-node-on:hover{background:#a3154b;color:#fff}
.cw-settings-custom{display:flex;gap:8px;align-items:center;margin-top:8px}
.cw-settings-custom input{width:92px;padding:5px 9px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:12.5px;outline:none}
.cw-settings-custom input:focus{border-color:var(--cw-rose,#e0235f)}
.cw-settings-custom button{border-radius:7px;padding:4px 10px;font-size:12px;line-height:18px;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-2,#f7f8fa);color:inherit;cursor:pointer}
.cw-settings-custom button:hover{background:var(--dsw-alias-bg-layer-3,#fff)}
.cw-settings-preview{font-size:12px;color:var(--cw-rose-ink);color:color-mix(in srgb,var(--cw-rose) 52%,var(--dsw-alias-label-primary,#1f2329));margin-top:9px;line-height:1.65}
.cw-settings-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.cw-settings-actions button{border-radius:8px;padding:6px 12px;font-size:12.5px;line-height:18px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-2,#f7f8fa);color:inherit}
.cw-settings-actions button:hover{background:var(--dsw-alias-bg-layer-3,#fff)}
.cw-settings-actions button.cw-settings-primary{border-color:transparent;background:#c2185b;color:#fff}
.cw-settings-actions button.cw-settings-primary:hover{background:#a3154b}
.cw-settings-actions button:disabled{opacity:.55;cursor:default}
.cw-settings-status{font-size:12px;margin-top:8px;color:var(--dsw-alias-label-tertiary,#8a9099)}
.cw-settings-status.ok{color:#1a8f4a}
.cw-settings-status.err{color:var(--dsw-alias-state-error-primary,#d93026)}
.cw-toasts{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;flex-direction:column;gap:9px;width:min(372px,calc(100vw - 32px));pointer-events:none;--cw-rose:#e0235f}
.cw-toasts-more{align-self:flex-end;pointer-events:auto;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:var(--dsw-alias-bg-layer-2,#f7f8fa);color:var(--dsw-alias-label-secondary,#5b6470);border-radius:999px;padding:2px 10px;font-size:11.5px;line-height:18px;cursor:pointer}
.cw-toasts-more:hover{border-color:rgba(224,35,95,.5);color:#a3164c}
.cw-toast{position:relative;pointer-events:auto;display:flex;flex-direction:column;padding:11px 32px 11px 13px;border-radius:13px;border:1px solid rgba(224,35,95,.30);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1f2329);box-shadow:0 18px 44px rgba(10,12,20,.26),0 2px 8px rgba(10,12,20,.10);animation:cw-toast-in .24s cubic-bezier(.2,.9,.3,1) both}
.cw-toast::before{content:'';position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 3px 3px 0;background:var(--cw-rose)}
.cw-toast-out{animation:cw-toast-out .18s ease-in forwards}
@keyframes cw-toast-in{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes cw-toast-out{to{opacity:0;transform:translateY(10px) scale(.99)}}
.cw-toast-kicker{font-size:11px;font-weight:650;letter-spacing:.02em;color:#a3164c;color:color-mix(in srgb,var(--cw-rose) 58%,var(--dsw-alias-label-primary,#1f2329))}
.cw-toast-title{margin-top:3px;font-size:13.5px;font-weight:650;line-height:1.4;word-break:break-word}
.cw-toast-meta{margin-top:3px;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#8a9099);word-break:break-word}
.cw-toast-watch{margin-top:3px;font-size:11.5px;line-height:1.5;font-weight:550;color:#a3164c;color:color-mix(in srgb,var(--cw-rose) 55%,var(--dsw-alias-label-primary,#1f2329))}
.cw-toast-actions{display:flex;align-items:center;gap:8px;margin-top:10px}
.cw-toast-actions button{border-radius:8px;padding:4px 11px;font-size:12px;line-height:18px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#d9dbe0);background:transparent;color:inherit}
.cw-toast-actions button:hover{background:var(--dsw-alias-bg-layer-2,#f0f1f4)}
.cw-toast-actions .cw-toast-primary{margin-left:auto;border-color:transparent;background:#c2185b;color:#fff}
.cw-toast-actions .cw-toast-primary:hover{background:#a3154b;color:#fff}
.cw-toast-close{position:absolute;top:6px;right:6px;width:24px;height:24px;padding:0;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-tertiary,#8a9099);font-size:15px;line-height:1;cursor:pointer}
.cw-toast-close:hover{background:var(--dsw-alias-bg-layer-2,#f0f1f4);color:var(--dsw-alias-label-primary,#1f2329)}
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

    /** 名字归一化：全角转半角、忽略大小写和空白，和服务端保持一致 */
    function foldName(value) {
      return String(value || '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/\s+/g, '')
    }

    const FILTER_KEY = 'dsh-coserwiki-filter'
    const FILTER_ALL = '全部'

    function readFilter() {
      try {
        return localStorage.getItem(FILTER_KEY) || FILTER_ALL
      } catch {
        return FILTER_ALL
      }
    }

    function saveFilter(value) {
      try {
        localStorage.setItem(FILTER_KEY, value)
      } catch { /* ignore */ }
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
      const [rosterOpen, setRosterOpen] = React.useState(false)
      const status = statusOf(event)
      const end = event.end && event.end !== event.start ? ' → ' + formatDay(event.end) : ''
      const days = typeof event.daysLeft === 'number' ? event.daysLeft : daysUntilLocal(event.start)
      const soon = Number.isFinite(days) && days >= 0 && days <= 30 ? (days === 0 ? '今天' : '还有 ' + days + ' 天') : ''
      const watchedNames = Array.isArray(event.watchedNames) ? event.watchedNames : []
      const watchDays = formatWatchDays(event.watchedDays)
      const guests = Array.isArray(event.guests) ? event.guests : []
      const guestCount = typeof event.guestCount === 'number' ? event.guestCount : guests.length
      const watchedKeys = new Set(watchedNames.map(foldName))
      const meta = [[cityName(event.city), event.venue].filter(Boolean).join(' · '), guestCount > 0 ? guestCount + ' 位嘉宾' : '']
        .filter(Boolean)
        .join(' · ')
      return h('div', { className: 'cw-item-wrap' + (event.hasWatched ? ' cw-item-watch' : '') },
        h('a', {
          className: 'cw-item',
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
            h('div', { className: 'cw-meta' }, meta),
            event.hasWatched
              ? h('div', { className: 'cw-watch-line' },
                  WATCH_LABEL + '：' + (watchedNames.length ? watchedNames.join('、') : '') + (watchDays ? ' · ' + watchDays : ''))
              : null,
          ),
        ),
        guestCount > 0
          ? h('button', {
              type: 'button',
              className: 'cw-roster-bar',
              onClick: () => setRosterOpen((value) => !value),
              'aria-expanded': rosterOpen,
              title: rosterOpen ? '收起参演名单' : '展开参演名单',
            }, rosterOpen ? '收起名单' : '参演名单', h('em', {}, guestCount + ' 人'))
          : null,
        rosterOpen && guests.length
          ? h('div', { className: 'cw-roster' },
              ...guests.map((name) => h('span', {
                key: name,
                className: 'cw-guest' + (watchedKeys.has(foldName(name)) ? ' cw-guest-on' : ''),
              }, name)),
              guests.length < guestCount
                ? h('span', { className: 'cw-guest cw-guest-more' }, '等 ' + guestCount + ' 人')
                : null,
            )
          : null,
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
      const [city, setCity] = React.useState(readFilter)
      const [query, setQuery] = React.useState('')
      const [showPast, setShowPast] = React.useState(false)

      const chooseCity = (value) => {
        setCity(value)
        saveFilter(value)
      }

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

      // 记住的筛选条件如果对不上了（那座城市没活动了），自动回到「全部」
      React.useEffect(() => {
        if (!events.length || city === FILTER_ALL || city === WATCH_FILTER) return
        if (!events.some((event) => cityName(event.city) === city)) {
          setCity(FILTER_ALL)
          saveFilter(FILTER_ALL)
        }
      }, [events, city])

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

      const q = query.trim().toLowerCase()
      const matches = (event) => {
        if (!q) return true
        const hay = [
          event.title,
          event.city,
          event.province,
          event.venue,
          ...(Array.isArray(event.guests) ? event.guests : []),
          ...(Array.isArray(event.watchedNames) ? event.watchedNames : []),
        ].join(' ').toLowerCase()
        return hay.includes(q)
      }
      const byCity = city === FILTER_ALL
        ? events
        : city === WATCH_FILTER
          ? watchedEvents
          : events.filter((event) => cityName(event.city) === city)
      const visible = byCity.filter(matches)
      const now = visible.filter((event) => statusOf(event) === 'now')
      const upcoming = visible.filter((event) => statusOf(event) === 'future')
      const past = visible.filter((event) => statusOf(event) === 'past')

      const chips = [
        h('button', {
          key: FILTER_ALL,
          type: 'button',
          className: 'cw-chip' + (city === FILTER_ALL ? ' cw-chip-on' : ''),
          onClick: () => chooseCity(FILTER_ALL),
        }, FILTER_ALL, h('em', {}, String(events.length))),
      ]
      if (watchedEvents.length > 0) {
        chips.push(h('button', {
          key: WATCH_FILTER,
          type: 'button',
          className: 'cw-chip cw-chip-watch' + (city === WATCH_FILTER ? ' cw-chip-on' : ''),
          onClick: () => chooseCity(WATCH_FILTER),
          title: '只看关注嘉宾参演的活动',
        }, WATCH_LABEL, h('em', {}, String(watchedEvents.length))))
      }
      for (const [name, count] of cities) {
        chips.push(h('button', {
          key: name,
          type: 'button',
          className: 'cw-chip' + (city === name ? ' cw-chip-on' : ''),
          onClick: () => chooseCity(name),
        }, name, h('em', {}, String(count))))
      }

      const emptyText = q
        ? '没有搜到「' + query.trim() + '」，换个关键词试试'
        : city === WATCH_FILTER
          ? '暂时没有关注嘉宾参演的活动'
          : city === FILTER_ALL
            ? '暂时没有活动数据'
            : '这个城市暂时没有活动'

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
            h('a', {
              className: 'cw-btn',
              href: '/coserwiki/calendar.ics' + (watchedEvents.length > 0 ? '' : '?scope=all'),
              download: 'coserwiki-events.ics',
              title: watchedEvents.length > 0 ? '把关注嘉宾的场次导出成日历文件' : '把所有未来场次导出成日历文件',
            }, '日历'),
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
        h('div', { className: 'cw-tools' },
          h('input', {
            className: 'cw-search',
            type: 'search',
            value: query,
            placeholder: '搜活动、场馆或嘉宾…',
            onChange: (event) => setQuery(event.target.value),
          }),
        ),
        h('div', { className: 'cw-chips' }, ...chips),
        data.error ? h('div', { className: 'cw-error' }, data.error,
          h('button', { type: 'button', onClick: () => load(true) }, '重试')) : null,
        h('div', { className: 'cw-scroll' },
          data.loading
            ? h('div', { className: 'cw-loading' }, '正在读取 coserwiki 活动…')
            : (now.length === 0 && upcoming.length === 0 && past.length === 0)
              ? h('div', { className: 'cw-empty' }, emptyText, h('br'), '换个筛选看看，或点右上角刷新')
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

    const REMINDER_PRESETS = [30, 14, 7, 3, 1, 0]
    const MAX_REMINDER_NODES = 6

    function nodeLabel(days) {
      if (days === 0) return '当天'
      if (days % 30 === 0) return days / 30 + ' 个月'
      if (days % 7 === 0) return days / 7 + ' 周'
      return days + ' 天'
    }

    function SettingsSection() {
      const [names, setNames] = React.useState([])
      const [days, setDays] = React.useState([30, 7])
      const [defaults, setDefaults] = React.useState([])
      const [defaultDays, setDefaultDays] = React.useState([30, 7])
      const [input, setInput] = React.useState('')
      const [custom, setCustom] = React.useState('')
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
            if (Array.isArray(json.reminderDays) && json.reminderDays.length) {
              setDays(json.reminderDays.slice().sort((a, b) => b - a))
            }
            setDefaults(Array.isArray(json.defaults) ? json.defaults : [])
            if (Array.isArray(json.defaultReminderDays) && json.defaultReminderDays.length) {
              setDefaultDays(json.defaultReminderDays.slice().sort((a, b) => b - a))
            }
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

      const toggleDay = (value) => {
        if (days.includes(value)) {
          if (days.length === 1) {
            setStatus({ text: '至少留一个提醒时间', kind: 'err' })
            return
          }
          setDays(days.filter((item) => item !== value))
        } else {
          if (days.length >= MAX_REMINDER_NODES) {
            setStatus({ text: '最多 ' + MAX_REMINDER_NODES + ' 个提醒时间', kind: 'err' })
            return
          }
          setDays([...days, value].sort((a, b) => b - a))
        }
        setStatus({ text: '', kind: '' })
      }

      const addCustom = () => {
        const value = Math.round(Number(custom))
        if (!Number.isFinite(value) || value < 0 || value > 365) {
          setStatus({ text: '提醒天数填 0–365 之间的整数', kind: 'err' })
          return
        }
        if (days.includes(value)) {
          setStatus({ text: '这个时间点已经有了', kind: 'err' })
          return
        }
        if (days.length >= MAX_REMINDER_NODES) {
          setStatus({ text: '最多 ' + MAX_REMINDER_NODES + ' 个提醒时间', kind: 'err' })
          return
        }
        setDays([...days, value].sort((a, b) => b - a))
        setCustom('')
        setStatus({ text: '', kind: '' })
      }

      const save = async () => {
        if (names.length === 0) {
          setStatus({ text: '至少保留一位嘉宾', kind: 'err' })
          return
        }
        if (days.length === 0) {
          setStatus({ text: '至少留一个提醒时间', kind: 'err' })
          return
        }
        setBusy(true)
        setStatus({ text: '保存中…', kind: '' })
        try {
          const res = await fetch('/coserwiki/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ watchedGuests: names, reminderDays: days }),
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || ('HTTP ' + res.status))
          setNames(Array.isArray(json.watchedGuests) ? json.watchedGuests : names)
          if (Array.isArray(json.reminderDays) && json.reminderDays.length) {
            setDays(json.reminderDays.slice().sort((a, b) => b - a))
          }
          setStatus({ text: '已保存，立即生效', kind: 'ok' })
        } catch (err) {
          setStatus({ text: '保存失败：' + String((err && err.message) || err), kind: 'err' })
        } finally {
          setBusy(false)
        }
      }

      const ordered = days.slice().sort((a, b) => b - a)

      return h('div', { className: 'cw-settings' },
        h('h3', {}, '漫展提醒'),
        h('p', { className: 'cw-settings-hint' }, '关注的 coser 参演活动时，会在下面这些时间点各提醒一次。'),
        h('div', { className: 'cw-settings-label' }, '关注嘉宾'),
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
        h('div', { className: 'cw-settings-label' }, '提醒时间'),
        h('div', { className: 'cw-node-chips' },
          ...REMINDER_PRESETS.map((value) => h('button', {
            key: value,
            type: 'button',
            className: 'cw-node' + (days.includes(value) ? ' cw-node-on' : ''),
            'aria-pressed': days.includes(value),
            onClick: () => toggleDay(value),
          }, nodeLabel(value))),
        ),
        h('div', { className: 'cw-settings-custom' },
          h('input', {
            type: 'number',
            min: 0,
            max: 365,
            value: custom,
            placeholder: '自定义天数',
            onChange: (event) => setCustom(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCustom()
              }
            },
          }),
          h('button', { type: 'button', onClick: addCustom }, '添加'),
        ),
        h('div', { className: 'cw-settings-preview' },
          '当前：活动开始前 ' + (ordered.length ? ordered.map(nodeLabel).join('、') : '（还没选）') + ' 各提醒一次'),
        h('div', { className: 'cw-settings-actions' },
          h('button', {
            type: 'button',
            className: 'cw-settings-primary',
            disabled: busy,
            onClick: save,
          }, busy ? '保存中…' : '保存设置'),
          h('button', {
            type: 'button',
            disabled: busy,
            onClick: () => {
              setNames(defaults.slice())
              setDays(defaultDays.slice().sort((a, b) => b - a))
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

    const SNOOZE_STORAGE = 'dsh-coserwiki-snoozed-v1'
    const SNOOZE_MS = 30 * 60 * 1000
    const TOAST_LIMIT = 3

    function readSnoozed() {
      try {
        const raw = localStorage.getItem(SNOOZE_STORAGE)
        const parsed = raw ? JSON.parse(raw) : {}
        const now = Date.now()
        const out = {}
        for (const [key, until] of Object.entries(parsed && typeof parsed === 'object' ? parsed : {})) {
          if (typeof until === 'number' && until > now) out[key] = until
        }
        return out
      } catch {
        return {}
      }
    }

    function saveSnoozed(map) {
      try {
        localStorage.setItem(SNOOZE_STORAGE, JSON.stringify(map))
      } catch { /* ignore */ }
    }

    /** 30 → 1 个月、7 → 1 周、3 → 3 天、0 → 当天 */
    function milestoneLabel(threshold) {
      const days = Number(threshold)
      if (!Number.isFinite(days) || days < 0) return ''
      if (days === 0) return '当天'
      if (days % 30 === 0) return days / 30 + ' 个月'
      if (days % 7 === 0) return days / 7 + ' 周'
      return days + ' 天'
    }

    function thresholdOf(reminder) {
      const direct = Number(reminder && reminder.threshold)
      if (Number.isFinite(direct)) return direct
      const match = String((reminder && reminder.milestone) || '').match(/\d+/)
      return match ? Number(match[0]) : 0
    }

    function installReminderToasts(openEvents) {
      if (typeof document === 'undefined') return () => {}
      // 清理旧版残留（1.2 的全屏弹窗）
      try {
        for (const node of document.querySelectorAll('.cw-modal-backdrop, .cw-toasts')) node.remove()
      } catch { /* ignore */ }

      const state = {
        acked: readAcked(),
        snoozed: readSnoozed(),
        container: null,
        more: null,
        nodes: new Map(),
        reminders: [],
        timer: null,
        stopped: false,
      }

      const keyOf = (reminder) => reminder.eventId + ':' + reminder.milestone

      const ensureContainer = () => {
        if (state.container && document.body.contains(state.container)) return state.container
        const box = dom('div', 'cw-toasts')
        const more = dom('button', 'cw-toasts-more', '')
        more.type = 'button'
        more.style.display = 'none'
        more.addEventListener('click', () => { try { openEvents() } catch { /* ignore */ } })
        box.appendChild(more)
        document.body.appendChild(box)
        state.container = box
        state.more = more
        return box
      }

      const removeNode = (key) => {
        const node = state.nodes.get(key)
        if (!node) return
        state.nodes.delete(key)
        node.classList.add('cw-toast-out')
        setTimeout(() => { try { node.remove() } catch { /* ignore */ } }, 200)
      }

      const updateMore = (count) => {
        if (!state.more) return
        if (count > 0) {
          state.more.textContent = '还有 ' + count + ' 条提醒 · 打开面板'
          state.more.style.display = ''
        } else {
          state.more.style.display = 'none'
        }
      }

      const ack = async (reminder) => {
        const key = keyOf(reminder)
        state.acked.add(key)
        saveAcked(state.acked)
        removeNode(key)
        sync(state.reminders)
        try {
          await fetch('/coserwiki/reminders/ack', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ eventId: reminder.eventId, milestone: reminder.milestone }),
          })
        } catch { /* 本地已记，下次轮询服务器还会返回，但 localStorage 会挡掉 */ }
      }

      const snooze = (reminder) => {
        const key = keyOf(reminder)
        state.snoozed[key] = Date.now() + SNOOZE_MS
        saveSnoozed(state.snoozed)
        removeNode(key)
        sync(state.reminders)
      }

      const isSnoozed = (key) => {
        const until = state.snoozed[key]
        if (!until) return false
        if (until > Date.now()) return true
        delete state.snoozed[key]
        saveSnoozed(state.snoozed)
        return false
      }

      const refreshMore = () => {
        const wanted = state.reminders.filter((reminder) => !state.acked.has(keyOf(reminder)) && !isSnoozed(keyOf(reminder)))
        updateMore(Math.max(0, wanted.length - state.nodes.size))
      }

      const buildToast = (reminder) => {
        const card = dom('div', 'cw-toast')
        card.setAttribute('role', 'status')
        const threshold = thresholdOf(reminder)
        const label = milestoneLabel(threshold)
        const days = typeof reminder.daysLeft === 'number' ? reminder.daysLeft : daysUntilLocal(reminder.start)
        const countdown = days === 0 ? '今天开始' : days > 0 ? '还有 ' + days + ' 天' : '已开始'
        card.appendChild(dom('div', 'cw-toast-kicker',
          WATCH_LABEL + ' · ' + (label ? '提前 ' + label : '提醒') + ' · ' + countdown))
        card.appendChild(dom('div', 'cw-toast-title', reminder.title || ''))

        const range = reminder.end && reminder.end !== reminder.start
          ? formatDay(reminder.start) + ' – ' + formatDay(reminder.end)
          : formatDay(reminder.start)
        const meta = [range, reminder.city ? cityName(reminder.city) : '', reminder.venue || ''].filter(Boolean).join(' · ')
        if (meta) card.appendChild(dom('div', 'cw-toast-meta', meta))

        const watchNames = Array.isArray(reminder.watchedNames) ? reminder.watchedNames : []
        const watchDays = formatWatchDays(reminder.watchedDays)
        if (watchNames.length || watchDays) {
          card.appendChild(dom('div', 'cw-toast-watch',
            (watchNames.length ? watchNames.join('、') : WATCH_LABEL) + (watchDays ? ' · ' + watchDays : '')))
        }

        const close = dom('button', 'cw-toast-close', '×')
        close.type = 'button'
        close.title = '稍后 30 分钟再提醒'
        close.setAttribute('aria-label', '稍后提醒')
        close.addEventListener('click', () => snooze(reminder))
        card.appendChild(close)

        const actions = dom('div', 'cw-toast-actions')
        const later = dom('button', '', '稍后提醒')
        later.type = 'button'
        later.addEventListener('click', () => snooze(reminder))
        const open = dom('button', 'cw-toast-primary', '查看活动')
        open.type = 'button'
        open.addEventListener('click', () => {
          ack(reminder)
          try { openEvents() } catch { /* ignore */ }
        })
        actions.appendChild(later)
        actions.appendChild(open)
        card.appendChild(actions)

        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const note = new Notification(WATCH_LABEL + ' 参演提醒', {
              body: (reminder.title || '') + (reminder.city ? ' · ' + cityName(reminder.city) : ''),
              tag: keyOf(reminder),
            })
            note.onclick = () => { try { window.focus() } catch { /* ignore */ } }
          }
        } catch { /* ignore */ }

        return card
      }

      const sync = (pending) => {
        state.reminders = pending
        const wanted = pending.filter((reminder) => !state.acked.has(keyOf(reminder)) && !isSnoozed(keyOf(reminder)))
        const visible = wanted.slice(0, TOAST_LIMIT)
        const visibleKeys = new Set(visible.map(keyOf))

        for (const key of [...state.nodes.keys()]) {
          if (!visibleKeys.has(key)) removeNode(key)
        }
        if (visible.length > 0) {
          const box = ensureContainer()
          for (const reminder of visible) {
            const key = keyOf(reminder)
            if (state.nodes.has(key)) continue
            const node = buildToast(reminder)
            state.nodes.set(key, node)
            box.appendChild(node)
          }
        }
        if (state.more && state.container && state.container.firstChild !== state.more) {
          state.container.insertBefore(state.more, state.container.firstChild)
        }
        refreshMore()
      }

      const poll = async () => {
        if (state.stopped) return
        try {
          // 只取提醒列表，别每分钟拖一整页活动数据
          const res = await fetch('/coserwiki/reminders', { cache: 'no-store' })
          if (!res.ok) return
          const json = await res.json()
          const pending = Array.isArray(json.reminders) ? json.reminders : []
          sync(pending)
        } catch { /* ignore */ }
      }

      const onVisibility = () => {
        if (document.visibilityState === 'visible') poll()
      }

      const onKeyDown = (event) => {
        if (event.key !== 'Escape') return
        const first = state.reminders.find((reminder) => state.nodes.has(keyOf(reminder)))
        if (first) snooze(first)
      }

      state.timer = setInterval(poll, REMINDER_POLL_MS)
      document.addEventListener('visibilitychange', onVisibility)
      document.addEventListener('keydown', onKeyDown)
      poll()

      return () => {
        state.stopped = true
        clearInterval(state.timer)
        document.removeEventListener('visibilitychange', onVisibility)
        document.removeEventListener('keydown', onKeyDown)
        for (const node of state.nodes.values()) {
          try { node.remove() } catch { /* ignore */ }
        }
        state.nodes.clear()
        if (state.container) {
          try { state.container.remove() } catch { /* ignore */ }
          state.container = null
          state.more = null
        }
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

      // 关注嘉宾提醒：右下角轻提示，独立于当前视图，轮询 /coserwiki/reminders
      ctx.effect(() => installReminderToasts(() => {
        try {
          if (right && typeof right.openTab === 'function') right.openTab(KIND)
        } catch { /* ignore */ }
      }), 'coserwiki-reminder.toasts')

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
