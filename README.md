# UnoGame

UNO GAME前端。

## 安装

```
npm install
```

## 开发调试

```
npm run serve
```

客户端会监听`http://localhost:8080`，同时转发API请求到后端`http://localhost:8081`。

## 构建

```
npm run build
```

运行时需要执行`NODE_ENV=production`，此时后端被链接到`http://uno.example.com`。
