const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const mcp = require("./mcp");

const PORT = process.env.PORT || 8788;

const DATA_FILE = path.join(__dirname, "..", "data.json");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

let data = {
  blocks: [],
  tasks: [],
  alarms: [],
  scores: {
    daily: 0,
    quality: 0,
    discipline: 0
  },
  settings: {
    timezone: "UTC",
    name: "User"
  }
};

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
      send(res, 404, {
        error: "not found"
      });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(content);

  });

}



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



  if (req.method === "GET" && url.pathname === "/mcp") {

    send(res, 200, {
      name: "Discipline OS MCP",
      status: "active",
      version: "1.0.0"
    });

    return true;
  }



  return false;

}



const server = http.createServer((req, res) => {


  const url = new URL(
    req.url,
    "http://localhost"
  );


  if (handleAPI(req, res, url)) {
    return;
  }



  if (
    req.method === "GET" &&
    (
      url.pathname === "/" ||
      url.pathname === "/index.html"
    )
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
