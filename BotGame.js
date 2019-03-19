export default (eq) => {
  function BotGame (game, algo, botspeed) {
    this.algo = algo
    this.game = game
    this.botspeed = botspeed || 5
  }

  BotGame.prototype.tick = function () {
    let t
    this.game.tick()
    // if there is movable and no goal or if there is a movable but the bot's movable is old
    if (this.game.movable && (!this.goal || this.movable !== this.game.movable)) {
      t = this.algo(this.game.state, this.game.movable.a)
      this.goal = {
        pos: t[0],
        state: t[1]
      }
      this.movable = this.game.movable
    }
    if (this.game.ticks % this.botspeed === 0)
      this.chase_goal()

  }

  BotGame.prototype.draw = function () {
    this.game.draw()
  }

  BotGame.prototype.add_message = function (text) {
    this.game.messages.push(text)
  }

  BotGame.prototype.get_punish = function (colors_list) {
    this.game.get_punish(colors_list)
  }

  BotGame.prototype.chase_goal = function () {
    if (!this.game.movable)
      return

    if (!eq(this.goal.state, this.game.movable.a)) {
      this.game.flip()
      return
    }

    if (this.goal.pos < this.game.movable.x) {
      this.game.move('left')
      return
    }
    if (this.goal.pos > this.game.movable.x) {
      this.game.move('right')
      return
    }
    if (!this.fast_drop) {
      this.game.start_fastdrop()
      return
    }
  }

  return BotGame
}