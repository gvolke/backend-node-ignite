import { app } from "./app"
import { env } from "./env"

const port = env.PORT || 3337
app.listen({ port: port }).then(() => console.log("HTTP server running"))
