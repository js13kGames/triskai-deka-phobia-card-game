var numerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII']
var icons = {
  death: '🕱',
  shamrock: '☘',
  attack: '⚔',
  defense: '⛨'
}

var ctx = getElement('ctx')
var timer = getElement('timer')
var hands = getElement('hands')
var cpuCircle = getElement('cpucircle')
var cpuHpBar = getElement('cpuhpbar')
var cpuActionBar = getElement('cpuactionbar')
var playerCircle = getElement('playercircle')
var playerHpBar = getElement('playerhpbar')
var playerActionBar = getElement('playeractionbar')

function getElement(id) {
  return document.getElementById(id)
}

function add(element) {
  ctx.appendChild(element)
}

// Number of shamrocks that Player will have from the beginning
var SHAMROCKS_ON_START = 1
// If enabled then CPU and player are immortal
var IMMORTALS = false
// If enabled then the deck have only shamrocks and deaths
var SHAMROCK_AND_DEATH_TEST = false

var TIMER_DURATION = 0.5 // seconds
var SHOW_CARD_DURATION = 1
var MOVE_CARD_DURATION = 0.6

var HP_BAR_WIDTH = 352
var AT_BAR_WIDTH = 352

// Who's turn to pick a card
// This is not related with action (attack) because it has own timer (AT)
var turn = 0 // 0 = Player, 1 = CPU
var activeTime = false

var playerNmae = 'Isoldee'
var playerLv = 5
var playerMaxHP = 50
var playerHP = playerMaxHP // player health points
var playerActionBarDuration = 10 // seconds
var playerActionBarAnimation = null

var cpuName = 'Shagaar'
var cpuLv = 2
var cpuMaxHP = 50
var cpuHP = cpuMaxHP // CPU health points
var cpuActionBarDuration = 13 // seconds
var cpuActionBarAnimation = null

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

var windowScale = 58

function resizeWindow() {
  var wh = window.innerHeight
  var ch = ctx.offsetHeight
  var ww = window.innerWidth;
  var cw = ctx.offsetWidth

  var windowScale = Math.floor(wh / ch * 100)
  var x = (wh - ch) / 2
  var y = (ww - cw) / 2

  ctx.style.transform = `scale(${windowScale}%)`
  ctx.style.top = `${x}px`
  ctx.style.left = `${y}px`
}

function screenShake() {
  var shakeKeyframes = []
  for(var i = 0; i < 10; i++) {
    var x = Math.round(Math.random() * 6) - 3
    var y = Math.round(Math.random() * 6) - 3
    var a = Math.round(Math.random() * 2) - 1
    shakeKeyframes.push({transform: `translate(${x}px, ${y}px) scale(${windowScale}%) rotate(${a}deg)`})
  }

  ctx.animate(shakeKeyframes, {duration: 500})
}

// Prepare timer animation
var timerAnim = document.createElementNS('http://www.w3.org/2000/svg','animate')
timerAnim.setAttribute("attributeName", "stroke-dashoffset")
timerAnim.setAttribute("from", 360)
timerAnim.setAttribute("to", 0);
timerAnim.setAttribute("dur", `${TIMER_DURATION}s`)
timerAnim.setAttribute("fill", "forwards")
timerAnim.onend = onTimer
timer.appendChild(timerAnim)

/* START GAME */
resetGame()

function resetGame() {
  playerHP = playerMaxHP
  cpuHP = cpuMaxHP
  refreshPlayerHpBar()
  refreshCpuHpBar()

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
  toggleCircles()

  addShamrocks(SHAMROCKS_ON_START)

  addDecksIfEmpty()
  resetTimer()
  resetCpuActionBar()
  resetPlayerActionBar()
}

function removeAllCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.remove()
  })
}

function resetTimer() {
  timerAnim.beginElement()
}

function onTimer() {
  activeTime = turn == 0 ? true : false

  toggleCircles()
  toggleHands()

  if(turn == 1) {
    CPU()
  }
}

function CPU() {
  setTimeout(() => { cpuPickCard() }, 500 + Math.floor(Math.random() * 1000))
}

function changeTurn() {
  turn = (turn + 1) % 2
}

function toggleHands() {
  hands.style.display = turn == 0 && activeTime == true ? 'block' : 'none'
}

function toggleCircles() {
  cpuCircle.classList.remove('active')
  playerCircle.classList.remove('active')

  if(turn == 0) {
    playerCircle.classList.add('active')
  }
  else {
    cpuCircle.classList.add('active')
  }
}

function resetPlayerActionBar() {
  playerActionBarAnimation = playerActionBar.animate(
    [{width: '0px'}, {width: `${AT_BAR_WIDTH}px`}],
    {duration: playerActionBarDuration * 1000, fill: 'forwards'}
  )

  playerActionBarAnimation.finished.then(() => {
    doPlayerAction()
  })
}

function doPlayerAction() {
  var playerAttackPoints = getHandActionPoints(playerAttackHand, playerLv)

  if (playerAttackPoints > 0) {
    var cpuDefensePoints = getHandActionPoints(cpuDefenseHand, cpuLv)
    var hitPoints = playerAttackPoints - cpuDefensePoints

    console.log('Player', playerAttackPoints, 'vs', 'CPU', cpuDefensePoints)

    if(hitPoints < 0) {
      hitPoints = 0
    }

    for(var i in playerAttackHand) {
      var card = playerAttackHand[i]
      card.style.zIndex = 500
      var anim = card.animate(
        [{transform: 'translate(475px, 185px) scale(0.75) rotate(-360deg)'}],
        {duration: 800, fill: 'forwards'})

      anim.finished.then(() => {
        if (i == playerAttackHand.length - 1) {
          cpuHP = cpuHP - hitPoints < 0 ? 0 : cpuHP - hitPoints

          screenShake()
          refreshCpuHpBar()
          removeCardsFromHand(playerAttackHand)
          removeCardsFromHand(cpuDefenseHand)

          if(cpuHP == 0) {
            console.log("CPU DEAD")
            resetGame()
          }
          else {
            resetPlayerActionBar()
          }
        }
      })
    }
    
  }
  else {
    resetPlayerActionBar()
  }
}

function refreshPlayerHpBar() {
  var width = Math.round(playerHP / playerMaxHP * HP_BAR_WIDTH)
  playerHpBar.style.width = `${width}px`
}

function refreshCpuHpBar() {
  var width = Math.round(cpuHP / cpuMaxHP * HP_BAR_WIDTH)
  cpuHpBar.style.width = `${width}px`
}

function resetCpuActionBar() {
  cpuActionBarAnimation = cpuActionBar.animate(
    [{width: '0px'}, {width: `${AT_BAR_WIDTH}px`}],
    {duration: cpuActionBarDuration * 1000, fill: 'forwards'}
  )

  cpuActionBarAnimation.finished.then(() => {
    doCpuAction()
  })
}

function doCpuAction() {
  resetCpuActionBar()
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
  resumeActionBars()
}

function pauseActionBars() {
  playerActionBarAnimation.pause()
  cpuActionBarAnimation.pause()
}

function resumeActionBars() {
  playerActionBarAnimation.play()
  cpuActionBarAnimation.play()
}

function playerPickCard() {
  if (turn == 1 || activeTime == false) {
    return false
  }

  activeTime = false
  pauseActionBars()

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
  pauseActionBars()

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

function getHandActionPoints(theHand, multiplier) {
  var v = 0
  for(var i in theHand) {
    v += theHand[i].getElementsByClassName("value")[0].textContent * (i + 1) * 0.5 * multiplier
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