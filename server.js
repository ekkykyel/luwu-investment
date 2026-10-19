import mod from "./dist/server.cjs";

let app = mod;
while (typeof app !== "function" && app && app.default) app = app.default;
if (typeof app !== "function") app = mod.app;

export default app;
export { app };

