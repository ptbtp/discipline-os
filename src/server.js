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
    daily: 0,
    quality: 0,
    discipline: 0
  },
  settings: {
    name: "User",
    timezone: "UTC"
  },
  history: [],
  stats: {
    changes: 0
  }
};


function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      data = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );
    } catch (error) {
      console.log("Data load failed");
    }
  }
}


function saveData(action) {

  data.stats.changes++;

  data.history.push({
    id: Date.now(),
    action: action,
    time: new Date().toISOString()
  });

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

  res.end(
    JSON.stringify(obj)
  );

}


function serveFile(res, file) {

  fs.readFile(file, (error, content) => {

    if (error) {
      send(res,404,{
        error:"file not found"
      });
      return;
    }

    res.writeHead(200,{
      "Content-Type":"text/html; charset=utf-8"
    });

    res.end(content);

  });

  function handleAPI(req, res, url) {


  if (req.method === "GET" && url.pathname === "/health") {

    send(res, 200, {
      ok: true,
      service: "Discipline OS",
      version: "1.0.0",
      changes: data.stats.changes
    });

    return true;
  }



  if (req.method === "GET" && url.pathname === "/api/state") {

    send(res, 200, data);

    return true;
  }




  if (req.method === "GET" && url.pathname === "/api/history") {

    send(res, 200, data.history);

    return true;
  }





  if (req.method === "POST" && url.pathname === "/api/block") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });


    req.on("end", () => {

      try {

        const block = JSON.parse(body);

        block.id = Date.now();

        data.blocks.push(block);

        saveData("create_block");


        send(res,200,{
          ok:true,
          block:block
        });


      } catch {

        send(res,400,{
          error:"invalid json"
        });

      }

    });


    return true;
  }





  if (req.method === "POST" && url.pathname === "/api/score") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });


    req.on("end", () => {

      try {

        const score = JSON.parse(body);


        data.scores.daily += score.daily || 0;

        data.scores.quality += score.quality || 0;

        data.scores.discipline += score.discipline || 0;


        saveData("score_update");


        send(res,200,{
          ok:true,
          scores:data.scores
        });


      } catch {

        send(res,400,{
          error:"invalid json"
        });

      }

    });


    return true;
  }
      if (req.method === "POST" && url.pathname === "/api/alarm") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });


    req.on("end", () => {

      try {

        const alarm = JSON.parse(body);

        alarm.id = Date.now();

        data.alarms.push(alarm);

        saveData("create_alarm");


        send(res,200,{
          ok:true,
          alarm:alarm
        });


      } catch {

        send(res,400,{
          error:"invalid json"
        });

      }

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
        "history"
      ]
    });

    return true;
  }



  return false;

}





loadData();




const server = http.createServer((req,res)=>{


  const url = new URL(
    req.url,
    "http://localhost"
  );


  if (handleAPI(req,res,url)) {
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
    error:"Not found"
  });


});





server.listen(PORT,()=>{

  console.log(
    `Discipline OS running on port ${PORT}`
  );

});
}
