const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 8788;

const DATA_FILE = path.join(__dirname, "..", "data.json");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

let data = {
  tasks: [],
  classes: [],
  score: 0
};

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {}
}

function saveData() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2)
  );
}

function send(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(JSON.stringify(obj));
}

function serveFile(res, file) {
  fs.readFile(file, (err, content) => {
    if (err) {
      send(res, 404, {error:"not found"});
      return;
    }

    res.writeHead(200, {
      "Content-Type":"text/html; charset=utf-8"
    });

    res.end(content);
  });
  function handleAPI(req, res, url) {

  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, {
      ok: true,
      service: "Discipline OS",
      node: process.version
    });
    return true;
  }


  if (req.method === "GET" && url.pathname === "/api/state") {
    send(res, 200, data);
    return true;
  }


  if (req.method === "POST" && url.pathname === "/api/task") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {

      try {

        let task = JSON.parse(body);

        data.tasks.push({
          id: Date.now(),
          title: task.title || "Task",
          done: false
        });

        saveData();

        send(res, 200, {
          ok: true,
          tasks: data.tasks
        });

      } catch {

        send(res, 400, {
          error: "bad json"
        });

      }

    });

    return true;
  }


  return false;
}
  const server = http.createServer((req, res) => {

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }


  const url = new URL(
    req.url,
    "http://localhost"
  );


  if (handleAPI(req, res, url)) {
    return;
  }


  if (
    req.method === "GET" &&
    (url.pathname === "/" ||
     url.pathname === "/index.html")
  ) {

    serveFile(
      res,
      path.join(PUBLIC_DIR, "index.html")
    );

    return;
  }


  send(res, 404, {
    error: "Not found"
  });

});


server.listen(PORT, () => {

  console.log(
    "Discipline OS running on port " + PORT
  );

});
}
