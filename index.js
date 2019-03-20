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
import BotGame from './BotGame.js'

const context = createContext({
  arena: document.getElementById('canvas').getContext('2d'),
  games: [],
  blocks: []
})

let N = [
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
  flip2by2,
  onetrue,
  direct,
  random_algo,
  better_algo,
} = _.evolve({
  stop: fn => () => withContext.stop(context)(fn),
  start: fn => () => withContext.start(context)(draw)(fn),
  draw: fn => () => withContext.draw(context)(fn),
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

let init = single_init

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

const Block = MakeBlock(context, COLORS, drawBlock, N)
const Game = MakeGame(context, Block, blocks, N, direct, onetrue, stop, display_text, wins, init, null, drawBlock, drawVirus, copy, flip2by2)

function display_text(game, text) {
  let i
  if (game === 'all')
    for (i = 0; i < context.get(['games']).length; i++)
      context.get(['games'])[i].add_message(text)

  else
    context.get(['games'])[game].add_message(text)
}

const keyBindings = e => {
  let s = String.fromCharCode(e.which)
  if (e.which === 32) toggle()

  const keyP = _.when(_.equals('p'))
  keyP(toggle, s)

  let game = (init === two_p_init || init === single_with_bot_init) ? 1 : 0

  if (['4', 'j'].includes(s))
    context.get(['games'])[game].move('left')

  if (s === '6' || s === 'l')
    context.get(['games'])[game].move('right')

  if (s === '5' || s === 'k')
    context.get(['games'])[game].start_fastdrop()

  if (s === '8' || s === 'i')
    context.get(['games'])[game].flip()

  if (init === two_p_init) {
    if (s === 'a')
      context.get(['games'])[0].move('left')

    if (s === 'd')
      context.get(['games'])[0].move('right')

    if (s === 's')
      context.get(['games'])[0].start_fastdrop()

    if (s === 'w')
      context.get(['games'])[0].flip()
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
  //       context.get(['games'])[0].movable.speed = 10000;
  //    }
  //    if (String.fromCharCode(e.charCode) === '2'){
  //       context.get(['games'])[1].movable.speed = 10000;
  //    }
  //    if (String.fromCharCode(e.charCode) === '3'){
  //        punish(context.get(['games'])[0],[2,1]);
  //    }
  //    if (String.fromCharCode(e.charCode) === '4'){
  //        single_init(1);
  //        context.get(['games'])[0].falling.push(new Block(4, 2,context.get(['games'])[0].speed,[[1]]));
  //        context.get(['games'])[0].falling.push(new Block(4, 1,context.get(['games'])[0].speed,[[1]]));
  //        context.get(['games'])[0].falling.push(new Block(4, 0,context.get(['games'])[0].speed,[[1]]));
  //        context.get(['games'])[0].falling.push(new Block(4,-1,context.get(['games'])[0].speed,[[1]]));
  //    }
  //
  e.preventDefault()
}

window.addEventListener('keypress', keyBindings, false)

function copy_game_state(game_from, game_to) {
  game_to.state = copy(game_from.state)
  game_to.initial = copy(game_from.initial)
  game_to.virus = game_from.virus; + 1
}

const appendBlock = _.bind(blocks.push, blocks)
const createRandomBlocks =
  _.times(() => 1 + Math.floor(Math.random() * COLORS))
const initBlocks = _.compose(
  _.map(appendBlock),
  createRandomBlocks
)

function two_p_init(speed, level) {
  context.set(['games'], [])
  context.get(['games']).push(new Game(10, 16, speed || 8, level || 10, 0))
  context.get(['games']).push(new Game(10, 16, speed || 8, level || 10, 1))
  copy_game_state(context.get(['games'])[0], context.get(['games'])[1])
  initBlocks(10000)
}

function single_init(speed, level) {
  context.set(['games'], [])
  context.get(['games']).push(new Game(10, 16, speed || 8, level || 1, 0))
  initBlocks(10000)
}

function single_with_bot_init(speed = 20, level = 4) {
  context.set(['games'], [])
  context.get(['games']).push(BotGame(new Game(10, 16, speed, level, 0), random_algo))
  context.get(['games']).push(new Game(10, 16, speed, level, 1))

  copy_game_state(context.get(['games'])[0].game, context.get(['games'])[1])
  initBlocks(10000)
}

// const init_blocks =
//   _.times(() => 1 + Math.floor(Math.random() * COLORS))

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

/* ********************** init *********************** */

init()
start()
toggle()