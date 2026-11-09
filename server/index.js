import 'dotenv/config'
import { createApp } from './app.js'
import { createRepository } from './repository.js'

const port = Number(process.env.PORT ?? 3001)
const repository = await createRepository()
const app = createApp(repository)

app.listen(port, () => {
  console.log(`FoodRush API escuchando en http://localhost:${port}`)
  console.log(`Persistencia activa: ${repository.backend}`)
})
