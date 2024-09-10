var numerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII']
var icons = {
  attack: ['swords', 25, 80, 1],
  defense: ['shield', 25, 85, 1],
  shamrock: ['shamrock', 10, 70, 0.65],
  death: ['skull', 25, 87, 1] 
}

var ctx = getElement('ctx')
var timer = getElement('timer')
var hands = getElement('hands')
var stage = getElement('stage')

add(InfoArea('cpu'))
add(InfoArea('player'))

var playerInfo = getElement('playerinfo')
var playerturn = getElement('playerturn')
var playerHpBar = getElement('playerhpbar')
var playerActionBar = getElement('playeractionbar')

var cpuInfo = getElement('cpuinfo')
var cputurn = getElement('cputurn')
var cpuHpBar = getElement('cpuhpbar')
var cpuActionBar = getElement('cpuactionbar')

function getElement(id) {
  return document.getElementById(id)
}

function add(element) {
  ctx.appendChild(element)
}

var SHAMROCKS_ON_START = 1
var IMMORTALS = false
var SHAMROCK_AND_DEATH_TEST = false

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

var turn = 0 // 0 = Player, 1 = CPU
var isActionTime = false

var stageNumber = 1

var playerName = 'Knight'
var playerLv = 1
var playerMaxHP = 20
var playerAttack = 2
var playerHP = playerMaxHP
var playerActionBarDuration = 10
var playerActionBarAnimation = null

var cpuName = 'Green Bomb'
var cpuLv = 1
var cpuMaxHP = 10
var cpuAttack = 2
var cpuHP = cpuMaxHP
var cpuActionBarDuration = 13
var cpuActionBarAnimation = null

var cardsInDeck = 7
var attackDeck = []
var defenseDeck = []

var playerAttackHand = []
var playerLuckyHand = []
var playerDefenseHand = []

var cpuAttackHand = []
var cpuLuckyHand = []
var cpuDefenseHand = []

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

function vibrate(pat) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pat)
  }
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
  vibrate(500)
}

var timerAnim = document.createElementNS('http://www.w3.org/2000/svg','animate')
timerAnim.setAttribute("attributeName", "stroke-dashoffset")
timerAnim.setAttribute("from", 360)
timerAnim.setAttribute("to", 0);
timerAnim.setAttribute("dur", `${TIMER_DURATION}s`)
timerAnim.setAttribute("fill", "forwards")
timer.appendChild(timerAnim)

/* START GAME */
progressCpu()
resetGame()

function updateStageInfo() {
  stage.innerHTML = `Stage ${stageNumber}`
}

function progressPlayer() {
  playerLv += 1
  playerMaxHP = 20 + playerLv * 5
  playerAttack = 6 + playerLv * 3
}

function progressCpu() {
  cpuLv = stageNumber + Math.round(Math.random(stageNumber * 4))
  cpuMaxHP = cpuLv * 10
  cpuAttack = cpuLv * 4
  cpuActionBarDuration = 8 + Math.round(Math.random(6))
}

function nextStage() {
  vibrate(500)
  stageNumber += 1
  progressCpu()
  resetGame()
}

function gameOver() {
  vibrate(500)
  stageNumber = 1
  progressCpu()
  resetGame()
}

function resetGame() {
  updatePlayerInfo()
  updateCpuInfo()
  updateStageInfo()

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
  toggleTurns()

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
  toggleTurns()
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
  toggleTurns()
  hands.style.display = turn == 0 ? "block" : "none"
}

function toggleTurns() {
  cputurn.classList.remove('active')
  playerturn.classList.remove('active')

  if(turn == 0) {
    playerturn.classList.add('active')
  }
  else {
    cputurn.classList.add('active')
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
  isActionTime = true;
  pauseActionBars();
  playSound(sfxPick)

  var playerAttackPoints = getHandActionPoints(playerAttackHand, playerLv)
  var cpuDefensePoints = getHandActionPoints(cpuDefenseHand, cpuLv)
  var hitPoints = playerAttackPoints - cpuDefensePoints

  hitPoints = playerAttack + (hitPoints < 0 ? 0 : hitPoints)

  if (hitPoints > 0) {
    if(playerAttackHand.length == 0) {
      cpuHP = cpuHP - hitPoints < 0 ? 0 : cpuHP - hitPoints
      playSound(sfxHit)
      screenShake()
      refreshCpuHpBar()
      removeCardsFromHand(cpuDefenseHand)

      if(cpuHP == 0) {
        cpuHP = 0
        refreshCpuHpBar()
        playSound(sfxWin)
        progressPlayer()
        setTimeout(nextStage, DEATH_DURATION * 1000)
      }
      else {
        resumeActionBars()
        resetPlayerActionBar()
        isActionTime = false
        resumeCpu()
      }
    }
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
              cpuHP = 0
              refreshCpuHpBar()
              playSound(sfxWin)
              progressPlayer()
              setTimeout(nextStage, DEATH_DURATION * 1000)
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

function doCpuAction() {
  isActionTime = true;
  pauseActionBars();
  playSound(sfxPick)

  var cpuAttackPoints = getHandActionPoints(cpuAttackHand, cpuLv)
  var playerDefensePoints = getHandActionPoints(playerDefenseHand, playerLv)
  var hitPoints = cpuAttackPoints - playerDefensePoints

  hitPoints = cpuAttack + (hitPoints < 0 ? 0 : hitPoints)

  if (hitPoints > 0) {
    if(cpuAttackHand.length == 0) {
      playerHP = playerHP - hitPoints < 0 ? 0 : playerHP - hitPoints
      playSound(sfxHit)
      screenShake()
      refreshPlayerHpBar()
      removeCardsFromHand(playerDefenseHand)

      if(playerHP == 0) {
        playerHP = 0
        refreshPlayerHpBar()
        playSound(sfxDeath)
        setTimeout(gameOver, DEATH_DURATION * 1000)
      }
      else {
        resetCpuActionBar()
        resumeActionBars()
        isActionTime = false
        resumeCpu()
      }
    }
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
              playerHP = 0
              refreshPlayerHpBar()
              playSound(sfxDeath)
              setTimeout(gameOver, DEATH_DURATION * 1000)
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
    var y = 780 - 15 * l

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
  vibrate(50)

  if(this.classList.contains('attack')) {
    var c = attackDeck.pop()

    var l = playerAttackHand.length
    var x = 45 + 35 * l
    var dir = l % 2 == 0 ? -1 : 1
    var y = 752 + 15 * l * dir

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
    var y = 752 + 15 * l * dir

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
    var y = 780 - 15 * l

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
  vibrate(50)

  var type = Math.round(Math.random(1))
  var deck = type == 0 ? attackDeck : defenseDeck

  var attackDeckPoints = getHandPoints(cpuAttackHand)
  var defenseDeckPoints = getHandPoints(cpuDefenseHand)

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
      moveToHand(deathCard, 297, 810, 500, () => {
        playSound(sfxLuck)
        deathCard.remove()
        endTurn()
      })
    }
    else {
      playerHP = 0
      refreshPlayerHpBar()
      playSound(sfxDeath)
      setTimeout(gameOver, DEATH_DURATION * 1000)
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
      cpuHP = 0
      refreshCpuHpBar()
      playSound(sfxWin)
      progressPlayer()
      setTimeout(nextStage, DEATH_DURATION * 1000)
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

  var icon = icons[cardtype][0]
  var x = icons[cardtype][1]
  var y = icons[cardtype][2]
  var scale = icons[cardtype][3]

  var str = `<div class="card ${cardtype} ${side}" deck="${type}">
  <div class="bg">
  <svg width="100%" height="100%">
      <text class="value" x="6" y="17">${value}</text>
      <text class="numeral" x="50%" y="38%">${numeral}</text>
    </svg>
    <img class="icon" src="img/${icon}.svg" style="transform: translate(${x}px, ${y}px) scale(${scale})" />
  </div>
  <div class="${type}bg"></div>
  <div class="pattern ${type}"></div>
  </div>`

  return strToHtml(str)
}

function InfoArea(type) {
  if(type == 'cpu') {
    t = 145
    x = 18
    x2 = 495
    y2 = 40
    s2 = 1.5
    x3 = 540
    y3 = 235
    s3 = 2.5
    l2 = 78
  }
  else {
    t = 1000
    x = 290
    x2 = 40
    y2 = 10
    s2 = 3
    x3 = 90
    y3 = -15
    s3 = 2.5
    l2 = 350
  }

  var str = `<div id="${type}" style="left: 0px; top: ${t}px; width: 100%; height: 270px">
    <svg width="100%" height="100%" style="position: absolute">
      <text id="${type}info" class="name" x="${x}" y="55"></text>

      <text class="info" x="${x}" y="113">HP</text>
      <rect x="${x + 56}" y="95" width="360" height="40" fill="#262c45" />

      <text class="info" x="${x}" y="155">AT</text>
      <rect x="${x + 56}" y="145" width="360" height="24" fill="#262c45" />
    </svg>

    <img id="${type}image" src="img/${type}.svg" style="position: absolute; left: ${x2}px; top: ${y2}px; transform: scale(${s2}); z-index: 2;"/>
    <img id="${type}turn" src="img/${type}turn.svg" style="position: absolute; left: ${x3}px; top: ${y3}px; transform: scale(${s3}); z-index: 3;"/>

    <svg id="${type}hpbar" style="left: ${l2}px; top: 99px; width: 352px; height: 40px">
      <rect class="hp" x="0" y="0" width="352" height="32" fill="#f00" />
      <rect class="hp" x="0" y="0" width="352" height="8" fill="#d00" />
    </svg>

    <svg id="${type}actionbar" style="left: ${l2}px; top: 149px; width: 352; height: 18">
      <rect x="0" y="0" width="352" height="16" fill="#ffe415" />
      <rect x="0" y="0" width="352" height="6" fill="#e27f1b" />
    </svg>
  </div>`

  return strToHtml(str)
}