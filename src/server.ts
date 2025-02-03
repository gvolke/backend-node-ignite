import { app } from "./app"
import { env } from "./env"

const port = env.PORT || 3337
app
  .listen({ port: port, host: "0.0.0.0" })
  .then(() => console.log("HTTP server running"))
