# OA-Y MCP Service

A minimal Model Context Protocol (MCP) service for managing courses and lessons via HTTP API.

## Local Development

1. Clone the repository and install dependencies:
   ```bash
   git clone <your_repo_url>
   cd oa-y-mcp-service
   npm install
   ```

2. Start the service with the required environment variables:
   ```bash
   export API_TOKEN=your_token
   export API_BASE_URL=https://lrn.oa-y.com/api-tokens
   export API_BASE_URL_PROFESSIONS=https://libdev.anyemp.com/api
   npm start
   ```
   For Windows, use `set` instead of `export`:
   ```cmd
   set API_TOKEN=your_token
   set API_BASE_URL=https://lrn.oa-y.com/api-tokens
   set API_BASE_URL_PROFESSIONS=https://libdev.anyemp.com/api
   npm start
   ```

3. Example request to the local server:
   ```bash
   curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"protocol":"MCP","action":"read","model":"Course"}'
   ```

4. Example configuration for local MCP integration:
   ```json
   "mcpServers": {
     "oa-y-mcp-service": {
       "command": "node",
       "args": ["C:\\Projects\\RH\\oa-y-mcp-service\\index.js"],
       "env": {
         "API_TOKEN": "your_token"
       }
     }
   }
   ```

---

## Integration via npx from Private GitHub Repository

To use this service as an MSP directly from GitHub (including from AI/integrations):

```json
"mcpServers": {
  "oa-y-mcp-service": {
    "command": "npx",
    "args": ["github:LiliiaDanylenko/oa-y-mcp-service"],
    "env": {
      "API_BASE_URL": "",
      "API_BASE_URL_PROFESSIONS": "",
      "GITHUB_TOKEN": "",
      "API_TOKEN": ""
    }
  }
}
```

**Explanation:**
- `GITHUB_TOKEN` — your GitHub Personal Access Token with `repo` scope (for access to the private repository).
- `API_TOKEN` — token for access to the external API lrn.oa-y.com.
- `API_BASE_URL` and `API_BASE_URL_PROFESSIONS` — URLs of the external APIs.
- Do not publish your tokens in public repositories!

---

## Notes
- Do not store secrets or passwords in the repository.
- The API token must be provided via environment variable `API_TOKEN`. 