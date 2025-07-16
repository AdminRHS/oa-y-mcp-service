# OA-Y MCP Service

A minimal Model Context Protocol (MCP) service for managing courses and lessons via HTTP API.

## Local Development

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/AdminRHS/oa-y-mcp-service.git
   cd oa-y-mcp-service
   npm install
   ```

2. Start the service with the required environment variables:
   ```bash
   export API_BASE_URL=https://lrn.oa-y.com/api-tokens
   export API_BASE_URL_PROFESSIONS=https://libdev.anyemp.com/api
   export API_TOKEN=your_token
   npm start
   ```
   For Windows, use `set` instead of `export`:
   ```cmd
   set API_BASE_URL=https://lrn.oa-y.com/api-tokens
   set API_BASE_URL_PROFESSIONS=https://libdev.anyemp.com/api
   set API_TOKEN=your_token
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
          "API_BASE_URL": "https://lrn.oa-y.com/api-tokens",
          "API_BASE_URL_PROFESSIONS": "https://libdev.anyemp.com/api",
          "API_TOKEN": "your_token"
       }
     }
   }
   ```

---

## Integration via npx from Public GitHub Repository

To use this service as an MSP directly from GitHub (including from AI/integrations):

```json
"mcpServers": {
  "oa-y-mcp-service": {
    "command": "npx",
    "args": ["github:AdminRHS/oa-y-mcp-service"],
    "env": {
      "API_BASE_URL": "https://lrn.oa-y.com/api-tokens",
      "API_BASE_URL_PROFESSIONS": "https://libdev.anyemp.com/api",
      "API_TOKEN": "your_token"
    }
  }
}
```

**Explanation:**
- `API_TOKEN` — token for access to the external API lrn.oa-y.com.
- `API_BASE_URL` and `API_BASE_URL_PROFESSIONS` — URLs of the external APIs.

---

## How to get your API_TOKEN

- Go to [https://lrn.oa-y.com](https://lrn.oa-y.com) and log in as an **admin**.
- Open the **Admin Panel** and go to the **API Tokens** tab.
- Click **Create Token**, enter a name, and click **Create Token**.
- Copy the generated token and set it as your `API_TOKEN` environment variable.

---

## Notes
- Do not store secrets or passwords in the repository.
- The API token must be provided via environment variable `API_TOKEN`. 