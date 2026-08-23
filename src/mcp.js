const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");

const mcp = new McpServer({
  name: "Discipline OS",
  version: "1.0.0"
});

let data = {
  blocks: [],
  tasks: [],
  alarms: [],
  scores: {
    daily: 0,
    quality: 0,
    discipline: 0
  }
};

mcp.tool(
  "get_status",
  "Get Discipline OS status",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

module.exports = mcp;
