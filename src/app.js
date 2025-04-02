const express = require('express')

const session = require('express-session')
const compression = require('compression')

const bodyParser = require('body-parser')
const path = require('path')
const dotenv = require('dotenv')
const helmet = require('helmet')
const RateLimit = require('express-rate-limit')

const routes = require('./routes/routes.js').router

dotenv.config()

function bootstrap() {
  const app = express()
  const PORT = process.env.PORT

  app.use(express.json())
  app.use(helmet())
  app.use(compression())
  app.use(express.static(path.join(__dirname, 'public')))
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(
    session({
      secret: process.env.WPA_SECRET_KEY,
      resave: true,
      saveUninitialized: true
    })
  )
  app.use(
    RateLimit({
      windowMs: 1 * 60 * 1000,
      max: 20
    })
  )

  app.set('port', PORT)
  app.listen(PORT, () => {
    console.log(`> http://localhost:${PORT}`)
  })

  app.use('/', routes)
}

bootstrap()
