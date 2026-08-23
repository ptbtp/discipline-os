const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 8788;

const DATA_FILE = path.join(__dirname, "..", "data.json");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

let data = {
  blocks: [],
  tasks: [],
  alarms: [],
  scores: {
    focus: 0,
    quality: 0,
    discipline: 0
  },
  settings: {
    timezone: "UTC",
    name: "User"
  },
  history: [],
  stats: {
    changes: 0,
    created: new Date().toISOString()
  }
};


function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {}
  }
}


function save(action) {
  data.stats.changes++;

  data.history.push({
    id: Date.now(),
    action,
    time: new Date().toISOString()
  });

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2)
  );
}


function send(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(JSON.stringify(body));
}


function readBody(req, callback) {
  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      callback(JSON.parse(body));
    } catch {
      callback(null);
    }
  });
}


function serveFile(res, file) {
  fs.readFile(file, (err, content) => {
    if (err) {
      send(res, 404, { error: "not found" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(content);
  });
}


function api(req, res, url) {

  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, {
      ok: true,
      service: "Discipline OS",
      version: "1.0",
      changes: data.stats.changes
    });
    return true;
  }


  if (req.method === "GET" && url.pathname === "/api/state") {
    send(res, 200, data);
    return true;
  }


  if (req.method === "GET" && url.pathname === "/api/time") {
    send(res, 200, {
      utc: new Date().toISOString(),
      timestamp: Date.now()
    });
    return true;
  }


  if (req.method === "GET" && url.pathname === "/api/history") {
    send(res, 200, data.history);
    return true;
  }


  if (req.method === "POST" && url.pathname === "/api/block") {

    readBody(req, block => {

      if (!block) {
        send(res,400,{error:"bad json"});
        return;
      }

      block.id = Date.now();

      data.blocks.push(block);

      save("block_created");

      send(res,200,{
        ok:true,
        block
      });

    });

    return true;
  }


  if (req.method === "POST" && url.pathname === "/api/task") {

    readBody(req, task => {

      if (!task) {
        send(res,400,{error:"bad json"});
        return;
      }

      task.id = Date.now();
      task.done = false;

      data.tasks.push(task);

      save("task_created");

      send(res,200,{
        ok:true,
        task
      });

    });

    return true;
  }


  if (req.method === "POST" && url.pathname === "/api/task/done") {

    readBody(req, body => {

      const task = data.tasks.find(
        x => x.id === body.id
      );

      if (!task) {
        send(res,404,{error:"task not found"});
        return;
      }

      task.done = true;

      save("task_completed");

      send(res,200,task);

    });

    return true;
  }


  if (req.method === "POST" && url.pathname === "/api/score") {

    readBody(req, score => {

      if (!score) {
        send(res,400,{error:"bad json"});
        return;
      }

      data.scores.focus += score.focus || 0;
      data.scores.quality += score.quality || 0;
      data.scores.discipline += score.discipline || 0;

      save("score_changed");

      send(res,200,data.scores);

    });

    return true;
  }


  if (req.method === "POST" && url.pathname === "/api/alarm") {

    readBody(req, alarm => {

      if (!alarm) {
        send(res,400,{error:"bad json"});
        return;
      }

      alarm.id = Date.now();

      data.alarms.push(alarm);

      save("alarm_created");

      send(res,200,alarm);

    });

    return true;
  }


  if (req.method === "POST" && url.pathname === "/api/settings") {

    readBody(req, settings => {

      if (!settings) {
        send(res,400,{error:"bad json"});
        return;
      }

      data.settings = {
        ...data.settings,
        ...settings
      };

      save("settings_changed");

      send(res,200,data.settings);

    });

    return true;
  }


  if (req.method === "GET" && url.pathname === "/mcp") {

    send(res,200,{
      name:"Discipline OS MCP",
      status:"active",
      tools:[
        "blocks",
        "tasks",
        "scores",
        "alarms",
        "settings",
        "history",
        "time"
      ]
    });

    return true;
  }


  return false;
}


load();


const server = http.createServer((req,res)=>{

  const url = new URL(
    req.url,
    "http://localhost"
  );


  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }


  if (api(req,res,url)) {
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
      path.join(PUBLIC_DIR,"index.html")
    );

    return;
  }


  send(res,404,{
    error:"not found"
  });

});


server.listen(PORT,()=>{

  console.log(
    `Discipline OS running on port ${PORT}`
  );

});
