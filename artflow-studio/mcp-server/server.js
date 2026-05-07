import express from "express";

const app = express();
app.use(express.json());

// MAIN MCP ROUTER
app.post("/mcp", async (req, res) => {
    const { prompt } = req.body;

    let agent = "coder"; // default

    // 🔥 Routing Logic
    if (prompt.includes("UI") || prompt.includes("design")) {
        agent = "ui";
    } else if (prompt.includes("error") || prompt.includes("bug")) {
        agent = "debug";
    } else if (prompt.includes("deploy")) {
        agent = "devops";
    }

    res.json({
        agent,
        message: `Task routed to ${agent} agent`,
    });
});

app.listen(5001, () => {
    console.log("🔥 MCP Server running on http://localhost:5001");
}); clearImmediate