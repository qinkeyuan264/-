## 你将得到什么

这是一个可以部署到 **GitHub Pages** 的静态个人网站：

- **进入需要密码**（前端“入口加锁”）
- 以卡片形式展示你的文件（PDF/Word/Excel/PPT）
- 点击 **在线预览**（跳转 OneDrive 在线预览）
- 可选提供 **下载** 按钮
- 文件清单集中在 `data/files.json`，你只需要粘贴链接即可

> 注意：GitHub Pages 是静态站点，密码只是在浏览器前端校验，**不能当作“强安全”**。更强隐私要依赖 OneDrive 的分享权限（建议只对自己可访问）。

---

## 第 1 步：准备 OneDrive（推荐做法）

你的目标是：**文件平时留在电脑**，只有需要手机查看时才上传到 OneDrive。

- 在 Windows 上：可以只用 OneDrive 网页版上传，不必开自动同步。
- 在安卓上：装 OneDrive App，直接在线预览。

### 如何拿到“在线预览链接”

1. 把文件上传到 OneDrive
2. 在 OneDrive 里对该文件选择 **共享 / 复制链接**
3. 权限建议：
   - **仅你可访问**（优先）
   - 或者“特定人员可访问”（如果你将来要给某些人看）
4. 得到链接后，粘贴到 `data/files.json` 的 `previewUrl`

> 如果你复制到的链接打开后会直接下载，而不是预览：一般换成“可查看”权限或从网页版复制“查看链接”会更稳定。

---

## 第 2 步：填写你的文件列表（核心）

打开 `data/files.json`，把示例项改成你自己的。

字段说明：

- `title`：显示标题
- `type`：`pdf` / `word` / `excel` / `ppt` / `other`
- `tags`：可选标签数组
- `updatedAt`：可选日期字符串（例如 `2026-04-17`）
- `note`：可选备注
- `previewUrl`：**OneDrive 在线预览链接（必填）**
- `downloadUrl`：可选下载链接（不想提供下载就留空字符串）

---

## 第 3 步：更换网站密码（强烈建议）

默认密码是 `changeme123`。

1. 打开 `tools/hash.html`
2. 输入你的新密码，点“生成 SHA-256”
3. 复制生成出来的哈希
4. 打开 `assets/config.js`，替换：
   - `PASSWORD_SHA256_HEX: "..."` 里的内容
5. 提交到 GitHub 后，Pages 会自动更新

---

## 第 4 步：部署到 GitHub Pages（最小步骤）

### 方式 A：用 GitHub 网页上传（最适合小白）

1. 注册/登录 GitHub
2. 新建一个仓库（Repository），例如 `my-files-site`
3. 把本文件夹里的所有内容上传到仓库根目录（root）
4. 打开仓库 **Settings → Pages**
5. 在 **Build and deployment**：
   - Source 选 `Deploy from a branch`
   - Branch 选 `main`，Folder 选 `/ (root)`
6. 等待 1-2 分钟，GitHub 会给你一个 Pages 地址

### 方式 B：用 Git 提交（你熟悉的话）

把这些文件 commit 到一个仓库，然后在 Pages 里选择 `main / root` 即可。

---

## 常见问题

### 1）为什么说“密码不是强安全”？

因为静态站点没有后端，密码校验代码和哈希都在浏览器里，懂技术的人可以绕过。它适合：

- 防止你把链接随手转发后被别人直接看到内容
- 防止自己误点打开

