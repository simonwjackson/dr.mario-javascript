import { eq } from './utils.js'

export default (game, algo, botspeed = 5) => {
  let goal
  let movable

  const tick = () => {
    let t
    game.tick()
    // if there is movable and no goal or if there is a movable but the bot's movable is old
    if (game.movable && (!goal || movable !== game.movable)) {
      t = algo(game.state, game.movable.a)
      goal = {
        pos: t[0],
        state: t[1]
      }
      movable = game.movable
    }
    if (game.ticks % botspeed === 0)
      chase_goal()

  }

  const draw = () => {
    game.draw()
  }

  const add_message = text => {
    game.messages.push(text)
  }

  const get_punish = (colors_list) => {
    game.get_punish(colors_list)
  }

  const chase_goal = () => {
    if (!game.movable)
      return

    if (!eq(goal.state, game.movable.a)) {
      game.flip()
      return
    }

    if (goal.pos < game.movable.x) {
      game.move('left')
      return
    }
    if (goal.pos > game.movable.x) {
      game.move('right')
      return
    }
    if (typeof fast_drop === undefined) {
      game.start_fastdrop()
      return
    }
  }

  return {
    goal,
    movable,
    tick,
    draw,
    add_message,
    get_punish,
    chase_goal,
    game
  }
}