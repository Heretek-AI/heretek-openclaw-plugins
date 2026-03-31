#!/usr/bin/env node
/**
 * OpenClaw MCP Server
 * Model Context Protocol server for Heretek OpenClaw skills and memory exposure
 * 
 * This server exposes:
 * - Resources: Agent memories, knowledge base, skill definitions
 * - Tools: Skill execution endpoints
 * - Prompts: Common agent interaction templates
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import resource handlers
import { MemoryResourceHandler } from './handlers/memory-resources.js';
import { KnowledgeResourceHandler } from './handlers/knowledge-resources.js';
import { SkillResourceHandler } from './handlers/skill-resources.js';

// Import tool handlers
import { SkillToolHandler } from './handlers/skill-tools.js';

// Import prompt handlers
import { PromptHandler } from './handlers/prompts.js';

class OpenClawMCPServer {
  constructor(config = {}) {
    this.config = {
      name: 'openclaw-mcp-server',
      version: '1.0.0',
      skillsPath: config.skillsPath || './skills',
      memoryPath: config.memoryPath || './memory',
      knowledgePath: config.knowledgePath || './knowledge',
      ...config
    };

    // Initialize handlers
    this.memoryHandler = new MemoryResourceHandler(this.config.memoryPath);
    this.knowledgeHandler = new KnowledgeResourceHandler(this.config.knowledgePath);
    this.skillHandler = new SkillResourceHandler(this.config.skillsPath);
    this.toolHandler = new SkillToolHandler(this.config.skillsPath);
    this.promptHandler = new PromptHandler();

    // Create MCP server instance
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.initialized = false;
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.toolHandler.listTools();
      const memoryTools = await this.memoryHandler.getTools();
      const knowledgeTools = await this.knowledgeHandler.getTools();
      
      return {
        tools: [...tools, ...memoryTools, ...knowledgeTools]
      };
    });

    // Call a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Try skill tools first
        let result = await this.toolHandler.callTool(name, args);
        
        // Try memory tools
        if (!result) {
          result = await this.memoryHandler.callTool(name, args);
        }

        // Try knowledge tools
        if (!result) {
          result = await this.knowledgeHandler.callTool(name, args);
        }

        if (!result) {
          throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const memoryResources = await this.memoryHandler.listResources();
      const knowledgeResources = await this.knowledgeHandler.listResources();
      const skillResources = await this.skillHandler.listResources();

      return {
        resources: [...memoryResources, ...knowledgeResources, ...skillResources]
      };
    });

    // Read a specific resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        if (uri.startsWith('memory://')) {
          const content = await this.memoryHandler.readResource(uri);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(content, null, 2),
              },
            ],
          };
        }

        if (uri.startsWith('knowledge://')) {
          const content = await this.knowledgeHandler.readResource(uri);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(content, null, 2),
              },
            ],
          };
        }

        if (uri.startsWith('skill://')) {
          const content = await this.skillHandler.readResource(uri);
          return {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: content,
              },
            ],
          };
        }

        throw new Error(`Unknown resource URI: ${uri}`);
      } catch (error) {
        throw new Error(`Error reading resource ${uri}: ${error.message}`);
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = await this.promptHandler.listPrompts();
      return { prompts };
    });

    // Get a specific prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const prompt = await this.promptHandler.getPrompt(name, args);
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: prompt,
              },
            },
          ],
        };
      } catch (error) {
        throw new Error(`Error getting prompt ${name}: ${error.message}`);
      }
    });
  }

  async connect() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.initialized = true;
    console.error('[OpenClaw MCP Server] Connected to MCP client via stdio transport');
  }

  async close() {
    await this.server.close();
    this.initialized = false;
    console.error('[OpenClaw MCP Server] Server closed');
  }
}

// Main entry point
async function main() {
  const server = new OpenClawMCPServer({
    skillsPath: process.env.OPENCLAW_SKILLS_PATH || './skills',
    memoryPath: process.env.OPENCLAW_MEMORY_PATH || './memory',
    knowledgePath: process.env.OPENCLAW_KNOWLEDGE_PATH || './knowledge',
  });

  try {
    await server.connect();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { OpenClawMCPServer };
