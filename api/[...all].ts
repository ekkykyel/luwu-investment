import serverModule from "../dist/server.cjs";

// Catch-all serverless function handler for Vercel
const app = (serverModule as any).default || serverModule;

export default function handler(req: any, res: any) {
  return app(req, res);
}
