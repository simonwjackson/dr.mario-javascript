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