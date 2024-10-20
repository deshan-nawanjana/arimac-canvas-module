/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-loop-func */

// import packages
import * as THREE from "three"
import { useEffect, useRef, useState } from "react"
// import modules
import { AssetLoader } from "./modules/AssetLoader"
import { SceneLoader } from "./modules/SceneLoader"
import { EventLoader } from "./modules/EventLoader"
import { Tween } from "./modules/Tween"
// import objects
import assets from "./objects/assets.json"
import points from "./objects/points.json"
import setup from "./objects/setup.json"
// import style
import "./Canvas.css"

/** Simplify diamond index */
export const toIndex = index => {
  // return index inside array
  return ((index % 18) + 18) % 18
}

// helper to calculate ellipse point for diamonds
function getEllipsePoints(rotation = 0) {
  // get half diameters
  const a = setup.ellipse.diameters.major / 2
  const b = setup.ellipse.diameters.minor / 2
  // coordinates array
  const coordinates = []
  // angle step by diamond count
  const angleStep = (2 * Math.PI) / diamonds.length
  // covert rotation to radian
  const rotationRad = (Math.PI / 180) * (rotation + 10)
  // for each diamond
  for (let i = 0; i < diamonds.length; i++) {
    // get current diamond angle
    const angle = i * angleStep + rotationRad
    // calculate coordinates
    const x = setup.ellipse.center.x + a * Math.cos(angle)
    const z = setup.ellipse.center.y + b * Math.sin(angle)
    // push to coordinates
    coordinates.push({ x, z })
  }
  // return coordinates
  return coordinates
}

// create three modules
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, 45, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

// create tween
const tween = new Tween()
// diamonds array
const diamonds = []
// restore items
const restores = Array(9).fill(null)
// context data object
let contextData = {}

// current scrolling state
let isScrolling = false
// current snapping state
let isSnapping = false
// current scroll value
let scrollValue = 1000
// final scrolling value
let scrollFinal = 1000
// last scroll timeout
let scrollTimer = null
// current scroll direction
let scrollDirection = null

/** Arimac Canvas Context */
export const useCanvas = () => {
  // current item index
  const [index, setIndex] = useState(0)
  // current rotation index
  const [rotation, setRotation] = useState(17)
  // current item active state
  const [active, setActive] = useState(false)
  // module ready state
  const [isReady, setIsReady] = useState(false)
  // module locked state
  const [locked, setLocked] = useState(false)
  // scroll value
  const [scroll, setScroll] = useState(1000)
  /** Context options */
  return {
    /** Module ready state */
    isReady,
    /** Directly set ready state */
    setIsReady,
    /** Module locked state */
    locked,
    /** Directly set locked state */
    setLocked,
    /** Current item index */
    index,
    /** Current rotation index */
    rotation,
    /**
     * Increase or decrease index by given index offset
     * @param {number} offset 
     */
    addIndex: offset => locked || active || !isReady
      ? null : onWheel({ deltaY: offset * 200 * -1 }),
    /** Current item active state */
    active,
    /** Set active state for current item */
    setActive: state => locked || isScrolling || isSnapping
      ? null : setActive(state),
    /** Module locked state */
    scroll,
    /** Update scroll details */
    setScroll: (scroll, rotation) => {
      // update scroll value
      setScroll(scroll)
      // update diamond index
      setIndex(((rotation % 9) + 9) % 9)
      // update rotation index
      setRotation(rotation)
    },
  }
}

/** Wheel event listener */
const onWheel = event => {
  // return if busy or active
  if (!contextData || contextData.active) { return }
  if (contextData.locked || !contextData.isReady) { return }
  // include into scroll value
  scrollValue += event.deltaY
  // update scroll direction
  scrollDirection = event.deltaY > 0 ? "down" : "up"
  // set as scrolling
  isScrolling = true
  // rotate diamonds
  onRotate()
  // clear current timeout
  clearTimeout(scrollTimer)
  // set timeout to snap
  scrollTimer = setTimeout(() => {
    // set as not scrolling
    isScrolling = false
    // snap to close diamond
    onSnap()
  }, setup.wheel.snapDelay)
}

const rotX = points.moveable.map(item => item.rotation.x)
const rotY = points.moveable.map(item => item.rotation.y)
const rotZ = points.moveable.map(item => item.rotation.z)

// linear interpolation
function interpolate(array, factor) {
  factor = Math.max(0, Math.min(factor, 1))
  const index = factor * (array.length - 1)
  const lowIndex = Math.floor(index)
  const highIndex = Math.ceil(index)
  const t = index - lowIndex
  return (1 - t) * array[lowIndex] + t * array[highIndex]
}

// diamond lock points for interpolation
const locks = [
  -14.579712418677017,
  -12.557368354874356,
  -9.320420340454818,
  -4.959292078222206,
  0,
  4.959292078222206,
  9.320420340454818,
  12.557368354874356,
  14.579712418677017
]

// get diamond scale by position
const getScale = point => {
  const scale = (12.8 - Math.abs(point.x)) * 0.03
  return scale < 0.06 ? 0.06 : scale
}

// get diamond rotation by position
const getRotation = (point) => {
  // get diamond index position
  const index = locks.findIndex((_x, i) => (
    i > 0 && (locks[i - 1] <= point.x && locks[i] >= point.x)
  ))
  // calculate interpolate factor
  const piece = 1 / 9
  const a = locks[index - 1]
  const b = locks[index]
  const gap = b - a
  const crr = point.x - a
  const pre = (piece * index + (piece * (crr / gap)) - 0.03)
  const factor = pre || (point.x < 0 ? 0 : 1)
  // return interpolated coordinates
  return ({
    x: interpolate(rotX, factor),
    y: interpolate(rotY, factor),
    z: interpolate(rotZ, factor)
  })
}

const onRotate = () => {
  // return if not scrolling
  if (!isScrolling) { return }
  // get ellipse points
  const points = getEllipsePoints(scrollFinal * 0.1)
  // for each diamond
  for (let i = 0; i < diamonds.length; i++) {
    // current diamond
    const diamond = diamonds[i]
    // current point values
    const point = points[i]
    // set diamond visibility
    diamond.visible = point.z > -0.1
    // set diamond position
    diamond.position.x = point.x
    diamond.position.z = point.z
    const scale = getScale(point)
    diamond.scale.set(scale, scale, scale)
    const rotation = getRotation(point)
    diamond.rotation.y = rotation.y
    diamond.rotation.x = rotation.x
    diamond.rotation.z = rotation.z
  }
  // update scroll details
  if (contextData) {
    const current = toIndex(4 - Math.round(scrollFinal / 200))
    contextData.setScroll(scrollFinal, current)
  }
}

const onSnap = () => {
  // start snap
  isSnapping = true
  // set step size
  const step = setup.wheel.stepSize
  // calculate round up diamond position
  scrollValue = scrollDirection === "up"
    ? Math.ceil(scrollValue / step) * step
    : Math.floor(scrollValue / step) * step
  // update into final value
  scrollFinal = scrollValue
  // update scroll value
  if (contextData) { contextData.setScroll(scrollFinal) }
  // get ellipse points
  const points = getEllipsePoints(scrollValue * 0.1)
  // for each diamond
  for (let i = 0; i < diamonds.length; i++) {
    // current diamond
    const diamond = diamonds[i]
    // current point values
    const point = points[i]
    // get scale and rotation
    const scale = getScale(point)
    const rotation = getRotation(point)
    // animate diamond position
    const animation = tween.animateObject(diamond, {
      position: point,
      scale: { x: scale, y: scale, z: scale },
      rotation: rotation
    }, {
      easing: 'out-quad',
      duration: 500,
      onUpdate(data) {
        // abort animation if scrolling
        if (isScrolling) { animation.abort() }
        // set diamond visibility
        diamond.visible = data.position.z > -0.1
      },
      onComplete() {
        // reset snap state
        isSnapping = false
      }
    })
  }
  // update scroll details
  if (contextData) {
    const current = toIndex(4 - Math.round(scrollFinal / 200))
    contextData.setScroll(scrollFinal, current)
  }
}

const addScroll = offset => {
  // lock scroll
  isScrolling = true
  // return if locked
  if (contextData.locked) { return }
  // lock controls
  contextData.setLocked(true)
  // tween scroll values
  tween.animate({
    from: { scrollValue, scrollFinal },
    to: {
      scrollValue: scrollValue + offset,
      scrollFinal: scrollFinal + offset
    },
    easing: 'out-quad',
    duration: 500,
    onUpdate(data) {
      // update scroll values
      scrollValue = data.scrollValue
      scrollFinal = data.scrollFinal
      // animate rotation
      onRotate()
      // update scroll details
      if (contextData) {
        const current = toIndex(4 - Math.round(scrollFinal / 200))
        contextData.setScroll(scrollFinal, current)
      }
    },
    onComplete() {
      // release scroll
      isScrolling = false
      // unlock controls
      contextData.setLocked(false)
      // snap to close diamond
      onSnap()
    }
  })
}

/** Initiate canvas module */
const onInit = async () => {
  // load all assets
  await AssetLoader.loadAll(assets)
  // load lights into scene
  scene.add(...SceneLoader.loadLights())
  // append diamonds into array
  diamonds.push(...SceneLoader.loadModels(assets, points, setup))
  // set event loader objects
  EventLoader.objects = diamonds.map(item => item.meshes.idle)
  // set camera on event loader
  EventLoader.camera = camera
  // set camera position
  camera.position.set(...Object.values(setup.camera.position))
  camera.rotation.set(...Object.values(setup.camera.rotation))
  // load models into scene
  scene.add(...diamonds)
  // animate scene
  renderer.setAnimationLoop(() => {
    // update final scroll value
    scrollFinal += (scrollValue - scrollFinal) * setup.wheel.factor
    // update diamond rotations
    onRotate()
    // update tween
    tween.update()
    // render scene
    renderer.render(scene, camera)
  })
}

/** Resize renderer and camera */
const onResize = () => {
  // get dimensions
  const width = window.innerWidth
  const height = window.innerHeight
  // update camera and renderer
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

/** Click callback event */
EventLoader.onClick = object => {
  // return if locked or active
  if (contextData.locked || contextData.active) { return }
  // return if scrolling
  if (isScrolling) { return }
  // get diamond outer mesh
  const diamond = object.parent.parent
  // blur diamond
  EventLoader.onBlur(diamond.meshes.idle)
  // check diamond position
  if (diamond.index === contextData.rotation) {
    // active diamond
    contextData.setActive(true)
  } else {
    // get diamond index offset
    const offset = diamond.index - contextData.rotation
    // animate to scroll point
    if (Math.abs(offset) <= 4) {
      addScroll(offset * 200 * -1)
    } else if (offset > 0) {
      addScroll((offset - 18) * 200 * -1)
    } else {
      addScroll((offset + 18) * 200 * -1)
    }
  }
}

// current glow state
let isGlowing = false

/** Focus callback event */
EventLoader.onFocus = object => {
  // return if locked or active
  if (contextData.active || contextData.locked) { return }
  // return if glowing
  if (isGlowing) { return } else { isGlowing = true }
  // update cursor
  document.body.style.cursor = "pointer"
  // get diamond meshes
  const meshes = object.parent.parent.meshes
  // scale up diamond
  tween.animateAllObjects([
    { target: meshes.inner, to: points.hover.focus },
    { target: meshes.idle.material, to: { opacity: 0 } },
    { target: meshes.glow.material, to: { opacity: 1 } }
  ], {
    duration: 300,
    easing: "out-cubic"
  })
}

/** Focus callback event */
EventLoader.onBlur = object => {
  // reset glowing state
  isGlowing = false
  // get diamond meshes
  const meshes = object.parent.parent.meshes
  // update cursor
  document.body.style.cursor = ""
  // scale up diamond
  tween.animateAllObjects([
    { target: meshes.inner, to: points.hover.blur },
    { target: meshes.idle.material, to: { opacity: 1 } },
    { target: meshes.glow.material, to: { opacity: 0 } }
  ], {
    duration: 300,
    easing: "out-cubic"
  })
}

/** Float diamond animation loop */
const onFloat = () => {
  // method to float
  const float = (mesh, direction = 1) => {
    tween.animateObject(mesh, {
      position: { y: 0.25 * direction }
    }, {
      duration: 800,
      easing: "in-out-sine",
      onComplete() { float(mesh, direction * -1) }
    })
  }
  // for each item
  for (let i = 0; i < diamonds.length; i++) {
    // current item
    setTimeout(() => {
      float(diamonds[i].meshes.inner)
    }, i * 350)
  }
}

/** Change active state of diamond */
const activeDiamond = context => {
  // return if not ready
  if (!context || !context.isReady) { return }
  // set locked state
  context.setLocked(true)
  // switch by active state
  if (context.active) {
    // for each diamond
    for (let i = 0; i < 9; i++) {
      // get current diamond index
      const index = toIndex(context.rotation + (i < 4 ? 4 - i : i > 4 ? 4 - i : 0))
      // get diamond by index
      const diamond = diamonds[index]
      // set restore data
      restores[i] = {
        index,
        points: {
          position: {
            x: diamond.position.x,
            y: diamond.position.y,
            z: diamond.position.z
          },
          rotation: {
            x: diamond.rotation.x,
            y: diamond.rotation.y,
            z: diamond.rotation.z
          }
        }
      }
    }
    // for each diamond
    for (let i = 0; i < restores.length; i++) {
      // current diamond
      const diamond = diamonds[restores[i].index]
      // animate diamond position
      tween.animateObject(diamond, points.selected[i], {
        duration: 800,
        easing: 'out-cubic'
      })
    }
    // get active diamond meshes
    const meshes = diamonds[restores[4].index].meshes
    // switch to broken diamond
    meshes.idle.visible = false
    meshes.glow.visible = false
    meshes.top.visible = true
    meshes.bottom.visible = true
    // animate broken pieces opening
    tween.animateAllObjects([
      { target: meshes.top, to: points.broken.top },
      { target: meshes.bottom, to: points.broken.bottom }
    ], {
      duration: 800,
      easing: 'out-cubic',
      onComplete() {
        context.setLocked(false)
      }
    })
  } else {
    // for each current diamond
    for (let i = 0; i < restores.length; i++) {
      // current diamond
      const diamond = diamonds[restores[i].index]
      // animate diamond position
      tween.animateObject(diamond, restores[i].points, {
        duration: 800,
        easing: 'out-cubic'
      })
    }
    // get active diamond meshes
    const meshes = diamonds[restores[4].index].meshes
    // animate broken diamond pieces closing
    tween.animateAllObjects([
      { target: meshes.top, to: points.broken.reset },
      { target: meshes.bottom, to: points.broken.reset }
    ], {
      duration: 800,
      easing: 'out-cubic',
      onComplete() {
        // switch to full diamond
        meshes.idle.visible = true
        meshes.glow.visible = true
        meshes.top.visible = false
        meshes.bottom.visible = false
        context.setLocked(false)
      }
    })
  }
}

/** Arimac canvas component */
export default function Canvas({ context }) {
  // initiated reference
  const isInit = useRef(false)
  // effect on mount
  useEffect(() => {
    // return if initiated
    if (isInit.current) { return }
    // set initiated state
    isInit.current = true
    // initiate module
    onInit().then(() => {
      // initial resize
      onResize()
      // initial float
      onFloat()
      // initial positions
      onSnap()
      // add event listeners
      window.addEventListener("wheel", onWheel)
      window.addEventListener("resize", onResize)
      window.addEventListener("click", EventLoader.trigger)
      window.addEventListener("mousemove", EventLoader.trigger)
      // get container element
      const container = document.querySelector(".arimac-web-canvas")
      // set canvas class names
      renderer.domElement.classList.add("arimac-web-canvas-source")
      // append canvases
      if (container) { container.appendChild(renderer.domElement) }
      // set ready state
      context.setIsReady(true)
    })
    return () => {
      // remove event listeners
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("click", EventLoader.trigger)
      window.removeEventListener("mousemove", EventLoader.trigger)
    }
  }, [])
  // effect on active change
  useEffect(() => activeDiamond(context), [context.active])
  // effect on context change
  useEffect(() => { contextData = context }, [context])
  // container dom
  return (
    <div className="arimac-web-canvas" data-active={context.active}>
      <div className="arimac-web-canvas-patch up" />
      <div className="arimac-web-canvas-patch down" />
      <div className="arimac-web-canvas-blur" />
    </div>
  )
}
