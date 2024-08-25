var numerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII']
var icons = { death: '🕱', shamrock: '☘', attack: '⚔', defense: '⛨'}

var ctx = getElement('ctx')
var timer = getElement('timer')
var hands = getElement('hands')

var playerCircle = getElement('playercircle')
var playerInfo = getElement('playerinfo')
var playerHpBar = getElement('playerhpbar')
var playerActionBar = getElement('playeractionbar')

var cpuCircle = getElement('cpucircle')
var cpuInfo = getElement('cpuinfo')
var cpuHpBar = getElement('cpuhpbar')
var cpuActionBar = getElement('cpuactionbar')

function getElement(id) {
  return document.getElementById(id)
}

function add(element) {
  ctx.appendChild(element)
}


var SHAMROCKS_ON_START = 1 // Number of shamrocks that Player will have from the beginning
var IMMORTALS = false // If enabled then CPU and player are immortal
var SHAMROCK_AND_DEATH_TEST = false // If enabled then the deck have only shamrocks and deaths

var TIMER_DURATION = 0.5 // seconds
var SHOW_CARD_DURATION = 0.5
var SHOW_CARD_DELAY = 1
var MOVE_CARD_DURATION = 0.4
var DEATH_DURATION = 3

var HP_BAR_WIDTH = 352
var AT_BAR_WIDTH = 352

var sfxPick = [,,313,.02,.02,.02,1,2.4,-30,,-247,.08,,,,,,.98,.03]
var sfxMove = [.4,,243,.01,.05,.19,,.2,,90,,,,.1,,,,.56,.05,,100]
var sfxHit = [1.1,,101,.03,.05,.25,4,.6,,2,,,.04,1.3,,.1,,.75,.04,.19]
var sfxVanish = [,,229,.05,.21,.09,1,1.3,,,,,.03,,3.8,.1,,.56,.3,.43,305]
var sfxLuck = [5,,593,.03,.23,.3,,3.1,,,290,.08,.07,,,.1,,.65,.27,.12,-1406]
var sfxDeath = [,,418,.06,.28,.35,,2,-7,-104,-57,.1,.01,,,,,.93,.26]
var sfxWin = [1.8,,417,,.3,.05,3,2.7,-3,,373,.35,,.1,,,.3,.63,.09,.37]

function playSound(sfx) {
  zzfx(...sfx)
}

// Who's turn to pick a card
// This is not related with action (attack) because it has own timer (AT)
var turn = 0 // 0 = Player, 1 = CPU
// Bnuch of flags to control who can do what
var isActionTime = false

// Player
var playerName = 'Isoldee'
var playerLv = 1
var playerMaxHP = 20
var playerAttack = 2
var playerHP = playerMaxHP // player health points
var playerActionBarDuration = 10 // seconds
var playerActionBarAnimation = null

// CPU
var cpuName = 'Shakhaar'
var cpuLv = 1
var cpuMaxHP = 10
var cpuAttack = 2
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

// Enemy types
var enemyType = [
  {
    name: 'Green Slime',
    minLv: 1,
    maxLv: 3,
    minHP: 5,
    maxHP: 15,
    actionBarDuration: 17
  },
  {
    name: 'Blue Slime',
    minLv: 2,
    maxLv: 5,
    minHP: 10,
    maxHP: 30,
    actionBarDuration: 15
  },
  {
    name: 'Red Slime',
    minLv: 5,
    maxLv: 10,
    minHp: 25,
    maxHp: 50
  },
  {
    name: 'Shakhaar',
    minLv: 30,
    maxLv: 30,
    minHp: 50,
    maxHp: 70
  }
]

var scale = 1
window.onresize = resizeWindow;
resizeWindow()

function resizeWindow() {
  var availableWidth = window.innerWidth
  var availableHeight = window.innerHeight
  var contentWidth = ctx.offsetWidth
  var contentHeight = ctx.offsetHeight
  
  scale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight)
  ctx.style.transform = `scale(${scale})`

  var x = (availableWidth - contentWidth) / 2
  var y = (availableHeight - contentHeight) / 2
  ctx.style.left = `${x}px`
  ctx.style.top = `${y}px`
}

function screenShake() {
  var shakeKeyframes = []

  for(var i = 0; i < 10; i++) {
    var x = Math.round(Math.random() * 6) - 3
    var y = Math.round(Math.random() * 6) - 3
    var a = Math.round(Math.random() * 2) - 1
    shakeKeyframes.push({transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${a}deg)`})
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
//timerAnim.onend = onTimer
timer.appendChild(timerAnim)

/* START GAME */
resetGame()

function resetGame() {
  updatePlayerInfo()
  updateCpuInfo()

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
  isActionTime = false
  toggleCircles()

  addShamrocks(SHAMROCKS_ON_START)

  addDecksIfEmpty()
  resetTimer()
  resetCpuActionBar()
  resetPlayerActionBar()
}

function updatePlayerInfo() {
  playerInfo.innerHTML = `${playerName} Lv. ${playerLv}`
}

function updateCpuInfo() {
  cpuInfo.innerHTML = `${cpuName} Lv. ${cpuLv}`
}

function removeAllCards() {
  var cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.remove()
  })
}

var turnTimer = null

function resetTimer() {
  timerAnim.beginElement()
  clearTimeout(turnTimer)
  turnTimer = setTimeout(onTimer, TIMER_DURATION * 1000)
}

function onTimer() {
  toggleCircles()
  toggleHands()

  if(turn == 1) {
    CPU()
  }
}

var cpuMoveTimout = null

function CPU() {
  if(isActionTime == true) {
    return false
  }

  clearTimeout(cpuMoveTimout)
  cpuMoveTimout = setTimeout(() => { cpuPickCard() }, 500 + Math.floor(Math.random() * 1000))
}

function resumeCpu() {
  if(turn == 1 && isActionTime == false) {
    CPU()
  }
}

function changeTurn() {
  turn = (turn + 1) % 2
}

function toggleHands() {
  hands.style.display = turn == 0 ? "block" : "none"
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

// Player action when action bar is full
function doPlayerAction() {
  isActionTime = true;
  pauseActionBars();
  playSound(sfxPick)

  var playerAttackPoints = getHandActionPoints(playerAttackHand, playerLv)
  var cpuDefensePoints = getHandActionPoints(cpuDefenseHand, cpuLv)
  var hitPoints = playerAttackPoints - cpuDefensePoints

  hitPoints = playerAttack + (hitPoints < 0 ? 0 : hitPoints)

  if (hitPoints > 0) {
    // Player have no cards in attack hand
    if(playerAttackHand.length == 0) {
      cpuHP = cpuHP - hitPoints < 0 ? 0 : cpuHP - hitPoints
      playSound(sfxHit)
      screenShake()
      refreshCpuHpBar()
      removeCardsFromHand(cpuDefenseHand)

      if(cpuHP == 0) {
        console.log("CPU DEAD")
        cpuHP = 0
        refreshCpuHpBar()
        playSound(sfxWin)
        setTimeout(resetGame, DEATH_DURATION * 1000)
      }
      else {
        resumeActionBars()
        resetPlayerActionBar()
        isActionTime = false
        resumeCpu()
      }
    }
    // Player have cards in attack hand
    else {
      for(var i in playerAttackHand) {
        var card = playerAttackHand[i]
        card.style.zIndex = 500
        var anim = card.animate(
          [{transform: 'translate(475px, 185px) scale(0.75) rotate(-360deg)'}],
          {duration: 800, fill: 'forwards'})
  
        anim.finished.then(() => {
          if (i == playerAttackHand.length - 1) {
            cpuHP = cpuHP - hitPoints < 0 ? 0 : cpuHP - hitPoints
            playSound(sfxHit)
            screenShake()
            refreshCpuHpBar()
            removeCardsFromHand(playerAttackHand)
            removeCardsFromHand(cpuDefenseHand)
  
            if(cpuHP == 0) {
              console.log("CPU DEAD")
              cpuHP = 0
              refreshCpuHpBar()
              playSound(sfxWin)
              setTimeout(resetGame, DEATH_DURATION * 1000)
            }
            else {
              resumeActionBars()
              resetPlayerActionBar()
              isActionTime = false
              resumeCpu()
            }
          }
        })
      }
    }
  }
  else {
    resetPlayerActionBar()
    resumeActionBars()
    isActionTime = false
    resumeCpu()
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

// CPU action when action bar is full
function doCpuAction() {
  isActionTime = true;
  pauseActionBars();
  playSound(sfxPick)

  var cpuAttackPoints = getHandActionPoints(cpuAttackHand, cpuLv)
  var playerDefensePoints = getHandActionPoints(playerDefenseHand, playerLv)
  var hitPoints = cpuAttackPoints - playerDefensePoints

  hitPoints = cpuAttack + (hitPoints < 0 ? 0 : hitPoints)

  if (hitPoints > 0) {
    // CPU have no cards in attack hand
    if(cpuAttackHand.length == 0) {
      playerHP = playerHP - hitPoints < 0 ? 0 : playerHP - hitPoints
      playSound(sfxHit)
      screenShake()
      refreshPlayerHpBar()
      removeCardsFromHand(playerDefenseHand)

      if(playerHP == 0) {
        console.log("PLAYER DEAD")
        playerHP = 0
        refreshPlayerHpBar()
        playSound(sfxDeath)
        setTimeout(resetGame, DEATH_DURATION * 1000)
      }
      else {
        resetCpuActionBar()
        resumeActionBars()
        isActionTime = false
        resumeCpu()
      }
    }
    // CPU have cards in attack hand
    else {
      for(var i in cpuAttackHand) {
        var card = cpuAttackHand[i]
        card.style.display = 'block'
        card.style.zIndex = 500
        var anim = card.animate(
          [{transform: 'translate(100px, 1000px) scale(0.75) rotate(-360deg)'}],
          {duration: 800, fill: 'forwards'})
  
        anim.finished.then(() => {
          if (i == cpuAttackHand.length - 1) {
            playerHP = playerHP - hitPoints < 0 ? 0 : playerHP - hitPoints
            playSound(sfxHit)
            screenShake()
            refreshPlayerHpBar()
            removeCardsFromHand(cpuAttackHand)
            removeCardsFromHand(playerDefenseHand)
  
            if(playerHP == 0) {
              console.log("PLAYER DEAD")
              playerHP = 0
              refreshPlayerHpBar()
              playSound(sfxDeath)
              setTimeout(resetGame, DEATH_DURATION * 1000)
            }
            else {
              resumeActionBars()
              resetCpuActionBar()
              isActionTime = false
              resumeCpu()
            }
          }
        })
      }
    }
  }
  else {
    resetCpuActionBar()
    resumeActionBars()
    isActionTime = false
    resumeCpu()
  }
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
  hands.style.display = "none"

  card.style.zIndex = 500

  setTimeout(function() {
    if(card.classList.contains('back')) {
      card.classList.remove('back')
      card.classList.add('front')
    }
  }, SHOW_CARD_DURATION * 1000 / 2)
  
  
  var anim = card.animate([
      {transform: 'translate(300px, 450px) scale(1.5)'}
    ], {duration: SHOW_CARD_DURATION * 1000, easing: 'ease-out', endDelay: SHOW_CARD_DELAY * 1000, fill: 'forwards'})

  anim.finished.then(() => {
    move(card, end)
  })
}

function moveToHand(card, x, y, z, end) {
  playSound(sfxMove)
  card.style.zIndex = z

  var anim = card.animate([
        {transform: `translate(${x}px, ${y}px) scale(1) rotate(360deg)`},
      ], {duration: MOVE_CARD_DURATION * 1000, easing: 'ease-out', fill: 'forwards'})
  
  anim.finished.then(() => {
    card.style.transform = `translate(${x}px, ${y}px) scale(1) rotate(0deg)`
    end()
  })
}

function pauseActionBars() {
  playerActionBarAnimation.pause()
  cpuActionBarAnimation.pause()
}

function resumeActionBars() {
  playerActionBarAnimation.play()
  cpuActionBarAnimation.play()
}

function endTurn() {
  addDecksIfEmpty()
  changeTurn()
  toggleHands()
  resetTimer()
  resumeActionBars()
}

function playerPickCard() {
  var activeTime = hands.style.display == "none" ? false : true
  if (turn == 1 || activeTime == false || isActionTime == true) {
    return false
  }

  pauseActionBars()
  playSound(sfxPick)

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
        playSound(sfxLuck)
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
  if(turn == 0 || isActionTime == true) {
    return false
  }

  pauseActionBars()
  playSound(sfxPick)

  var type = Math.round(Math.random(1))
  var deck = type == 0 ? attackDeck : defenseDeck

  var attackDeckPoints = getHandPoints(cpuAttackHand)
  var defenseDeckPoints = getHandPoints(cpuDefenseHand)

  // Select defense card if it has lower points than attack hand
  if(defenseDeckPoints < attackDeckPoints) {
    deck = defenseDeck
  }
  
  var c = deck.pop()

  var x = 475
  var y = 185
  var l = 50

  if(c.classList.contains('attack')) {
    showCard(c, () => { moveToHand(c, x, y, l, () => {
        cpuAttackHand.push(c)
        c.style.display = 'none'
        flushHandIfNeeded(cpuAttackHand)
        endTurn()
      })}
    )
  }
  else if (c.classList.contains('defense')) {
    showCard(c, () => { moveToHand(c, x, y, l, () => {
        cpuDefenseHand.push(c)
        c.style.display = 'none'
        flushHandIfNeeded(cpuDefenseHand)
        endTurn()
      })}
    )
  }
  else if (c.classList.contains('shamrock')) {
    showCard(c, () => { moveToHand(c, x, y, l, () => {
        cpuLuckyHand.push(c)
        c.style.display = 'none'
        playSound(sfxLuck)
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
        playSound(sfxLuck)
        deathCard.remove()
        endTurn()
      })
    }
    else {
      console.log('PLAYER DEAD')
      playerHP = 0
      refreshPlayerHpBar()
      playSound(sfxDeath)
      setTimeout(resetGame, DEATH_DURATION * 1000)
    }
  }
  else {
    moveToHand(deathCard, 297, 810, 500, () => {
      var shamrock = luckyHand.pop()
      playSound(sfxLuck)
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
        playSound(sfxLuck)
        deathCard.remove()
        endTurn()
      })
    }
    else {
      console.log('CPU DEAD')
      cpuHP = 0
      refreshCpuHpBar()
      playSound(sfxWin)
      setTimeout(resetGame, DEATH_DURATION * 1000)
    }
  }
  else {
    moveToHand(deathCard, 475, 185, 50, () => {
      var shamrock = luckyHand.pop()
      playSound(sfxLuck)
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
    v += theHand[i].getElementsByClassName("value")[0].textContent * 0.5 * multiplier
  }

  return v
}

function flushHandIfNeeded(theHand) {
  var points = getHandPoints(theHand)

  if(points >= 13) {
    playSound(sfxVanish)
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
  <div class="pattern ${type}"></div>
  </div>`

  return strToHtml(str)
}