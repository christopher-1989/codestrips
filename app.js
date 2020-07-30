const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const app = express()
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE ||'./db.sqlite')
module.exports = app

app.use(bodyParser.json())
app.use(morgan('short'))
app.use(express.static('public'))

const PORT = process.env.PORT || 4001

app.get('/strips', (req, res, next) => {
  db.all('select * from Strip', (err, rows) => {
    if (err) {
      res.status(500).send()
    } else {
      res.send( {strips: rows})
    }
  })
});

const validate = (req, res, next) => {
  const request = req.body.strip
  if (!request.head || !request.body || !request.background || !request.bubbleType) {
    return res.sendStatus(400) // bad request
  }
  next()
}

app.post('/strips', validate, (req, res, next) => {
  const request = req.body.strip
  db.run(
    'insert into Strip (head, body, background, bubble_type, bubble_text, caption) values ($head, $body, $backgound, $bubbleType, $bubbleText, $caption)', {
      $head: request.head, $body: request.body, $background: request.background, $bubbleType: request.bubbleType, $bubbleText: request.bubbleText, $caption: request.caption
      }, 
      function (err) {
    if (err) {
      return res.sendStatus(500) // internal server error
    }
  db.get(`select * from Strip where id = ${this.lastId}`, (err, row) => {
    if (!row) {
      return res.sendStatus(500) // internal server error
    } 
    res.status(201).send({ strip: row})
  })
  })})

app.listen(PORT);
