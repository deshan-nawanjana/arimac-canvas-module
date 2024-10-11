// import packages
import * as THREE from "three"
import { useEffect, useRef, useState } from "react"
// import modules
import { AssetLoader } from "./modules/AssetLoader"
import { SceneLoader } from "./modules/SceneLoader"
import { EventLoader } from "./modules/EventLoader"
import { GalaxyLoader } from "./modules/GalaxyLoader"
import { Tween } from "./modules/Tween"
// import objects
import assets from "./objects/assets.json"
import points from "./objects/points.json"
import setup from "./objects/setup.json"
// import style
import "./Canvas.css"

// helper to simplify index
export const toIndex = index => {
  // return index inside array
  return ((index % 9) + 9) % 9
}

/** Arimac Canvas Context */
export const useCanvas = () => {
  // current item index
  const [index, setIndex] = useState(0)
  // current item active state
  const [active, setActive] = useState(false)
  // module ready state
  const [isReady, setIsReady] = useState(false)
  // module locked state
  const [locked, setLocked] = useState(false)
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
    /** Directly set item index */
    setIndex: index => locked || active
      ? null : setIndex(toIndex(index)),
    /**
     * Increase or decrease index by given index offset
     * @param {number} offset 
     */
    addIndex: offset => locked || active
      ? null : setIndex(toIndex(index + offset)),
    /** Current item active state */
    active,
    /** Set active state for current item */
    setActive: state => locked ? null : setActive(state)
  }
}

// create three modules
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, 45, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

// create tween
const tween = new Tween()
// diamonds array
const diamonds = []
// context data object
const contextData = {}
// get glow patch url
const patch = assets.images.patch.source
// get galaxy modules
const galaxy = GalaxyLoader

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
  // load models into scene
  scene.add(...diamonds)
  // animate scene
  renderer.setAnimationLoop(() => {
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
  // update camera position by width
  camera.position.z = 5.4
}

/** Click callback event */
EventLoader.onClick = object => {
  // get diamond outer mesh
  const diamond = object.parent.parent
  // get current index
  const index = toIndex(diamonds.length - diamond.index)
  // blur diamond
  EventLoader.onBlur(diamond.meshes.idle)
  // check with current index
  if (index === contextData.index) {
    // active diamond
    contextData.setActive(true)
  } else {
    // select diamond
    contextData.setIndex(diamonds.length - diamond.index)
  }
}

/** Focus callback event */
EventLoader.onFocus = object => {
  // return if locked or active
  if (contextData.active || contextData.locked) { return }
  // update cursor
  document.body.style.cursor = "pointer"
  // get diamond meshes
  const meshes = object.parent.parent.meshes
  // scale up diamond
  tween.animateAllObjects([
    { target: meshes.outer, to: points.hover.focus },
    { target: meshes.idle.material, to: { opacity: 0 } },
    { target: meshes.glow.material, to: { opacity: 1 } }
  ], {
    duration: 300,
    easing: "out-cubic"
  })
}

/** Focus callback event */
EventLoader.onBlur = object => {
  // get diamond meshes
  const meshes = object.parent.parent.meshes
  // update cursor
  document.body.style.cursor = "default"
  // scale up diamond
  tween.animateAllObjects([
    { target: meshes.outer, to: points.hover.blur },
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
    // get diamond index
    const index = toIndex(i - 4)
    // current item
    setTimeout(() => {
      float(diamonds[index].meshes.inner)
    }, i * 300)
  }
}

/** Select diamond from moveable space */
const selectDiamond = context => {
  // return if not ready
  if (!context || !context.isReady) { return }
  // return if locked or active
  if (context.active || context.locked) { return }
  // for each diamond
  for (let i = 0; i < diamonds.length; i++) {
    // current diamond
    const diamond = diamonds[i]
    // get coords by shifted index
    const shift = toIndex(context.index + i)
    const coord = points.moveable[shift]
    // animate model
    tween.animateObject(diamond, coord, {
      duration: 800,
      easing: 'out-cubic',
      onUpdate() {
        // get object position
        const posX = diamond.position.x
        const posZ = diamond.position.z
        // change visibility by position
        diamond.visible = !(posZ < -34 && (posX < 38 && posX > -38))
      }
    })
  }
}

/** Change active state of diamond */
const activeDiamond = context => {
  // return if not ready
  if (!context || !context.isReady) { return }
  // set locked state
  context.setLocked(true)
  // get current index
  const currentIndex = toIndex(diamonds.length - context.index)
  // for each item
  for (let i = 0; i < diamonds.length; i++) {
    // current diamond
    const diamond = diamonds[i]
    // get shifted index
    const shift = toIndex(context.index + i)
    // select coord by active state
    const coord = context.active
      ? points.selected[shift]
      : points.moveable[shift]
    // check if selected diamond
    if (i === currentIndex) {
      // get diamond meshes
      const meshes = diamond.meshes
      // switch by active state
      if (context.active) {
        // switch to broken diamond
        meshes.idle.visible = false
        meshes.glow.visible = false
        meshes.top.visible = true
        meshes.bottom.visible = true
        // animate broken pieces
        tween.animateAllObjects([
          { target: galaxy.mesh, to: points.galaxy.focus },
          { target: meshes.top, to: points.broken.top },
          { target: meshes.bottom, to: points.broken.bottom }
        ], {
          duration: 800,
          easing: 'out-cubic'
        })
      } else {
        // animate objects
        tween.animateAllObjects([
          { target: galaxy.mesh, to: points.galaxy.blur },
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
          }
        })
      }
    } else {
      // animate diamond curve
      tween.animateObject(diamond, coord, {
        duration: 800,
        easing: 'out-cubic',
        onComplete() { context.setLocked(false) }
      })
    }
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
      // add event listeners
      window.addEventListener("resize", onResize)
      window.addEventListener("click", EventLoader.trigger)
      window.addEventListener("mousemove", EventLoader.trigger)
      // get container element
      const container = document.querySelector(".arimac-web-canvas")
      // set canvas class names
      galaxy.renderer.domElement.classList.add("arimac-web-canvas-galaxy")
      renderer.domElement.classList.add("arimac-web-canvas-source")
      // append canvases
      if (container) {
        container.appendChild(renderer.domElement)
        container.appendChild(galaxy.renderer.domElement)
      }
      // set ready state
      context.setIsReady(true)
    })
    return () => {
      // remove event listeners
      window.removeEventListener("resize", onResize)
      window.removeEventListener("click", EventLoader.trigger)
      window.removeEventListener("mousemove", EventLoader.trigger)
    }
  }, [])
  // effect on index change
  useEffect(() => selectDiamond(context), [context.index])
  // effect on active change
  useEffect(() => activeDiamond(context), [context.active])
  // effect on context change
  useEffect(() => { Object.assign(contextData, context) }, [context])
  // container dom
  return (
    <div className="arimac-web-canvas" data-active={context.active}>
      <img src={patch} className="arimac-web-canvas-patch up" />
      <img src={patch} className="arimac-web-canvas-patch down" />
    </div>
  )
}
