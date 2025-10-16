// Root exports: a ready-to-use UI component + convenience re-exports
export { DevtoolsCard as DevTools } from "./ui/card.js"; // named export { DevTools }
export { DevtoolsCard } from "./ui/card.js";             // alternative name
export * as Route from "./adapters/next/catchall-route.js"; // { GET, POST }
export { default as theme } from "./theme.css" assert { type: "css" }; // optional
export default {};
