// method to get values from object
export const getObjectValues = (object, input) => {
  // output object
  const output = {}
  // method to recursive get
  const get = (obj, inp, out) => {
    // get state keys
    const keys = Object.keys(inp)
    // for each key
    for (let i = 0; i < keys.length; i++) {
      // current key
      const key = keys[i]
      // check node type
      if (typeof inp[key] === 'object') {
        // create output node
        out[key] = {}
        // recursive get
        get(obj[key], inp[key], out[key])
      } else {
        // set output from object
        out[key] = obj[key]
      }
    }
  }
  // recursive get
  get(object, input, output)
  // return output
  return output
}

// method to set values on object
export const setObjectValues = (object, input) => {
  // method to recursive set
  const set = (obj, inp) => {
    // set state keys
    const keys = Object.keys(inp)
    // for each key
    for (let i = 0; i < keys.length; i++) {
      // current key
      const key = keys[i]
      // check node type
      if (typeof inp[key] === 'object') {
        // recursive set
        set(obj[key], inp[key])
      } else {
        // set object value
        obj[key] = inp[key]
      }
    }
  }
  // recursive set
  set(object, input)
}

// easings constants
const pow = (x, y) => Math.pow(x, y)
const sqrt = x => Math.sqrt(x)
const sin = x => Math.sin(x)
const cos = x => Math.cos(x)
const pi = Math.PI

// easings functions
const easings = {
  'in-sine': x => 1 - cos((x * pi) / 2),
  'out-sine': x => sin((x * pi) / 2),
  'in-out-sine': x => -(cos(pi * x) - 1) / 2,
  'in-quad': x => x * x,
  'out-quad': x => 1 - (1 - x) * (1 - x),
  'in-out-quad': x => x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2,
  'in-cubic': x => x * x * x,
  'out-cubic': x => 1 - pow(1 - x, 3),
  'in-out-cubic': x => x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2,
  'in-quart': x => x * x * x * x,
  'out-quart': x => 1 - pow(1 - x, 4),
  'in-out-quart': x => x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2,
  'in-quint': x => x * x * x * x * x,
  'out-quint': x => 1 - pow(1 - x, 5),
  'in-out-quint': x => x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2,
  'in-expo': x => x === 0 ? 0 : pow(2, 10 * x - 10),
  'out-expo': x => x === 1 ? 1 : 1 - pow(2, -10 * x),
  'in-out-expo': x => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2,
  'in-circ': x => 1 - sqrt(1 - pow(x, 2)),
  'out-circ': x => sqrt(1 - pow(x - 1, 2)),
  'in-out-circ': x => x < 0.5 ? (1 - sqrt(1 - pow(2 * x, 2))) / 2 : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2,
  'in-back': x => 2.70158 * x * x * x - 1.70158 * x * x,
  'out-back': x => 1 + 2.70158 * pow(x - 1, 3) + 1.70158 * pow(x - 1, 2),
  'in-out-back': x => x < 0.5 ? (pow(2 * x, 2) * ((2.5949095 + 1) * 2 * x - 2.5949095)) / 2 : (pow(2 * x - 2, 2) * ((2.5949095 + 1) * (x * 2 - 2) + 2.5949095) + 2) / 2
}

// animate props
const _animate = {
  from: {},
  to: {},
  duration: 100,
  easing: 'out-sine',
  onStart: () => { },
  onUpdate: () => { },
  onComplete: () => { }
}

const _animateObject = {
  duration: 100,
  easing: 'out-sine',
  onStart: () => { },
  onUpdate: () => { },
  onComplete: () => { }
}

// tween class
class Tween {
  // constructor
  constructor() {
    // animation queue
    this.queue = []
    // time stamp
    this.stamp = performance.now()
  }
  // method to update
  update() {
    // update time stamp
    this.stamp = performance.now()
    // filter completed and aborted items
    this.queue = this.queue.filter(item => !item.completed && !item.aborted)
    // for each item in queue
    for (let i = 0; i < this.queue.length; i++) {
      // current item
      const item = this.queue[i]
      // get current time
      const time = this.stamp - item.stamp
      // check for completed items
      if (time < item.duration) {
        // get current frame
        const frame = easings[item.easing](time / item.duration)
        // method to recursive update
        const update = (from, to, current) => {
          // get state keys
          const keys = Object.keys(from)
          // for each key
          for (let i = 0; i < keys.length; i++) {
            // current key
            const key = keys[i]
            // check node type
            if (typeof from[key] === 'object') {
              // recursive update
              update(from[key], to[key], current[key])
            } else {
              // current gap
              const gap = to[key] - from[key]
              // update value
              current[key] = from[key] + (gap * frame)
            }
          }
        }
        // recursive update
        update(item.from, item.to, item.current)
        // update callback
        item.onUpdate(Object.assign({}, item.current))
      } else {
        // set completed flag
        item.completed = true
        // last update callback
        item.onUpdate(Object.assign({}, item.to))
        // completed callback
        item.onComplete(Object.assign({}, item.to))
      }
    }
  }
  // method to animate
  animate(input = _animate) {
    // clone current states
    input.current = getObjectValues(input.from, input.to)
    // set time stamp
    input.stamp = performance.now()
    // default easing
    if (typeof input.easing !== 'string') { input.easing = 'out-sine' }
    // default callbacks
    if (typeof input.onStart !== 'function') { input.onStart = () => { } }
    if (typeof input.onUpdate !== 'function') { input.onUpdate = () => { } }
    if (typeof input.onComplete !== 'function') { input.onComplete = () => { } }
    // start callback
    input.onStart(Object.assign({}, input.current))
    // first update callback
    input.onUpdate(Object.assign({}, input.from))
    // push to queue
    this.queue.push(input)
    // return methods object
    return ({
      abort() {
        input.aborted = true
      }
    })
  }
  // method to animate object
  animateObject(target, to = {}, options = _animateObject) {
    // get target source
    const source = target.source || target
    // animate object
    return this.animate({
      // get from states
      from: getObjectValues(source, to),
      // to states
      to: to,
      // duration
      duration: options.duration,
      // easing function
      easing: options.easing,
      // update callback
      onUpdate: data => {
        // update object
        setObjectValues(source, data)
        // update callback
        if (typeof options.onUpdate === 'function') {
          options.onUpdate(data)
        }
      },
      // start callback
      onStart: options.onStart,
      // complete callback
      onComplete: options.onComplete
    })
  }
  // method to animate multiple objects
  animateAllObjects(inputs = [], options = _animateObject) {
    return inputs.map(input => (
      this.animateObject(input.target, input.to, options)
    ))
  }
}

export { Tween }