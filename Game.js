import * as _ from '//cdn.jsdelivr.net/npm/ramda@latest/es/index.js'

export default (context, Block, blocks, N, direct, onetrue, stop, display_text, wins, init, game_to, drawBlock, drawVirus, copy, flip2by2) => {
  function Game(x, y, speed, level, index) {
    this.index = index
    this.state = []
    this.initial = []
    this.neighbors = []
    // 0 - no neighbor, u,r,d,l = 1,2,3,4
    this.x = x
    this.y = y
    this.ticks = 0
    this.blocks_index = 0
    this.speed = speed
    this.live = false
    this.init_state(level || 10)
    this.falling = []
    this.punish_list = []
    this.lines_in_this_move = []
    this.messages = []
  }

  Game.prototype.flip = function () {
    this.movable = _.defaultTo({}, this.movable)
    const { x, y } = _.pickAll(['x', 'y'], this.movable)

    const flip = _.compose(
      flip2by2,
      copy
    )

    const a = _.compose(
      _.unless(_.isEmpty, flip),
      _.defaultTo([]),
      _.prop('a')
    )(this.movable)

    const hasCollision = !this.collision(a, x, y)

    if (hasCollision) {
      this.movable.a = a
      this.movable.neighbors = (this.movable.neighbors + 1) % 4
    }
  }

  Game.prototype.draw = function () {
    let i, j
    for (i = 0; i < this.x; i++)
      for (j = 0; j < this.y; j++) {
        if (this.state[i][j] === 0)
          continue

        if (this.state[i][j] === -1)
          context.get(['arena']).fillStyle = context.get(['colors'])[0]

        drawBlock( context.get(['arena']) )(i * context.get(['blocksize']), j * context.get(['blocksize']), context.get(['blocksize']), context.get(['colors'])[this.state[i][j]], this.neighbors[i][j])
        //context.get(['arena']).fillRect(i * context.get(['blocksize']), j * context.get(['blocksize']), context.get(['blocksize']), context.get(['blocksize']));
        if (this.initial[i][j] === 1)
          drawVirus(context.get(['arena']))(i)(j)(context.get(['blocksize']))

      }

    for (i = 0; i < this.falling.length; i++)
      this.falling[i].draw(context.get(['blocksize']))

    context.get(['arena']).strokeRect(0, 0, this.x * context.get(['blocksize']), this.y * context.get(['blocksize']))
    this.drawChrome()
    this.display_messages()
  }

  Game.prototype.line_test = function (ist, jst) {
    let col, i = ist,
      j = jst - 1
    if (j >= 0 && this.state[i][j] !== 0) {
      while (j > 0 && this.state[i][j] === this.state[i][j - 1])
        j -= 1

      if (jst - j > 2)
        return true

    }
    i = ist - 1
    j = jst
    if (i >= 0 && this.state[i][j] !== 0) {
      while (i > 0 && this.state[i][j] === this.state[i - 1][j])
        i -= 1

      if (ist - i > 2)
        return true

    }
    return false
  }

  Game.prototype.init_state = function (level) {
    let i, j, n
    this.virus = 0
    for (i = 0; i < this.x; i++) {
      this.state[i] = []
      this.initial[i] = []
      this.neighbors[i] = []
      for (j = 0; j < this.y; j++) {
        this.neighbors[i][j] = 0
        if (j < this.y - level || this.line_test(i, j)) {
          this.state[i][j] = this.initial[i][j] = 0
        }
        else {
          this.state[i][j] = Math.floor(Math.random() * (context.get(['colors']).length + 1))
          if (this.state[i][j] >= context.get(['colors']).length)
            this.state[i][j] = 0

          if (this.state[i][j] !== 0) {
            this.initial[i][j] = 1
            this.virus += 1
          }
          else {
            this.initial[i][j] = 0
          }
        }
      }
    }
  }

  Game.prototype.tick = function () {
    let i, obj, to_be_removed = []
    for (i = 0; i < this.falling.length; i++) {
      obj = this.falling[i]
      if ((this.ticks % obj.speed) === 0)
        if (this.dropdown(obj)) {
          to_be_removed.push(i)
        }

    }
    for (i = to_be_removed.length - 1; i >= 0; i--)
      this.falling.splice(to_be_removed[i], 1)

    if (this.markedtime && this.ticks - this.markedtime > 20) {
      this.delmarked()
      this.markedtime = undefined
      this.orphans()
    }
    if (!this.markedtime && this.falling.length === 0)
      if (this.punish_list.length !== 0) {
        this.next_punish()
      }
      else {
        if (this.lines_in_this_move.length > 1)
          this.set_punish(this.lines_in_this_move)

        this.new_movable()
      }

    if (this.dead)
      this.game_over()

    if (this.virus == 0)
      this.victory()

    this.ticks += 1
  }

  Game.prototype.next_punish = function () {
    let L = this.punish_list.splice(0, 1)[0],
      pos, o, i
    switch (L.length) {
    case 2:
      o = 4
      break
    case 3:
      o = 2
      break
    case 4:
      o = 2
      break
    case 5:
      o = 2
      break
    default:
      o = 0
      break
    }
    pos = Math.floor(Math.random() * (this.x - (o * (L.length - 1) + 1)))
    for (i = 0; i < L.length; i++) {
      this.falling.push(new Block(pos, -1, this.speed, [
        [L[i]]
      ]))
      pos += o
    }
  }

  Game.prototype.new_movable = function () {
    this.movable = new Block(Math.floor(this.x / 2) - 1, -1, this.speed, [
      [0, blocks[this.blocks_index]],
      [0, blocks[this.blocks_index + 1]]
    ])
    this.blocks_index += 2
    this.falling.push(this.movable)
    this.lines_in_this_move = []
  }

  Game.prototype.collision = function (a, x, y) {
    let i, j
    for (i = 0; i < a.length; i++)
      for (j = 0; j < a[0].length; j++) {
        if (y + j < 0)
          continue

        if ((a[i][j] !== 0 && this.state[x + i][y + j] !== 0) || (y + j >= this.y))
          return true

      }

    return false
  }

  Game.prototype.copy = function (obj) {
    let i, j, a = obj.a,
      x = obj.x,
      y = obj.y,
      newones = []
    for (i = 0; i < a.length; i++)
      for (j = 0; j < a[0].length; j++) {
        if (a[i][j] === 0)
          continue

        if (j + y === 0) {
          this.dead = true
          return []
        }
        this.state[i + x][j + y] = a[i][j]
        if (obj.neighbors !== undefined)
          this.neighbors[i + x][j + y] = N[obj.neighbors][i][j]

        newones.push([i + x, j + y])
      }

    return newones
  }

  Game.prototype.mark_for_deletion = function (i, j) {
    this.state[i][j] = -1
    if (this.neighbors[i][j] !== 0) {
      let n = direct(i, j, this.neighbors[i][j])
      this.neighbors[n[0]][n[1]] = 0
      this.neighbors[i][j] = 0
    }
  }

  Game.prototype.mark = function (ist, jst) {
    let k, col = this.state[ist][jst],
      cd = 0,
      cu = 0,
      cl = 0,
      cr = 0,
      cmarked = [],
      i = ist,
      j = jst + 1
    while (j < this.y && this.state[i][j] === col) {
      cd += 1
      j += 1
    }
    i = ist
    j = jst - 1
    while (j > -1 && this.state[i][j] === col) {
      cu += 1
      j -= 1
    }
    if (cu + cd >= 3 && col !== 0 && col !== -1) {
      for (k = -cu; k <= cd; k++)
        this.mark_for_deletion(ist, jst + k)

      cmarked.push(col)
    }
    i = ist + 1
    j = jst
    while (i < this.x && this.state[i][j] === col) {
      cr += 1
      i += 1
    }
    i = ist - 1
    j = jst
    while (i > -1 && this.state[i][j] === col) {
      cl += 1
      i -= 1
    }
    if (cl + cr >= 3 && col !== 0 && col !== -1) {
      for (k = -cl; k <= cr; k++)
        this.mark_for_deletion(ist + k, jst)

      cmarked.push(col)
    }
    this.lines_in_this_move.push.apply(this.lines_in_this_move, cmarked)
    return cmarked.length !== 0
  }

  Game.prototype.start_fastdrop = function () {
    if (this.movable && !this.movable.fast_drop) {
      this.movable.speed = 1
      this.movable.fast_drop = true
    }
  }

  Game.prototype.orphans = function () {
    let i, j, n, y, x, new_block
    for (i = 0; i < this.x; i++)
      for (j = this.y - 1; j >= 0; j--) {
        if (this.initial[i][j] === 1 || this.state[i][j] === 0 || this.state[i][j] === -1)
          continue

        if (this.neighbors[i][j] === 0) {
          if (this.state[i][j + 1] === 0) {
            this.falling.push(new Block(i, j, this.speed, [
              [this.state[i][j]]
            ]))
            this.state[i][j] = 0
          }
        }
        else {
          n = direct(i, j, this.neighbors[i][j])
          if (n[0] === i) {
            y = n[1] > j ? n[1] : j
            if (this.state[i][y + 1] === 0) {
              new_block = new Block(i, y - 1, this.speed, [
                [this.state[i][y - 1], this.state[i][y]],
                [0, 0]
              ])
              new_block.neighbors = 1
              this.falling.push(new_block)
              this.state[i][y] = 0
              this.state[i][y - 1] = 0
            }
          }
          else {
            x = n[0] < i ? n[0] : i
            if (this.state[x][j + 1] === 0 && this.state[x + 1][j + 1] === 0) {
              new_block = new Block(x, j, this.speed, [
                [this.state[x][j], 0],
                [this.state[x + 1][j], 0]
              ])
              new_block.neighbors = 2
              this.falling.push(new_block)
              this.state[x][j] = 0
              this.state[x + 1][j] = 0
            }
          }
        }
      }

  }

  Game.prototype.dropdown = function (obj) {
    let newones, that = this
    if (!this.collision(obj.a, obj.x, obj.y + 1)) {
      obj.y += 1
      return false
    }
    else {
      if (this.movable === obj)
        this.movable = undefined

      newones = this.copy(obj)
      newones = newones.map(function (a) {
        return that.mark(a[0], a[1])
      })
      if (onetrue(newones))
        this.markedtime = this.ticks

      return true
    }
  }

  Game.prototype.move = function (dir) {
    let i, j, x, y, pos, obj, good, a
    if (this.movable) {
      obj = this.movable
      a = obj.a
    }
    else {
      return
    }
    dir = dir === 'right' ? 1 : -1
    good = true
    for (i = 0; i < a.length; i++)
      for (j = 0; j < a[0].length; j++) {
        if (a[i][j] === 0)
          continue

        x = obj.x + i + dir
        y = obj.y + j
        if (x < 0 || x >= this.x || this.state[x][y] !== 0) {
          good = false
          break
        }
      }

    if (good)
      obj.x += dir

  }

  Game.prototype.game_over = function () {
    let i = this.index
    let other = (i + 1) % 2

    stop(context)
    display_text(i, 'You lose')

    if (context.get(['games']).length > 1) {
      display_text(other, 'You win')
      wins[other] += 1
    }

    init()
  }

  Game.prototype.victory = function () {
    let i = this.index,
      other = (i + 1) % 2
    stop(context)
    display_text(i, 'You win')
    if (context.get(['games']).length > 1)
      display_text(other, 'You lose')

    wins[i] += 1
    init()
  }

  Game.prototype.get_punish = function (colors_list) {
    this.punish_list.push(colors_list)
  }

  Game.prototype.set_punish = function (colors_list) {
    let i
    if (context.get(['games']).length === 1)
      return

    // hack this should be somewhere else
    if (this.index === undefined)
      this.index = context.get(['games']).indexOf(this)

    i = this.index
    game_to = context.get(['games'])[(i + 1) % 2]
    game_to.get_punish(colors_list)
  }

  return (x, y, speed, level, index) => {
    const game = new Game(x, y, speed, level, index)

    const add_message = text => game.messages.push(text)

    const display_messages = () => {
      if (game.messages.length !== 0) {
        const arena = context.get(['arena'])

        arena.fillStyle = '#000000'
        arena.font = '20pt helvetica'
        arena.textAlign = 'center'
        arena.fillText(game.messages.splice(0, 1), 100, 100)
      }
    }

    const delmarked = () => {
      let i, j

      for (i = 0; i < game.x; i++)
        for (j = 0; j < game.y; j++)
          if (game.state[i][j] === -1) {
            game.state[i][j] = 0
            if (game.initial[i][j] === 1) {
              game.initial[i][j] = 0
              game.virus -= 1
            }
          }
    }

    const drawChrome = level => {
      const arena = context.get(['arena'])
      const blocksize = context.get(['blocksize'])
      const colors = context.get(['colors'])

      arena.fillStyle = '#000000'
      arena.font = '10pt helvetica'
      arena.textalign = 'left'
      arena.fillText('Virus: ' + game.virus, 0, game.y * blocksize + 20)
      arena.fillText('Wins: ' + wins[game.index], 150, game.y * blocksize + 20)
      arena.fillText('Next: ', 45, -10)
      arena.save()
      arena.translate(blocksize * (Math.floor(game.x / 2) - 1), -25)
      drawBlock( arena )(0, 0, blocksize, colors[blocks[game.blocks_index]], 2)
      drawBlock( arena )(blocksize, 0, blocksize, colors[blocks[game.blocks_index + 1]], 4)
      context.get(['arena']).restore()
    }

    return {
      add_message,
      display_messages,
      delmarked,
      drawChrome,

      blocks_index :  game.blocks_index,
      collision: game.collision,
      copy: game.copy,
      draw: game.draw,
      dropdown: game.dropdown,
      falling : game.falling,
      flip: game.flip,
      game_over: game.game_over,
      get_punish: game.get_punish,
      index : game.index,
      init_state: game.init_state,
      initial : game.initial,
      line_test: game.line_test,
      lines_in_this_move : game.lines_in_this_move,
      live :  game.live,
      mark_for_deletion: game.mark_for_deletion,
      mark: game.mark,
      messages : game.messages,
      move: game.move,
      neighbors : game.neighbors,
      new_movable: game.new_movable,
      next_punish: game.next_punish,
      orphans: game.orphans,
      punish_list : game.punish_list,
      set_punish: game.set_punish,
      speed : game.speed,
      start_fastdrop: game.start_fastdrop,
      state : game.state,
      tick: game.tick,
      ticks: game.ticks,
      victory: game.victory,
      x: game.x,
      y: game.y,
    }
  }
}
