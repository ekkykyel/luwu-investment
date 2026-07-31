// Vercel Serverless Entrypoint
export const maxDuration = 60;
import appServer from './server.cjs';

// Resolve the actual Express app whether it's imported directly or nested under default due to CJS bundling
const handler = (appServer as any).default || appServer;

export default handler;
