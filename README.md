# CoserWiki 漫展提醒

把 [coserwiki](https://coserwiki.com/events)（Coser 百科）的漫展活动接进 DSH：一屏看完所有场次、按城市筛选，关注你喜欢的 Coser 达人——他们参演的活动会自动标上「关注」，并在开始前 **1 个月** 和 **1 周** 各提醒你一次。

不用再每周翻活动页，也不会因为记错日期错过场次。

## 功能

- **一屏看完**：标题、日期、场馆、嘉宾名单、倒计时，全部列在同一块面板里。
- **筛选**：按城市筛，或切到「关注嘉宾」只看他们参演的场次；点卡片直接打开 coserwiki 活动页。
- **关注 Coser 达人**：任意添加名字，有他们参演的活动会标「关注」，并列出嘉宾与具体参演日期。
- **双节点提醒**：活动开始前 1 个月、1 周各弹一次窗，写明哪位嘉宾、哪天、在哪场。
- **不漏提醒**：关掉 DSH 期间错过的提醒，下次打开会补弹。
- **随时改**：关注名单在「设置 → 插件 → 漫展提醒」里修改，保存后立即生效。
- **数据留在本地**：状态和设置都在 `~/.dsh/coserwiki-reminder/`，不上传。

## 在哪看

- 左侧栏「漫展活动」图标
- 对话区顶部「漫展活动」标签
- 右侧栏「漫展活动」Tab

## 默认关注嘉宾

egg258、腥味猫罐、兔娘、害羞7、听霜

可以在设置里删改，也可以直接输入新名字。

## 数据

- 来源：<https://coserwiki.com/events>（公开活动页，含参演名单）
- 后台每 30 分钟抓一次；面板上有手动刷新
- 状态和设置：`~/.dsh/coserwiki-reminder/`
- 接口：`GET /coserwiki/data`、`POST /coserwiki/refresh`、`POST /coserwiki/read`、`GET /coserwiki/reminders`、`POST /coserwiki/reminders/ack`、`GET|POST /coserwiki/settings`

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

- **One panel, every event**: title, dates, venue, guest list and countdown, in a single list.
- **Filtering**: narrow down by city, or switch to “Watched” to see only events featuring your cosplayers. Clicking a card opens the event on coserwiki.
- **Follow any cosplayer**: events they appear at get a “Watched” badge, with guest names and appearance dates.
- **Two-stage reminders**: a popup one month ahead and another one week ahead, naming who appears when and where.
- **Nothing lost**: reminders missed while DSH was closed are replayed the next time you open it.
- **Editable watchlist**: change it in *Settings → Plugins → CoserWiki Reminder*; changes apply immediately.
- **Local by design**: state and settings live in `~/.dsh/coserwiki-reminder/` and are never uploaded.

### Where to find it

- The “Events” icon in the left sidebar
- The “Events” tab above the conversation
- The “Events” tab in the right sidebar

### Default watchlist

egg258, 腥味猫罐 (Xingwei Maoguan), 兔娘 (Tu Niang), 害羞7 (Haixiu 7), 听霜 (Ting Shuang)

### Data

- Source: <https://coserwiki.com/events> (public event pages with guest lists)
- Refreshed every 30 minutes in the background, with a manual refresh button
- State and settings: `~/.dsh/coserwiki-reminder/`
- Routes: `GET /coserwiki/data`, `POST /coserwiki/refresh`, `POST /coserwiki/read`, `GET /coserwiki/reminders`, `POST /coserwiki/reminders/ack`, `GET|POST /coserwiki/settings`

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
