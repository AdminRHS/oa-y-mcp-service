# OA-Y MCP Service

A minimal Model Context Protocol (MCP) service for managing courses and lessons via HTTP API.

## Usage

1. Clone the repository and install dependencies:
   ```bash
   git clone <your_repo_url>
   cd oa-y-mcp-service
   npm install
   ```

2. Start the service with your API token:
   ```bash
   API_TOKEN=your_token node index.js
   ```

3. Example configuration for an MCP tool:
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

## Notes
- Do not store secrets or passwords in the repository.
- The API token must be provided via environment variable `API_TOKEN`. 