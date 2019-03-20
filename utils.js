import  * as _  from '//cdn.jsdelivr.net/npm/ramda@latest/es/index.js'

const mapI = _.addIndex(_.map)
const isPaused = _.isNil
export const stop = interval => clearInterval(interval)
export const start = _.curry((FPS, draw) => setInterval(draw, 1000 / FPS))
export const toggle = _.curry((on, off, paused) => _.ifElse(
  isPaused,
  on,
  off
)(paused))

export const draw = _.curry((arena, games, { width, height, background }) => {
  arena.clearRect(0, 0, width, height)
  arena.fillStyle = background
  arena.fillRect(0, 0, width, height)

  mapI((game, index) => {
    arena.save()
    arena.translate(30 + index * 240, 30)
    game.tick()
    game.draw()
    arena.restore()
  }, games)
})

export const drawVirus = arena => i => j => blocksize => {
  arena.save()
  arena.translate((i + 1 / 2) * blocksize, (j + 1 / 2) * blocksize)
  //arena.scale(blocksize, blocksize);
  arena.strokeStyle = '#000000'
  arena.fillStyle = '#000000'
  arena.beginPath()
  arena.arc(3, -1, blocksize / 9, 0, Math.PI * 2, true)
  arena.fill()
  arena.beginPath()
  arena.arc(-3, -1, blocksize / 9, 0, Math.PI * 2, true)
  arena.fill()
  arena.beginPath()
  arena.arc(0, 6, blocksize / 9, 0, Math.PI, true)
  arena.fill()
  arena.restore()
}

//Matrix operations

export const copy = a => {
  let n = [], i, j

  for (i = 0; i < a.length; i++) {
    n[i] = []
    for (j = 0; j < a[0].length; j++)
      n[i][j] = a[i][j]

  }
  return n
}

export const eq = (a, b) => {
  let i, j
  for (i = 0; i < a.length; i++)
    for (j = 0; j < a[0].length; j++)
      if (a[i][j] !== b[i][j])
        return false

  return true
}

export const flip2by2 = a => {
  const b = _.clone(a)
  const t = b[0][0]
  b[0][0] = b[0][1]
  b[0][1] = b[1][1]
  b[1][1] = b[1][0]
  b[1][0] = t
  return b
}

export const onetrue = l => {
  let i = 0
  while (i < l.length) {
    if (l[i])
      return true

    i += 1
  }
  return false
}

export const direct = (x, y, n) => {
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

export const inList = (a, L, eq) => {
  let i
  for (i = 0; i < L.length; i++)
    if (eq(L[i], a))
      return true

  return false
}

export const set_drop_state = (goalx, current_state, colors, orientation) => {
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

export const analyze_state = state => {
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

export const get_drop_colors = drop_state => {
  let n = [],
    i, j, a = drop_state
  for (i = 0; i < a.length; i++)
    for (j = 0; j < a[0].length; j++)
      if (a[i][j] !== 0)
        n.push(a[i][j])

  return n
}

export const single_in_list = (c, stateinfo) => {
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

export const pair_in_list = (p, stateinfo) => {
  let i, s, l = stateinfo.tops.length,
    offset = Math.floor(l / 2)
  for (i = 0; i < l - 1; i++) {
    s = (i + offset) % l
    if (p[0] === stateinfo.tops[s] && p[1] === stateinfo.tops[s + 1] && stateinfo.heights[s] > 3 && stateinfo.heights[s + 1] > 3)
      return s

  }
  return -1
}

//assume possitive L
export const max = L => {
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

//input state & falling state, output: desired position and rotation
export const random_algo = (state, drop_state) => {
  let x = state.length
  let new_state = copy(drop_state)
  let i
  let l

  for (i = 0, l = Math.random() * 2; i < l; i++)
    new_state = flip2by2(new_state)

  return [Math.floor(Math.random() * x), new_state]
}

export const better_algo = (state, drop_state) => {
  let stateinfo = analyze_state(state)
  // top_color = stateinfo.tops,
  // heights = stateinfo.heights,
  let colors = get_drop_colors(drop_state)
  let x = 0

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