# 前端代码规范

规范来源：[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html) 和 [MDN 代码示例风格指南](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Code_style_guide)。本项目使用原生 HTML、CSS、JavaScript，并选取适合小型网页的规则。

## JavaScript

- 使用 UTF-8 编码、2 个空格缩进和分号。
- 优先使用 `const`；需要重新赋值时使用 `let`，不用 `var`。
- 函数和变量使用 `camelCase`；常量使用 `UPPER_SNAKE_CASE`；文件名使用小写字母。
- 让事件处理、API 请求、页面渲染各自职责清楚。异步请求使用 `async`/`await` 并处理网络异常。
- 不在浏览器中计算表达式最终结果；仅显示后端响应。
- 向页面写入用户表达式或错误文本时使用 `textContent`，不拼接不可信的 HTML。
- 不用 `eval` 或等价的动态执行方式。

## HTML 与 CSS

- 使用语义化元素、关联的表单标签和具有明确名称的按钮。
- 键盘可访问，焦点可见；动态结果和错误信息通过合适的状态区域向辅助技术通报。
- CSS 类名使用小写连字符；响应式布局在窄屏也可操作。
- 界面文字清晰一致，颜色不能是传达错误或状态的唯一方式。

## 验证

- 检查基本运算、复合表达式、键盘输入、历史记录与删除、网络错误和窄屏布局。
- 前端只保存 API 地址等界面配置，不把历史记录或计算结果当作本地持久数据。
