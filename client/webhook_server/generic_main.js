const http = require("http");
const { bold, green, reset } = {
  bold: "\x1b[1m",
  green: "\x1b[32m",
  reset: "\x1b[0m",
};

// HTTPリクエストハンドラ
const requestHandler = (req, res) => {
  if (req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);
      console.log(data["data"]);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`Received POST data: ${data["data"]}`);
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("Not Found");
  }
};

// サーバ設定
const server = http.createServer(requestHandler);

// サーバ実行関数
const run = (port = 8000) => {
  server.listen(port, () => {
    console.log(`Starting httpd server on port ${port}...`);
    console.log(
      `${bold}${green}Webhook url is http://localhost:${port} ${reset}`
    );
    console.log(`${bold}${green}Please press Ctrl+C to stop.${reset}`);
  });

  // サーバ終了時の処理
  process.on("SIGINT", () => {
    console.log(`${bold}${green}Shutting down the server...${reset}`);
    server.close(() => {
      console.log(`${bold}${green}Server shut down successfully.${reset}`);
      process.exit(0);
    });
  });
};

if (require.main === module) {
  run();
}
