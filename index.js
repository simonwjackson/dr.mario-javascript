// Dr Mario JS
// by Radoslav Kirov
// last updated February 2011
// under BY-NC-SA CC license
// http://creativecommons.org/licenses/by-nc-sa/3.0/us/

import * as _ from '//cdn.jsdelivr.net/npm/ramda@latest/es/index.js'
import * as utils from './utils.js'
import * as withContext from './withContext.js'
import createContext from './createContext.js'
import MakeGame from './Game.js'
import MakeBlock from './Block.js'
import MakeBotGame from './BotGame.js'

const context = createContext({
  arena: document.getElementById('canvas').getContext('2d')
})

let games = [],
  init,
  N = [
    [
      [0, 2],
      [0, 4]
    ],
    [
      [3, 1],
      [0, 0]
    ],
    [
      [2, 0],
      [4, 0]
    ],
    [
      [0, 0],
      [3, 1]
    ]
  ],
  blocks = [],
  COLORS = 3,
  wins = [0, 0]

const {
  stop,
  start,
  draw,
  drawVirus,
  toggle,
  // Matrix
  copy,
  eq,
  flip2by2,
  onetrue
} = _.evolve({
  stop: fn => () => withContext.stop(context)(fn),
  start: fn => () => withContext.start(context)(draw)(fn),
  draw: fn => () => withContext.draw(context)(games)(fn),
  drawVirus: fn => () => withContext.drawVirus(context)(fn),
  toggle: fn => () =>
    withContext.toggle(context)(start)(stop)(display_text)(draw)(fn),
}, utils)

let R = 0.3,
  hpill = [
    [-1, -1],
    [-1, 1 - R],
    [-1 + R, 1],
    [1 - R, 1],
    [1, 1 - R],
    [1, -1]
  ],
  pill = [
    [-1 + R, -1],
    [-1, -1 + R],
    [-1, 1 - R],
    [-1 + R, 1],
    [1 - R, 1],
    [1, 1 - R],
    [1, -1 + R],
    [1 - R, -1]
  ]

function drawPath(arena, P) {
  arena.beginPath()
  arena.moveTo(P[0][0], P[0][1])
  for (let i = 1, l = P.length; i < l; i++)
    arena.lineTo(P[i][0], P[i][1])

  arena.lineTo(P[0][0], P[0][1])
}

const drawBlock = arena => (x, y, r, color, neighbor) => {
  arena.fillStyle = color
  arena.beginPath()
  arena.save()
  arena.translate(x + r / 2, y + r / 2)
  arena.scale(r / 2, r / 2)
  if (neighbor && neighbor !== 0) {
    arena.rotate((+neighbor - 1) * Math.PI * 2 / 4)
    drawPath(arena, hpill)
  }
  else {
    drawPath(arena, pill)
  }
  arena.fill()
  arena.restore()
}

init = single_init

const BotGame = MakeBotGame(eq)
const Block = MakeBlock(context, COLORS, drawBlock, N)
const Game = MakeGame(context, Block, blocks, N, direct, onetrue, stop, display_text, wins, init, null, games, drawBlock, drawVirus, copy, flip2by2)

function direct(x, y, n) {
  switch (n) {
  case 0:
    return [x, y]
  case 1:
    return [x, y - 1]
  case 2:
    return [x + 1, y]
  case 3:
    return [x, y + 1]
  case 4:
    return [x - 1, y]
  }
}

function display_text(game, text) {
  let i
  if (game === 'all')
    for (i = 0; i < games.length; i++)
      games[i].add_message(text)

  else
    games[game].add_message(text)

}

window.addEventListener('keypress', function (e) {
  let s = String.fromCharCode(e.which)
  if (e.which === 32)
    toggle()

  const keyP = _.when(_.equals('p'))
  keyP(toggle, s)

  let game = (init === two_p_init || init === single_with_bot_init) ? 1 : 0
  if (s === '4' || s === 'j')
    games[game].move('left')

  if (s === '6' || s === 'l')
    games[game].move('right')

  if (s === '5' || s === 'k')
    games[game].start_fastdrop()

  if (s === '8' || s === 'i')
    games[game].flip()

  if (init === two_p_init) {
    if (s === 'a')
      games[0].move('left')

    if (s === 'd')
      games[0].move('right')

    if (s === 's')
      games[0].start_fastdrop()

    if (s === 'w')
      games[0].flip()

  }
  if (s === '-') {
    stop(context)
    init = single_with_bot_init
    init()
    start()
  }
  if (s === '=') {
    stop(context)
    init = two_p_init
    init()
    start()
  }
  if (s === '[') {
    stop(context)
    init = single_init
    init()
    start()
  }
  // DEBUGGING
  //    if (String.fromCharCode(e.charCode) === '1'){
  //       games[0].movable.speed = 10000;
  //    }
  //    if (String.fromCharCode(e.charCode) === '2'){
  //       games[1].movable.speed = 10000;
  //    }
  //    if (String.fromCharCode(e.charCode) === '3'){
  //        punish(games[0],[2,1]);
  //    }
  //    if (String.fromCharCode(e.charCode) === '4'){
  //        single_init(1);
  //        games[0].falling.push(new Block(4, 2,games[0].speed,[[1]]));
  //        games[0].falling.push(new Block(4, 1,games[0].speed,[[1]]));
  //        games[0].falling.push(new Block(4, 0,games[0].speed,[[1]]));
  //        games[0].falling.push(new Block(4,-1,games[0].speed,[[1]]));
  //    }
  //
  e.preventDefault()
}, false)

function copy_game_state(game_from, game_to) {
  game_to.state = copy(game_from.state)
  game_to.initial = copy(game_from.initial)
  game_to.virus = game_from.virus; + 1
}

function two_p_init(speed, level) {
  let i
  games = []
  games.push(new Game(10, 16, speed || 8, level || 10, 0))
  games.push(new Game(10, 16, speed || 8, level || 10, 1))
  copy_game_state(games[0], games[1])
  init_blocks()
}

function single_init(speed, level) {
  let i
  games = []
  games.push(new Game(10, 16, speed || 8, level || 1, 0))
  init_blocks()
}

function single_with_bot_init(speed, level) {
  games = []
  games.push(new BotGame(new Game(10, 16, speed || 8, level || 10, 0), better_algo))
  games.push(new Game(10, 16, speed || 8, level || 10, 1))
  copy_game_state(games[0].game, games[1])
  init_blocks()
}

const init_blocks = () =>
  _.times(() =>
    blocks.push(1 + Math.floor(Math.random() * COLORS)),
  10000)

// AI code

//input state & falling state, output: desired position and rotation
// function random_algo(state, drop_state) {
//   let x = state.length,
//     y = state[0].length,
//     new_state = copy(drop_state),
//     i, l
//   for (i = 0, l = Math.random() * 2; i < l; i++)
//     new_state = flip2by2(new_state)

//   return [Math.floor(Math.random() * x), new_state]
// }

function better_algo(state, drop_state) {
  let stateinfo = analyze_state(state),
    top_color = stateinfo.tops,
    heights = stateinfo.heights,
    colors = get_drop_colors(drop_state),
    x = 0
  x = pair_in_list(colors, stateinfo)
  if (x !== -1)
    return set_drop_state(x, drop_state, colors, 'flat')

  colors = [colors[1], colors[0]]
  x = pair_in_list(colors, stateinfo)
  if (x !== -1)
    return set_drop_state(x, drop_state, colors, 'flat')

  if (colors[0] === colors[1]) {
    // add check for double below
  }
  x = single_in_list(colors[1], stateinfo)
  if (x !== -1)
    return set_drop_state(x, drop_state, [colors[0], colors[1]], 'down')

  x = single_in_list(colors[0], stateinfo)
  if (x !== -1)
    return set_drop_state(x, drop_state, [colors[1], colors[0]], 'down')

  //return random_algo(state, drop_state);
  return set_drop_state(max(stateinfo.heights).max_index, drop_state, [colors[1], colors[0]], 'down')
}

//assume possitive L
function max(L) {
  let l = L.length,
    i, best = -1,
    besti = 0
  for (i = 0; i < l; i++)
    if (L[i] > best) {
      best = L[i]
      besti = i
    }

  return {
    max: best,
    max_index: besti
  }
}

function pair_in_list(p, stateinfo) {
  let i, s, l = stateinfo.tops.length,
    offset = Math.floor(l / 2)
  for (i = 0; i < l - 1; i++) {
    s = (i + offset) % l
    if (p[0] === stateinfo.tops[s] && p[1] === stateinfo.tops[s + 1] && stateinfo.heights[s] > 3 && stateinfo.heights[s + 1] > 3)
      return s

  }
  return -1
}

function single_in_list(c, stateinfo) {
  let i, s, l = stateinfo.tops.length,
    offset = Math.floor(l / 4),
    besth = 0,
    x = -1
  for (i = 0; i < l; i++) {
    s = (i + offset) % l
    if (c === stateinfo.tops[s] && stateinfo.heights[s] > besth) {
      x = s
      besth = stateinfo.heights[s]
    }
  }
  return x
}

function analyze_state(state) {
  let i, tops = [],
    heights = [],
    t
  for (i = 0; i < state.length; i++) {
    t = 0
    while (t < state[i].length && state[i][t] === 0)
      t++

    tops.push(state[i][t])
    heights.push(t)
  }
  return {
    tops: tops,
    heights: heights
  }
}

function get_drop_colors(drop_state) {
  let n = [],
    i, j, a = drop_state
  for (i = 0; i < a.length; i++)
    for (j = 0; j < a[0].length; j++)
      if (a[i][j] !== 0)
        n.push(a[i][j])

  return n
}

function inList(a, L, eq) {
  let i
  for (i = 0; i < L.length; i++)
    if (eq(L[i], a))
      return true

  return false
}

function set_drop_state(goalx, current_state, colors, orientation) {
  //console.log('goal ',goalx, ' ', orientation);
  let i, possible_states = [],
    a = copy(current_state),
    goal
  for (i = 0; i < 4; i++) {
    possible_states.push(a)
    a = copy(a)
    a = flip2by2(a)
  }
  if (orientation === 'down') {
    goal = [
      [colors[0], colors[1]],
      [0, 0]
    ]
    if (inList(goal, possible_states, eq))
      return [goalx, goal]

    goal = [
      [0, 0],
      [colors[0], colors[1]]
    ]
    if (inList(goal, possible_states, eq))
      return [goalx - 1, goal]

  }
  if (orientation === 'flat') {
    goal = [
      [colors[0], 0],
      [colors[1], 0]
    ]
    if (inList(goal, possible_states, eq))
      return [goalx, goal]

    goal = [
      [0, colors[0]],
      [0, colors[1]]
    ]
    if (inList(goal, possible_states, eq))
      return [goalx, goal]

  }
}

/* ********************** init *********************** */

init()
start()
toggle()