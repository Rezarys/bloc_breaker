'use strict'

var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var path = require('path')
var bodyParser = require('body-parser')
var fs = require('fs')
var session = require('express-session')({
  secret: 'ssshhhhh',
  resave: true,
  saveUninitialized: true
})
var PORT = process.env.PORT || 3000

var globObj
var usersco = []
var scores = []
var userToDc = null

app.use(session)
var socketmiddleware = function (socket, next) {
  session(socket.handshake, {}, next)
}
io.use(socketmiddleware)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'public/views'))
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')

app.use((err, req, res, next) => {
  return console.log(err)
})

app.get('/', function (req, res) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')

  if (req.session.username) {
    res.render('main_page.html', { foo: req.session.username })
  } else {
    res.render('index.html', { foo: '', bar: '' })
  }
})

app.all('/logister', function (req, res) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')

  var users = require('./db/users.json')
  var uExists = false
  var pExists = false

  for (var i = 0; i < users.length; i++) {
    if (users[i].unm === req.body.unm) {
      uExists = true
      if (users[i].pwd === req.body.pwd && uExists) {
        pExists = true
        break
      }
    }
  }
  if (pExists) {
    req.session.username = req.body.unm
    console.log('score user[i]', users[i].score)
    scores[i] = req.session.score = users[i].score
    req.session.idu = i

    res.redirect('/')
  } else if (uExists) {
    res.status(200).render('index.html', { foo: 'Wrong password', bar: '' })
  } else {
    users.push({ unm: req.body.unm, pwd: req.body.pwd, score: 0 })

    fs.writeFile('./db/users.json', JSON.stringify(users, null, 2), function (err) {
      if (err) {
        return console.log(err)
      } else {
        res.status(200).render('index.html', { bar: 'Account created!', foo: '' })
      }
    })
  }
})

app.get('/logout', function (req, res) {
  console.log('---logging out---')
  var users = require('./db/users.json')
  users[req.session.idu].score = req.session.score

  console.log('>saving score...')
  fs.writeFile('./db/users.json', JSON.stringify(users, null, 2), function (err) {
    if (err) {
      return console.log(err)
    } else {
      console.log('>destroying session...')
      userToDc = req.session.idu
      req.session.destroy(function (err) {
        if (err) {
          console.log(err)
        } else {
          res.redirect('/')
        }
      })
    }
  })
})

io.on('connection', function (socket) {
  console.log('---just connected---')

  console.log('>updating grid...')
  socket.emit('click', globObj)

  console.log('>is new user ?')
  if (socket.handshake.session.username && !usersco.includes(socket.handshake.session.username)) {
    console.log('   >yes, notifying other players')
    usersco[socket.handshake.session.idu] = socket.handshake.session.username
  }
  io.emit('setuserslist', { users: usersco, scr: scores })

  socket.on('click', function (obj) {
    globObj = obj
    globObj.complete = isComplete(globObj)
    socket.handshake.session.score++
    scores[socket.handshake.session.idu] = socket.handshake.session.score
    socket.handshake.session.save()

    io.emit('setuserslist', { users: usersco, scr: scores })
    io.emit('click', globObj)
  })

  socket.on('disconnect', function () {
    console.log('---user disconnected---')
    console.log('>refresh or dc ?')
    if (userToDc) {
      console.log('   >dc, dcing...')
      usersco.splice(userToDc, 1)
      scores.splice(userToDc, 1)
      userToDc = null
      console.log('>updating users list')
      socket.broadcast.emit('setuserslist', { users: usersco, scr: scores })
    } else {
      console.log('   >no, just refresh')
    }
  })
})

function isComplete (obj) {
  var sum = 0
  for (let i = 0; i < obj.cellsNum; i++) {
    sum += obj.power[i]
  }

  if (sum === 1) {
    return true
  } else {
    return false
  }
}

http.listen(PORT, function () {
  console.log('Server listenning on port ' + PORT)
})
