# CoserWiki 漫展提醒

把 [coserwiki](https://coserwiki.com/events)（Coser百科）的漫展活动接进 DSH：浏览全部活动、按城市筛选，并关注喜欢的 coser。

## 功能

- 在 DSH 里浏览全部漫展，按城市筛选，点卡片打开 coserwiki 活动页。
- 关注任意 coser：有他们参演的活动会标「关注」，并列出嘉宾名字和参演日期。
- 活动开始前 **1 个月** 和 **1 周** 各弹一次提醒；弹窗写明哪位嘉宾、哪天参演。
- 关掉 DSH 期间错过的提醒，下次打开会补弹。
- 关注名单在「设置 → 插件 → 漫展提醒」里修改，保存后立即生效。

## 在哪看

- 左侧栏「漫展活动」图标。
- 对话区顶部「漫展活动」标签。
- 右侧栏「漫展活动」Tab。

## 默认关注嘉宾

egg258、腥味猫罐、兔娘、害羞7、听霜

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
