import "dotenv/config"
import connectDB from "./db/index.js"
import { app } from "./app.js"

connectDB()
.then(() => {
  const server = app.listen(process.env.PORT || 4000, () => { 
    console.log(`server is running at PORT = ${process.env.PORT}`)
  })

  server.on('error', (error) => {
    console.log('server startup error', error)
    process.exit(1)
  })
})