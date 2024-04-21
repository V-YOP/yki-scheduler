自用，一个简单的定时任务调度器，间隔 500ms 执行tasks目录下所有任务，用来（通过弹窗）提醒久坐，获取当前绘画时间，以及保存当前剪切板内容。

弹窗利用`node-notifier`，剪切板访问使用pywin32（因此无法跨平台）。

# usage

拉下来代码，然后移动到 `~/.yki_scheduler`。剪切板需要 `pip install pywin32`。执行 `npm i`，然后执行 `tsc`。

依赖处理完后，执行 `npm start`启动。