// 这是“入口密码”的 SHA-256（小写 hex）。
// 更换密码：打开 /tools/hash.html 生成哈希，替换 PASSWORD_SHA256_HEX。
window.__SITE_CONFIG__ = {
  PASSWORD_SHA256_HEX:
    "eea581a6b3e3433c1dd77b8714c24431196ee67761312e56f5596e314b2ae621",

  /**
   * 登录保持策略（三选一，改完需提交到 GitHub 并强刷页面）：
   * - "every_visit" 默认：每次刷新或重新进入网站都要输入密码（不写本地存储，仅当前页内存）
   * - "session"       ：同一浏览器标签内免重复输入；关标签/关浏览器后通常需重登（sessionStorage）
   * - "remember7"     ：7 天内免密（localStorage）
   */
  AUTH_MODE: "every_visit",

  FILES_JSON_PATH: "./data/files.json",
};
