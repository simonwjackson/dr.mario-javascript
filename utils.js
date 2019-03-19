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