export default (context, COLORS, drawBlock, N) => {

  function Block(x, y, speed, a) {
    this.x = x
    this.y = y
    this.neighbors = 0
    if (!a) {
      this.a = [
        [0, 0],
        [0, 0]
      ]
      this.a[1][1] = 1 + Math.floor(Math.random() * COLORS)
      this.a[0][1] = 1 + Math.floor(Math.random() * COLORS)
    }
    else {
      this.a = a
    }
    this.speed = speed || 20
  }

  Block.prototype.draw = function (blocksize) {
    let i, j
    for (i = 0; i < this.a.length; i++)
      for (j = 0; j < this.a[0].length; j++) {
        if (this.a[i][j] === 0)
          continue

        drawBlock( context.get(['arena']) )((this.x + i) * blocksize, (this.y + j) * blocksize, blocksize, context.get(['colors'])[this.a[i][j]], N[this.neighbors][i][j])
      }

  }

  return Block
}