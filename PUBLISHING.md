# 发布到插件市场（Jianli233）

账号：<https://github.com/Jianli233>
目标仓库：<https://github.com/Jianli233/dsh-coserwiki-reminder>

> 整个流程可以在 GitHub 网页上完成，不需要安装 git 或 npm。

## 1. 建仓库并上传文件

1. 打开 <https://github.com/new>。
2. Repository name 填 `dsh-coserwiki-reminder`，选 **Public**，不要勾 README / .gitignore / license。
3. 点 **Create repository**。
4. 解压 `dsh-coserwiki-reminder-1.3.0.tgz`（或直接用本目录；`.tgz` 本身不用上传）。
5. 在空仓库页面点 **uploading an existing file**，把解压出来的这些文件和文件夹拖进去：
   `index.js`、`client.js`、`package.json`、`cordis.patch.yml`、`locale/`、`docs/`、`icon.svg`、`README.md`、`CHANGELOG.md`、`LICENSE`、`PUBLISHING.md`。
6. 点 **Commit changes**。

## 2. 提交到插件市场目录

1. 打开 <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>，点 **Fork**。
2. 在你的 fork 根目录点 **Add file → Create new file**。
3. 文件名填 `Jianli233__dsh-coserwiki-reminder.yml`。
4. 粘贴本目录 [awesome-dsh-plugin.yml](awesome-dsh-plugin.yml) 的内容。
5. 点 **Commit changes**。
6. 回到 fork 首页，点 **Contribute → Open pull request**。
7. 标题建议：`Add Jianli233/dsh-coserwiki-reminder`。
   内容写一句：`CoserWiki 漫展列表 + 关注嘉宾自定义时间点提醒；已在 dsh 0.2.3-alpha.2 验证。`
8. 提交 PR，等维护者合并。市场通常一天内自动收录。

## 3. 发布 npm（可选）

不发布 npm 也能被市场安装（目录条目会走 GitHub）。如果想发 npm：

```sh
npm login
npm publish --access public
```

包名 `dsh-coserwiki-reminder` 目前未被占用。

## 4. 本地/朋友安装

```sh
dsh plugin --profile <profile> add dsh-coserwiki-reminder
```

或直接把 `dsh-coserwiki-reminder-1.3.0.tgz` 发给对方，用 DSH 的本地插件安装入口安装。
