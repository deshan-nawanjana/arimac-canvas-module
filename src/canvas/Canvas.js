import { useEffect } from "react"
import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/Addons.js"
import { Tween } from "./modules/Tween"
import items from "./objects/diamonds.json"
import "./Canvas.css"

// window dimensions
let width = window.innerWidth
let height = window.innerHeight

// three modules
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ alpha: true })

// method to load diamond models
const loadDiamonds = async () => {
  // load diamond model
  const model = await new FBXLoader().loadAsync("./models/diamond.fbx")
  // load diamond texture
  const texture = await new THREE.TextureLoader().loadAsync("./models/diamond.jpg")
  // set model scale
  model.scale.set(0.15, 0.15, 0.15)
  // for each item
  for (let i = 0; i < items.length; i++) {
    // current item
    const item = items[i]
    // clone diamond model
    const diamond = model.clone(true)
    // locate and rotate diamond
    diamond.position.set(...Object.values(item.anchor.position))
    diamond.rotation.set(...Object.values(item.anchor.rotation))
    // create model material
    diamond.children[0].material = new THREE.MeshPhongMaterial({
      map: texture,
      color: new THREE.Color("#FFF"),
      transparent: true
    })
    // set model on item
    item.model = diamond
    // create tween for model
    item.tween = new Tween()
    // set index on model
    item.model.index = i
  }
  // return diamonds array
  return items.map(item => item.model)
}

// method to load lights
const loadLights = () => {
  // create ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  // create directional light
  const directional = new THREE.DirectionalLight(0xffffff, 1)
  directional.position.set(5, 10, 7.5)
  directional.castShadow = true
  // create point light
  const point = new THREE.PointLight(0xff9900, 1, 2)
  point.position.set(-5, 5, 5)
  point.castShadow = true
  // return all lights
  return [ambient, directional, point]
}

// method to initiate
const onInit = async () => {
  // load and add diamond items
  scene.add(...await loadDiamonds())
  // load and add lights
  scene.add(...loadLights())
  // relocate camera
  camera.position.z = 5.8
  // animate scene
  renderer.setAnimationLoop(() => {
    // for each item
    for (let i = 0; i < items.length; i++) {
      // current item
      const item = items[i]
      // update tween
      item.tween.update()
    }
    // render scene
    renderer.render(scene, camera)
  })
  // initial resize
  onResize()
}

// method to resize
const onResize = () => {
  // update dimensions
  width = window.innerWidth
  height = window.innerHeight
  // update camera and renderer
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  // update camera position by width
  // camera.position.z = 10000 / width
  camera.position.z = 5.8
}

// method to rotate diamonds
const rotateDiamonds = (index, onReady) => {
  // set as not ready
  onReady(false)
  // get items length
  const length = items.length
  const rs = []
  // for each item
  for (let i = 0; i < items.length; i++) {
    // current item
    const item = items[i]
    // get modulo index and item by offset
    const offsetIndex = (((index + i) % length) + length) % length
    const offsetItem = items[offsetIndex]
    rs.push(offsetIndex)
    // animate model
    item.tween.animateObject(item.model, offsetItem.anchor, {
      duration: 500,
      easing: 'out-quad',
      onUpdate() {
        // get child mesh
        const mesh = item.model.children[0]
        const posX = Math.abs(item.model.position.x)
        const posZ = item.model.position.z
        if (posZ < - 35 && posX < 32) {
          mesh.material.opacity = posX / 220
        } else {
          mesh.material.opacity = 1
        }
      },
      onComplete() {
        // set as ready
        setTimeout(() => onReady(true), 10)
      }
    })
  }
}

export default function Canvas({ ready, setReady, setIndex, index }) {
  // effect on mount
  useEffect(() => {
    // get container element
    const container = document.querySelector(".canvas-container")
    // check container initial state
    if (container && container.children.length === 0) {
      // append canvas
      container.appendChild(renderer.domElement)
      // set as not ready
      setReady(false)
      // initiate module
      onInit().then(() => {
        // set as ready
        setReady(true)
      })
    }
    // resize event listener
    window.addEventListener("resize", onResize)
    // dismount callback
    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [])
  // effect on index change
  useEffect(() => {
    // relocate diamonds by index offset
    if (ready) { rotateDiamonds(index, setReady) }
  }, [index])
  // return container
  return <div className="canvas-container" />
}
