# 832402105 计算器前端

这是独立的静态 Web 客户端，负责输入表达式、显示后端返回的结果、读取历史和发送指定记录的删除请求。计算逻辑与历史数据库都在单独的后端项目中。

## 技术与运行环境

- 原生 HTML、CSS、JavaScript；无需 npm 安装或打包。
- 现代 Chrome、Edge、Firefox 或 Safari 浏览器。
- 本地启动示例使用 Python 3.10 或更新版本的静态文件服务器；也可用任意静态网站服务器。

## 安装与启动

先按后端仓库的 README 启动 API，默认地址为 `http://127.0.0.1:8000`。然后在本项目根目录执行：

```sh
python -m http.server 5173 --directory src
```

浏览器访问 `http://127.0.0.1:5173`。前端加载时会调用 `GET /api/history`；页面显示“Backend connected”表示 API 可访问。启动时不需安装依赖，也没有前端数据库初始化步骤。

## 前后端连接与配置

`src/config.js` 中的 `CALCULATOR_API_BASE_URL` 是本地开发默认 API 地址。GitHub Pages 发布时由 Actions 仓库变量生成线上配置，无需把 Render 域名写入源文件。用户也可在页面右上角的“API settings”修改地址，保存后立即重新查询历史。

接口地址和浅色／深色主题偏好会保存在浏览器 `localStorage`，仅用于记住界面设置。首次打开时，主题默认跟随操作系统。**计算结果和历史记录不存于浏览器**：结果来自 `POST /api/calculate` 响应，历史每次从 `GET /api/history` 获取，删除通过 `DELETE /api/history/{id}` 完成后重新查询。前端优先显示后端提供的精确 `result_text`，避免 JavaScript 数字舍入长小数或大整数。后端停止时，前端仍可输入，但无法取得新结果。

如将前端与后端部署在不同域名，后端的 `CALCULATOR_ALLOWED_ORIGINS` 需包含前端的完整源地址（协议、域名、端口）。公开网站使用 HTTPS 时，后端也应通过 HTTPS 暴露，以免浏览器阻止混合内容请求。

## GitHub Pages 部署

本仓库的 `.github/workflows/deploy-pages.yml` 在 `main` 分支更新或手动触发时，将 `src/` 复制为发布文件，并把线上 API 地址写入发布产物 `config.js`。原始 `src/config.js` 保持本地默认地址 `http://127.0.0.1:8000`。页面中的 CSS、JavaScript 均使用 `./` 相对路径，可在 GitHub Pages 的仓库子路径下加载。

1. 先部署后端并取得公开 HTTPS **源地址**，例如 `https://your-service.onrender.com`。用浏览器访问该地址的 `/api/health`，确认服务可访问。地址中不要加 `/api`、其他路径或查询参数；建议不加末尾斜杠。
2. 打开前端 GitHub 仓库 `Settings → Secrets and variables → Actions → Variables → New repository variable`，新增名称 `CALCULATOR_API_BASE_URL`，值填上述后端源地址。这是公开 API 地址，不是数据库密码；不要把数据库连接串放进前端变量。
3. 打开 `Settings → Pages → Build and deployment`，将 `Source` 设为 **GitHub Actions**。
4. 推送包含 workflow 的提交到 `main`；也可以在 `Actions → Deploy frontend to GitHub Pages → Run workflow` 手动触发。若首次运行时还未设置第 2 步的变量，构建会明确报错；设置后重新手动运行即可。
5. 在 Actions 页面确认部署成功，访问 `https://abet64287-crypto.github.io/832402105_calculator_frontend/`，计算一个表达式并核对历史记录。

Render 后端的 `CALCULATOR_ALLOWED_ORIGINS` 应设为 **`https://abet64287-crypto.github.io`**。这是浏览器请求的 Origin，**不包含** `/832402105_calculator_frontend/` 仓库路径，也不要加末尾斜杠。前端网页完整地址则包含上述仓库路径。若浏览器以前保存过本地 API 地址，`localStorage` 会覆盖线上默认配置；在页面的 **API settings** 中改成 Render HTTPS 地址并保存。

## 功能与操作

- 输入框可直接输入 `1+2*3`、`(1+2)*3`、`-5+8`、`3*-2`、`0.1+0.2` 等表达式，也能使用屏幕按键。乘除按键显示为 `×`、`÷`，请求时转为 `*`、`/`。
- 按 `Enter` 请求后端计算；`Backspace` 删除光标前字符，`Esc` 清空表达式；`±` 切换光标前数字的正负号。
- 计算成功后显示后端结果并刷新历史。点击 **Reuse** 把记录表达式放回输入框，点击 **Delete** 通过 API 删除指定记录并刷新列表。
- 无效表达式、除零、超时和后端断线会显示对应错误信息。
- 展开 **Scientific** 可使用 `sin`、`cos`、`tan`、`sqrt`、`ln`、`log`、`abs`、幂、平方、`pi`、`e` 和括号按钮；三角函数参数为**弧度**，`log` 以 10 为底。函数按钮会插入函数名与括号；按钮只编辑表达式，按 `=` 后仍由后端计算。函数参数错误由后端提示，失败计算不进入历史。
- 页眉 **Dark theme／Light theme** 按钮切换整页配色；刷新后保留用户选择。切换主题不影响后端历史数据。

## 目录

- `src/index.html`：页面结构与可访问名称。
- `src/styles.css`：响应式布局与交互状态。
- `src/config.js`：默认 API 地址。
- `src/app.js`：按钮/键盘事件、`fetch` 请求、结果与历史渲染。
- `codestyle.md`：本项目的代码规范及来源。

## 本地验收

1. 打开页面，计算 `12+8`，确认结果为 `20` 且历史增加一条。
2. 分别计算 `1+2*3`、`(1+2)*3`、`3*-2`、`0.1+0.2`，核对结果和历史。
3. 输入 `1/0` 和 `1+`，确认有后端错误提示，历史数量不增加。
4. 刷新浏览器，确认历史仍在；删除一条后再刷新，确认它已消失。
5. 停止后端并再次计算，确认页面提示无法连接且不生成新结果。
6. 展开 **Scientific**，按按钮输入 `sqrt(81)`、`sin(pi/2)`、`2^3^2` 并计算，核对结果为 `9`、`1`、`512`；刷新页面，确认成功记录由后端恢复。输入 `sqrt(-1)`，确认显示参数错误且历史不增加。
7. 点击 **Dark theme**，核对输入、按键、结果、历史和错误提示可读；刷新后应维持深色，再点击 **Light theme** 切回浅色。

前端项目可独立放入名为 `832402105_calculator_frontend` 的 GitHub 仓库；后端项目应放入另一个独立仓库。
