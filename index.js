var numerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII']
var icons = {
  death: '🕱',
  shamrock: '☘',
  attack: '⚔',
  defense: '⛨'
}

var ctx = document.getElementById('ctx')
var timer = document.getElementById('timer')
var hands = document.getElementById('hands')

function add(element) {
  ctx.appendChild(element)
}

// Number of shamrocks that Player will have from the beginning
var SHAMROCKS_ON_START = 1
// If enabled then CPU and player are immortal
var IMMORTALS = true
// If enabled then the deck have only shamrocks and deaths
var SHAMROCK_AND_DEATH_TEST = false

var TIMER_DURATION = 0.5 // seconds
var SHOW_CARD_DURATION = 1
var MOVE_CARD_DURATION = 0.6

// Timer
var timerDuration = 0.5 // seconds

// Who's turn to pick a card
// This is not related with action (attack) because it has own timer (AT)
var turn = 0 // 0 = Player, 1 = CPU
var activeTime = false

var playerNmae = 'Isoldee'
var playerLv = 2

var playerMaxHP = 50
var playerHP = playerMaxHP // player health points

var playerMaxAT = 10
var playerAT = 0 // Player action timer

var cpuName = 'Shagaar'
var cpuLv = 5

var cpuMaxHP = 50
var cpuHP = cpuMaxHP // CPU health points

var cpuMaxAT = 12
var cpuAT = 0 // CPU action timer

// Cards to pick from
var cardsInDeck = 7
var attackDeck = [] // Stack of attack cards
var defenseDeck = [] // Stack of defense cards

// Cards picked by Player
var playerAttackHand = []
var playerLuckyHand = []
var playerDefenseHand = []

// Cards picked by CPU
var cpuAttackHand = []
var cpuLuckyHand = []
var cpuDefenseHand = []

window.onresize = resizeWindow;
resizeWindow()

function resizeWindow() {
  var wh = window.innerHeight
  var ch = ctx.offsetHeight
  var ww = window.innerWidth;
  var cw = ctx.offsetWidth

  var s = Math.floor(wh / ch * 100)
  var x = (wh - ch) / 2
  var y = (ww - cw) / 2

  ctx.style.transform = `scale(${s}%)`
  ctx.style.top = `${x}px`
  ctx.style.left = `${y}px`
}

/* START GAME */
resetGame()

function resetGame() {
  removeAllCards()
  attackDeck = []
  defenseDeck = []
  playerAttackHand = []
  playerLuckyHand = []
  playerDefenseHand = []
  cpuAttackHand = []
  cpuLuckyHand = []
  cpuDefenseHand = []

  turn = 0

  addShamrocks(SHAMROCKS_ON_START)

  addDecksIfEmpty()
  resetTimer()
}

function removeAllCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.remove()
  })
}

function resetTimer() {
  activeTime = false
  
  var anim = document.createElementNS('http://www.w3.org/2000/svg','animate')
  anim.setAttribute("attributeName", "stroke-dashoffset")
  anim.setAttribute("from", 360)
  anim.setAttribute("to", 0);
  anim.setAttribute("dur", `${TIMER_DURATION}s`)
  anim.setAttribute("fill", "forwards")
  anim.onend = onTimer
  timer.appendChild(anim)
  anim.beginElement()
}

function onTimer() {
  if(turn == 1) {
    activeTime = false
    CPU()
  }
  else {
    activeTime = true
    toggleHands()
  }
}

function CPU() {
  cpuPickCard()
}

function changeTurn() {
  turn = (turn + 1) % 2
}

function toggleHands() {
  hands.style.display = turn == 0 && activeTime == true ? 'block' : 'none'
}

function addShamrocks(quantity) {
  for (var i = 0; i < quantity; i++) {
    var c = newCard('defense', 12, 'front')
    var l = playerLuckyHand.length
    var dir = l % 2 == 0 ? -1 : 1
    var x = 297 + 15 * dir
    var y = 810 - 15 * l

    c.style.transform = `translate(${x}px, ${y}px)`
    playerLuckyHand.push(c)
    add(c)
  }
}

function addDeck(type, n, x, y, stack) {
  var ShamrockTestDeck = [12,12,13,13,12,13,13]

  var cards = []
  for (var i = 1; i <= 13; i++) {
    cards.push(i)
    cards.push(i)
  }

  for(var i = 0; i < n; i++) {
    if(SHAMROCK_AND_DEATH_TEST) {
      value = ShamrockTestDeck[6-i]
    }
    else {
      var cn = Math.floor(Math.random() * cards.length)
      var value = cards[cn]
      cards.splice(cn, 1)
    }

    var c = newCard(type, value)
    var yy = y - i * 6
    c.style.transform = `translate(${x}px, ${yy}px)`
    c.onclick = playerPickCard
    stack.push(c)
    add(c)
  }
}

function addDecksIfEmpty() {
  if(attackDeck.length == 0) {
    addDeck('attack', cardsInDeck, 150, 480, attackDeck)
  }

  if(defenseDeck.length == 0) {
    addDeck('defense', cardsInDeck, 450, 480, defenseDeck)
  }
}

function showCard(card, move, end) {
  hands.style.display = 'none'

  card.style.zIndex = 100

  setTimeout(function() {
    if(card.classList.contains('back')) {
      card.classList.remove('back')
      card.classList.add('front')
    }
  }, 100)
  
  
  var a1 = card.animate([
      {transform: 'translate(300px, 450px) scale(1.5)'}
    ], {duration: SHOW_CARD_DURATION * 1000, fill: 'forwards'})

  a1.finished.then(() => {
    move(card, end)
  })
}

function moveToHand(card, x, y, z, end) {
  card.style.zIndex = z

  var anim = card.animate([
        {transform: `translate(${x}px, ${y}px) scale(1) rotate(360deg)`},
      ], {duration: MOVE_CARD_DURATION * 1000, fill: 'forwards'})
  
  anim.finished.then(() => {
    card.style.transform = `translate(${x}px, ${y}px) scale(1) rotate(0deg)`
    end()
  })
}

function endTurn() {
  addDecksIfEmpty()
  changeTurn()
  toggleHands()
  resetTimer()
}

function playerPickCard() {
  if (turn == 1 || activeTime == false) {
    return false
  }

  activeTime = false

  if(this.classList.contains('attack')) {
    var c = attackDeck.pop()

    var l = playerAttackHand.length
    var x = 45 + 35 * l
    var dir = l % 2 == 0 ? -1 : 1
    var y = 782 + 15 * l * dir

    showCard(c, () => { moveToHand(c, x, y, l, () => {
          playerAttackHand.push(c)
          flushHandIfNeeded(playerAttackHand)
          endTurn()
      })}
    )
  }
  else if(this.classList.contains('defense')) {
    var c = defenseDeck.pop()

    var l = playerDefenseHand.length
    var x = 472 + 35 * l
    var dir = l % 2 == 0 ? -1 : 1
    var y = 782 + 15 * l * dir

    showCard(c, () => { moveToHand(c, x, y, l, () => {
        playerDefenseHand.push(c)
        flushHandIfNeeded(playerDefenseHand)
        endTurn()
      })}
    )
  }
  else if(this.classList.contains('shamrock')) {
    var deck = getCardDeck(this)
    var c = deck.pop()

    var l = playerLuckyHand.length
    var dir = l % 2 == 0 ? -1 : 1
    var x = 297 + 15 * dir
    var y = 810 - 15 * l

    showCard(c, () => { moveToHand(c, x, y, l, () => {
        playerLuckyHand.push(c)
        endTurn()
      })}
    )
  }
  else if(this.classList.contains('death')) {
    var deck = getCardDeck(this)
    var c = deck.pop()

    showCard(c, () => {
      playerUseShamrockOrDie(c, playerLuckyHand)
    })
  }
}

function cpuPickCard() {
  if(turn == 0) {
    return false
  }

  activeTime = false
  var type = Math.round(Math.random(1))
  var deck = type == 0 ? attackDeck : defenseDeck
  var c = deck.pop()

  var x = 475
  var y = 185
  var l = 50

  if(c.classList.contains('attack')) {
    showCard(c, () => { moveToHand(c, x, y, l, () => {
        cpuAttackHand.push(c)
        c.style.display = 'none'
        endTurn()
      })}
    )
  }
  else if (c.classList.contains('defense')) {
    showCard(c, () => { moveToHand(c, x, y, l, () => {
        cpuDefenseHand.push(c)
        c.style.display = 'none'
        endTurn()
      })}
    )
  }
  else if (c.classList.contains('shamrock')) {
    showCard(c, () => { moveToHand(c, x, y, l, () => {
        cpuLuckyHand.push(c)
        c.style.display = 'none'
        endTurn()
      })}
    )
  }
  else if (c.classList.contains('death')) {
    showCard(c, () => {
      cpuUseShamrockOrDie(c, cpuLuckyHand)
    }, () => {})
  }
}

function playerUseShamrockOrDie(deathCard, luckyHand) {
  if(luckyHand.length == 0) {
    if(IMMORTALS) {
      // move to lucky hand and remove
      moveToHand(deathCard, 297, 810, 500, () => {
        deathCard.remove()
        endTurn()
      })
    }
    else {
      setTimeout(resetGame, 2000)
    }
  }
  else {
    moveToHand(deathCard, 297, 810, 500, () => {
      var shamrock = luckyHand.pop()
      shamrock.remove()
      deathCard.remove()
      endTurn()
    })
  }
}

function cpuUseShamrockOrDie(deathCard, luckyHand) {
  if(luckyHand.length == 0) {
    if(IMMORTALS) {
      moveToHand(deathCard, 475, 185, 50, () => {
        deathCard.remove()
        endTurn()
      })
    }
    else {
      setTimeout(resetGame, 2000)
    }
  }
  else {
    moveToHand(deathCard, 475, 185, 50, () => {
      var shamrock = luckyHand.pop()
      shamrock.remove()
      deathCard.remove()
      endTurn()
    })
  }
}

function getCardDeck(card) {
  var type = card.getAttribute('deck')

  if(type == 'attack') {
    return attackDeck
  }
  else if (type == 'defense') {
    return defenseDeck
  }
}

function getHandPoints(theHand) {
  var v = 0
  for(var i in theHand) {
    v += theHand[i].getElementsByClassName("value")[0].textContent * 1
  }

  return v
}

function flushHandIfNeeded(theHand) {
  var points = getHandPoints(theHand)

  if(points >= 13) {
    removeCardsFromHand(theHand)
  }
}

function removeCardsFromHand(theHand) {
  var l = theHand.length
  for (var i = 0; i < l; i++) {
    var c = theHand.pop()
    c.remove()
  }
}

function strToHtml(str) {
  var parser = new DOMParser()
  DOM = parser.parseFromString(str, 'text/html')
  return DOM.body.childNodes[0]
}

function newCard(type, value = 0, side = 'back') {
  var cardtype = value == 13 ? "death" : value == 12 ? "shamrock" : type
  var numeral = numerals[value]
  var icon = icons[cardtype]

  var str = `<div class="card ${cardtype} ${side}" deck="${type}">
  <div class="bg">
  <svg width="100%" height="100%">
      <text class="value" x="6" y="17">${value}</text>
      <text class="numeral" x="50%" y="38%">${numeral}</text>
      <text class="icon" x="50%" y="75%">${icon}</text>
    </svg>
  </div>
  <div class="${type}bg"></div>
  <div class="pattern"></div>
  </div>`

  return strToHtml(str)
}