# CoserWiki 漫展提醒

把 [coserwiki](https://coserwiki.com/events)（Coser 百科）的漫展活动接进 DSH：一屏看完所有场次、按城市筛选，关注你喜欢的 Coser 达人——他们参演的活动会自动标上「关注」，并在开始前 **1 个月** 和 **1 周** 各提醒你一次。

不用再每周翻活动页，也不会因为记错日期错过场次。

## 功能

- **一屏看完**：标题、日期、城市、场馆、嘉宾人数、倒计时，全部列在同一块面板里。
- **筛选**：按城市筛，或切到「关注嘉宾」只看他们参演的场次；筛选条件会记住，下次打开还是上次的城市。
- **搜索**：按活动名、场馆、城市或嘉宾名字直接搜，比如输入「兔娘」就只剩她参演的场次。
- **看名单**：点卡片下方的「参演名单」，直接展开这一场的嘉宾；关注的嘉宾会高亮标出，不用跳去网站。
- **关注 Coser 达人**：任意添加名字，有他们参演的活动会标「关注」，并列出嘉宾与具体参演日期。
- **提醒时间自己定**：默认开始前 1 个月、1 周各提醒一次；设置里可以改成 1 个月 / 2 周 / 1 周 / 3 天 / 1 天 / 当天，也能填任意 0–365 天，最多 6 个节点。
- **轻提示不挡操作**：提醒是右下角卡片，最多同时 3 条，多的收进「还有 N 条提醒」；可以「稍后提醒」（30 分钟后再来）、按 Esc 稍后，或「查看活动」直接跳面板。
- **不漏提醒**：关掉 DSH 期间错过的提醒，下次打开会补弹。
- **导出日历**：点标题栏「日历」，把关注嘉宾的场次导出成 `.ics`，拖进手机/电脑日历就能同步。
- **随时改**：关注名单和提醒时间都在「设置 → 插件 → 漫展提醒」里修改，保存后立即生效。
- **数据留在本地**：状态和设置都在 `~/.dsh/coserwiki-reminder/`，不上传。

## 在哪看

- 左侧栏「漫展活动」图标
- 对话区顶部「漫展活动」标签
- 右侧栏「漫展活动」Tab

## 默认关注嘉宾

egg258、腥味猫罐、兔娘、害羞7、听霜

可以在设置里删改，也可以直接输入新名字。

## 默认提醒时间

活动开始前 30 天、7 天各提醒一次；这两个节点同样可以在设置里增删。

## 数据

- 来源：<https://coserwiki.com/events>（公开活动页，含参演名单）
- 解析优先读页面内嵌的结构化数据（活动名 / 起止日期 / 省市 / 场馆 / 参演名单），HTML 卡片只做兜底，站方改版不容易整体失效
- 后台每 30 分钟抓一次；抓取失败 5 分钟后自动重试，面板上有手动刷新
- 状态和设置：`~/.dsh/coserwiki-reminder/`
- 接口：`GET /coserwiki/data`、`POST /coserwiki/refresh`、`POST /coserwiki/read`、`GET /coserwiki/reminders`、`POST /coserwiki/reminders/ack`、`GET|POST /coserwiki/settings`、`GET /coserwiki/calendar.ics`

## 安装

本地目录安装（开发）：

```sh
dsh plugin --profile <profile> add <此目录>
```

发布到 npm 后可：

```sh
dsh plugin --profile <profile> add dsh-coserwiki-reminder
```

## 注意

- 只在 DSH 运行时检查提醒；DSH 关闭期间不会弹系统通知。
- coserwiki 改版可能导致抓取暂时失效，面板会显示错误原因。
- 关注嘉宾按名字精确匹配；如果 coserwiki 上的写法和输入不一致，请在设置里改成页面上的写法。

---

## English

**CoserWiki Event Radar** brings [coserwiki](https://coserwiki.com/events) cosplay-event listings into DSH — every event in one panel, filtered by city if you like, with the cosplayers you follow highlighted and reminded ahead of time.

No more scrolling the event page every week, and no more missing a date you meant to keep.

### What it does

- **One panel, every event**: title, dates, city, venue, guest count and countdown, in a single list.
- **Filtering**: narrow down by city, or switch to “Watched” to see only events featuring your cosplayers. The last filter is remembered.
- **Search**: type an event, venue, city or guest name — “兔娘” leaves only her events.
- **Guest rosters**: expand “参演名单” under a card to see who is at that event; watched cosplayers are highlighted.
- **Follow any cosplayer**: events they appear at get a “Watched” badge, with guest names and appearance dates.
- **Reminder timing you choose**: one month and one week ahead by default; pick 1 month / 2 weeks / 1 week / 3 days / 1 day / the day itself, or any 0–365 days, up to 6 nodes.
- **Toasts, not walls**: reminders stack in the bottom-right corner (3 at a time, the rest collapse into “还有 N 条提醒”), with “稍后提醒” to come back in 30 minutes, Esc for the same, and “查看活动” to jump to the panel.
- **Nothing lost**: reminders missed while DSH was closed are replayed the next time you open it.
- **Calendar export**: “日历” in the header downloads an `.ics` with the watched events.
- **Editable watchlist and timing**: both live in *Settings → Plugins → CoserWiki Reminder*; changes apply immediately.
- **Local by design**: state and settings live in `~/.dsh/coserwiki-reminder/` and are never uploaded.

### Where to find it

- The “Events” icon in the left sidebar
- The “Events” tab above the conversation
- The “Events” tab in the right sidebar

### Default watchlist

egg258, 腥味猫罐 (Xingwei Maoguan), 兔娘 (Tu Niang), 害羞7 (Haixiu 7), 听霜 (Ting Shuang)

### Default reminder times

30 days and 7 days before the event starts; both can be changed in Settings.

### Data

- Source: <https://coserwiki.com/events> (public event pages with guest lists)
- Parsing reads the page’s embedded structured data first and only falls back to HTML cards, so markup changes do not break it outright
- Refreshed every 30 minutes in the background (retried after 5 minutes on failure), with a manual refresh button
- State and settings: `~/.dsh/coserwiki-reminder/`
- Routes: `GET /coserwiki/data`, `POST /coserwiki/refresh`, `POST /coserwiki/read`, `GET /coserwiki/reminders`, `POST /coserwiki/reminders/ack`, `GET|POST /coserwiki/settings`, `GET /coserwiki/calendar.ics`

### Install

```sh
dsh plugin --profile <profile> add dsh-coserwiki-reminder
```

### Notes

- Reminders are checked only while DSH is running; there are no OS notifications when it is closed.
- If coserwiki changes its markup, scraping may fail temporarily — the panel shows the error.
- Watched guests are matched by exact name; if the spelling differs on coserwiki, use the spelling shown there.

## License

MIT
