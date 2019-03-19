import * as _ from '//cdn.jsdelivr.net/npm/ramda@latest/es/index.js'

export const stop = ({ set, get }) => fn =>
  set(['interval'], fn(get(['interval'])))

export const start = ({ set, get }) => draw => fn =>
  set(['interval'], fn(get(['FPS']), draw))

export const draw = ({ get }) => fn =>
  fn(get(['arena']), get(['games']), {
    width: get(['width']),
    height: get(['height']),
    background: get(['background']),
  })

export const drawVirus = ({ get }) => fn =>
  fn(get(['arena']))

export const toggle = ({ get }) => start => stop => display_text => draw =>
  fn =>
    fn(start, () => {
      stop()
      display_text('all', 'GAME PAUSED')
      draw()
    }, get(['interval']))