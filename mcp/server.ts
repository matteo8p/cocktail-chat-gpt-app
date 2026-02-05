import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { ConvexHttpClient } from "convex/browser";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = path.join(ROOT_DIR, "mcp", "dist");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).split("#")[0].trim();
    out[key] = value;
  }
  return out;
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function guessCocktailSlug(input?: string): string {
  if (!input?.trim()) return "negroni";
  const raw = input.trim().toLowerCase();
  if (raw.includes("negroni")) return "negroni";
  return toSlug(raw);
}

async function loadConvexClient(): Promise<ConvexHttpClient> {
  const envRaw = await fs.readFile(ENV_PATH, "utf8");
  const env = parseEnv(envRaw);
  const convexUrl = env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error(`Missing CONVEX_URL in ${ENV_PATH}`);
  }
  return new ConvexHttpClient(convexUrl);
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Cocktails MCP App",
    version: "1.0.0",
  });

  const resourceUri = "ui://cocktails/mcp-app.html";

  registerAppTool(
    server,
    "show_cocktail_recipe",
    {
      title: "Show Cocktail Recipe",
      description:
        "Fetch a cocktail recipe from Convex and render it in an interactive MCP App view.",
      inputSchema: {
        cocktail: z
          .string()
          .optional()
          .describe("Cocktail name or slug, for example 'negroni' or 'old fashioned'."),
      },
      outputSchema: z.object({
        requested: z.string(),
        resolvedSlug: z.string(),
        cocktail: z.unknown().nullable(),
      }),
      _meta: { ui: { resourceUri } },
    },
    async ({ cocktail }): Promise<CallToolResult> => {
      const requested = cocktail?.trim() || "negroni";
      const resolvedSlug = guessCocktailSlug(requested);
      const client = await loadConvexClient();

      const cocktailData = await client.query("cocktails:getCocktailBySlug", {
        slug: resolvedSlug,
      });

      if (!cocktailData) {
        return {
          content: [
            {
              type: "text",
              text: `I couldn't find "${requested}" in the cocktail database.`,
            },
          ],
          structuredContent: {
            requested,
            resolvedSlug,
            cocktail: null,
          },
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Showing recipe for ${cocktailData.name}.`,
          },
        ],
        structuredContent: {
          requested,
          resolvedSlug,
          cocktail: cocktailData,
        },
      };
    },
  );

  registerAppResource(
    server,
    "Cocktails Recipe UI",
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const candidatePaths = [
        path.join(DIST_DIR, "mcp-app.html"),
        path.join(DIST_DIR, "mcp", "mcp-app.html"),
      ];
      let html: string | null = null;
      for (const filePath of candidatePaths) {
        try {
          html = await fs.readFile(filePath, "utf-8");
          break;
        } catch {
          // Continue until a built file is found.
        }
      }
      if (!html) {
        throw new Error("MCP app bundle not found. Run `npm run mcp:build` first.");
      }
      return {
        contents: [
          {
            uri: resourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  resourceDomains: ["https://abundant-peacock-627.convex.cloud"],
                },
              },
            },
          },
        ],
      };
    },
  );

  return server;
}
