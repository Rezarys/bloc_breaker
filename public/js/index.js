/* global io: true */
var $ = window.$
var size = 2

$(document).ready(function () {
  var socket = io()

  var step = 50
  var myObj = { R: [size * size], G: [size * size], B: [size * size], power: [size * size], complete: false, cellsNum: size * size }
  // var myObj = { R: [], G: [], B: [], power: [], complete: false, cellsNum: size * size }

  socket.on('click', function (obj) {
    if (obj) {
      myObj = obj
      $('table').remove()
      creategrid(myObj, false)
    } else {
      creategrid(myObj, true)
    }

    $('table td').click(function () {
      var columnNum = parseInt($(this).index())
      var rowNum = parseInt($(this).parent().index())
      var index1D = rowNum * size + columnNum

      $('#result').html('x = ' + rowNum + ', y = ' + columnNum)

      if (myObj.power[index1D] > 0) {
        $(this).css('background-color', 'rgb(' +
          (myObj.R[index1D] += step) + ',' +
          (myObj.G[index1D] += step) + ',' +
          (myObj.B[index1D] += step) + ')')
        myObj.power[index1D]--
      }
      console.log('Is complete ?', myObj.complete)
      if (myObj.complete === true) {
        myObj.power = new Array(size * size).fill(4)

        for (let i = 0; i < size * size; i++) {
          myObj.R[i] = 0
          myObj.G[i] = 0
          myObj.B[i] = 0
        }
      }
      socket.emit('click', myObj)
    })
  })

  socket.on('setuserslist', function (data) {
    console.log(data.scr)
    // data.scr = moveFirst(data.scr, data.users.indexOf($('#unm').text()))
    // data.users = moveFirst(data.users, $('#unm').text())
    createUsersList(data.users, data.scr)
  })
})

function creategrid (myObj, init) {
  var tr
  var td
  var table = document.createElement('table')

  for (let i = 0; i < size; i++) {
    tr = document.createElement('tr')
    for (let j = 0; j < size; j++) {
      td = document.createElement('td')
      if (init) {
        myObj.R[i * size + j] = 0
        myObj.G[i * size + j] = 0
        myObj.B[i * size + j] = 0
        myObj.power[i * size + j] = 4
      }
      td.style.cssText = 'background-color: rgb(' + myObj.R[i * size + j] + ',' + myObj.G[i * size + j] + ',' + myObj.B[i * size + j] + ')'
      tr.appendChild(td)
    }
    table.appendChild(tr)
  }
  document.getElementById('container').appendChild(table)
}

function createUsersList (users, scores) {
  $('ul').remove()
  var ul = document.createElement('ul')
  var li
  var unm

  for (let i = 0; i < users.length; i++) {
    if (users[i]) {
      li = document.createElement('li')
      unm = users[i] + ' ' + scores[i]
      if (users[i] === $('#unm').text()) {
        unm += ' (You)'
      }
      li.innerHTML = unm
      ul.appendChild(li)
    }
  }
  document.getElementById('usersco').appendChild(ul)
}

// function moveFirst (array, elem) {
//   if (isNaN(elem)) {
//     array.splice(array.indexOf(elem), 1)
//     array.unshift(elem)
//   } else {
//     var tmp = array[elem]
//     array.splice(elem, 1)
//     array.unshift(tmp)
//   }
//   return array
// }
