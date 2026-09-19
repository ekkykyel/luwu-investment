import serverModule from "../dist/server.cjs";

const app = (serverModule as any).default || serverModule;

export default function handler(req: any, res: any) {
  return app(req, res);
}
