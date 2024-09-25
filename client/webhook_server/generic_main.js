const http = require("http");
const port = 8000;

// POSTデータを解析するための関数
function collectRequestData(request, callback) {
  const FORM_URLENCODED = "application/x-www-form-urlencoded";
  const JSON_TYPE = "application/json";
  const contentType = request.headers["content-type"];

  if (
    request.method === "POST" &&
    (contentType === FORM_URLENCODED || contentType === JSON_TYPE)
  ) {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    request.on("end", () => {
      if (contentType === JSON_TYPE) {
        callback(JSON.parse(body));
      } else {
        // URLエンコードの場合の解析
        const data = new URLSearchParams(body);
        const json = {};
        for (const [key, value] of data.entries()) {
          json[key] = value;
        }
        callback(json);
      }
    });
  } else {
    callback(null);
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST") {
    collectRequestData(req, (data) => {
      if (data && data.data) {
        console.log(data.data);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`Received POST data: ${data.data}`);
      } else {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("Invalid POST data");
      }
    });
  } else {
    res.writeHead(405, { "Content-Type": "text/html" });
    res.end("Method Not Allowed");
  }
});

server.listen(port, () => {
  console.log(`Starting httpd server on port ${port}...`);
  console.log("press ctrl + c to stop");
});
