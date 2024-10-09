import { useEffect } from "react"
import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/Addons.js"
import { Tween } from "./modules/Tween"
import items from "./objects/diamonds.json"
import items_selected from "./objects/diamonds_selected.json"
import item_broken from "./objects/diamond_broken.json"
import "./Canvas.css"

// react on states
let stateIndex = 0
let stateSelected = 0

// current selected diamond index
let selectedIndex = null

// window dimensions
let width = window.innerWidth
let height = window.innerHeight

// three modules
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

// raycaster modules
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// tween for part animations
const topTween = new Tween()
const bottomTween = new Tween()

// method to simplify index
const simplifyIndex = index => {
  // get items length
  const length = items.length
  // return index inside array
  return ((index % length) + length) % length
}

// method to load diamond models
const loadDiamonds = async () => {
  // load diamond model
  const model = await new FBXLoader().loadAsync("./models/diamond_v3.fbx")
  // load diamond texture
  const textures = [
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_purple.png"),
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_blue.png"),
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_green.png"),
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_purple.png"),
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_blue.png"),
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_green.png"),
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_purple.png"),
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_blue.png"),
    await new THREE.TextureLoader().loadAsync("./models/diamond_v6_green.png")
  ]
  // load reflection texture
  const envTexture = await new THREE.CubeTextureLoader().loadAsync([
    "./models/skybox_v2.png",
    "./models/skybox_v2.png",
    "./models/skybox_v2.png",
    "./models/skybox_v2.png",
    "./models/skybox_v2.png",
    "./models/skybox_v2.png"
  ])
  // set model scale
  model.scale.set(0.15, 0.15, 0.15)
  // for each item
  for (let i = 0; i < items.length; i++) {
    // current item
    const item = items[i]
    // clone diamond model
    const diamond = model.clone(true)
    // traverse model children
    diamond.traverse(child => {
      // update model material
      child.material = new THREE.MeshPhysicalMaterial({
        map: textures[i] || textures[0],
        envMap: envTexture,
        color: new THREE.Color("#FFFFFF"),
        metalness: 0,
        roughness: 0.01,
        transparent: true,
        opacity: 1,
        transmission: 0.3,
        reflectivity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide
      });
      // setup shadows
      child.castShadow = true
      child.receiveShadow = true
    })
    // locate and rotate diamond
    diamond.position.set(...Object.values(item.anchor.position))
    diamond.rotation.set(...Object.values(item.anchor.rotation))
    // get mesh parts
    diamond.top = diamond.children[1]
    diamond.bottom = diamond.children[0]
    diamond.full = diamond.children[2]
    // set full diamond flag
    diamond.full.isFullDiamond = true
    diamond.full.name = "Diamond_" + i
    // hide broken diamond parts
    diamond.top.visible = false
    diamond.bottom.visible = false
    // set model on item
    item.model = diamond
    // create tween for model
    item.tween = new Tween()
    // set index on model
    item.model.full.index = i
    item.model.full.color = item.color
  }
  // return diamonds array
  return items.map(item => item.model)
}

// method to load lights
const loadLights = () => {
  // create ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 3)
  // create directional light
  const directional = new THREE.DirectionalLight(0xffffff, 1)
  directional.position.set(5, 10, 7.5)
  directional.castShadow = true
  // return all lights
  return [ambient, directional]
}

// method to initiate
const onInit = async (setIndex, setSelected) => {
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
    // update part tween
    topTween.update()
    bottomTween.update()
    // render scene
    renderer.render(scene, camera)
  })
  // mouse click event
  window.addEventListener("click", event => {
    // return if selected
    if (selectedIndex !== null) { return }
    // calculate points from pixel ratio
    const x = event.clientX * window.devicePixelRatio
    const y = event.clientY * window.devicePixelRatio
    // update mouse vector
    mouse.x = (x / renderer.domElement.width) * 2 - 1
    mouse.y = -(y / renderer.domElement.height) * 2 + 1
    // set raycaster from camera
    raycaster.setFromCamera(mouse, camera)
    // get input meshes
    const inputs = items.map(item => item.model.full)
    // get intersect objects
    const objects = raycaster.intersectObjects(inputs)
    // find full diamond mesh
    const result = objects.find(item => item.object.isFullDiamond)
    // return if no result
    if (!result) { return }
    // get current index
    const currentIndex = items.length - result.object.index
    // check index
    if (simplifyIndex(currentIndex) === stateIndex) {
      // set state flag
      setSelected(true)
      // select diamond
      selectDiamond(stateIndex, result.object.index)
    } else {
      // set diamond index
      setIndex(currentIndex)
    }
  }, false)
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
  camera.position.z = 5.4
}

// method to rotate diamonds
const rotateDiamonds = index => {
  // get items length
  const length = items.length
  // for each item
  for (let i = 0; i < items.length; i++) {
    // current item
    const item = items[i]
    // get modulo index and item by offset
    const offsetIndex = (((index + i) % length) + length) % length
    const offsetItem = items[offsetIndex]
    // animate model
    item.tween.animateObject(item.model, offsetItem.anchor, {
      duration: 800,
      easing: 'out-cubic',
      onUpdate() {
        // get child mesh
        const mesh = item.model
        const posX = item.model.position.x
        const posZ = item.model.position.z
        if (posZ < -34 && (posX < 38 && posX > -38)) {
          mesh.visible = false
        } else {
          mesh.visible = true
        }
      }
    })
  }
}

// method to select diamonds
const selectDiamond = (index, diamondIndex) => {
  // set diamond index
  selectedIndex = diamondIndex
  // for each item
  for (let i = 0; i < items.length; i++) {
    // current item
    const item = items[i]
    // get modulo index and item by offset
    const offsetIndex = simplifyIndex(index + i)
    const offsetItem = items_selected[offsetIndex]
    // check if selected diamond
    if (i === diamondIndex) {
      // switch to broken diamond
      item.model.full.visible = false
      item.model.top.visible = true
      item.model.bottom.visible = true
      // animate broken top part
      item.tween.animateObject(item.model.top, item_broken.top, {
        duration: 800,
        easing: 'out-cubic'
      })
      // animate broken bottom part
      item.tween.animateObject(item.model.bottom, item_broken.bottom, {
        duration: 800,
        easing: 'out-cubic'
      })
    } else {
      item.tween.animateObject(item.model, offsetItem.anchor, {
        duration: 800,
        easing: 'out-cubic'
      })
    }
  }
}

// method to close diamond
const closeDiamond = index => {
  // relocate all diamonds
  rotateDiamonds(index)
  // get current diamond
  const item = items[selectedIndex]
  // animate broken top part
  item.tween.animateObject(item.model.top, item_broken.reset, {
    duration: 800,
    easing: 'out-cubic'
  })
  // animate broken bottom part
  item.tween.animateObject(item.model.bottom, item_broken.reset, {
    duration: 800,
    easing: 'out-cubic',
    onComplete() {
      // switch to full diamond
      item.model.full.visible = true
      item.model.top.visible = false
      item.model.bottom.visible = false
      // reset selected index
      selectedIndex = null
    }
  })
}

export default function Canvas({ ready, setReady, index, setIndex, selected, setSelected }) {
  // effect on mount
  useEffect(() => {
    // get container element
    const container = document.querySelector(".canvas-container")
    // check container initial state
    if (container && container.querySelectorAll("canvas").length === 0) {
      // append canvas
      container.appendChild(renderer.domElement)
      // set as not ready
      setReady(false)
      // initiate module
      onInit(setIndex, setSelected).then(() => {
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
    if (ready && !stateSelected) { rotateDiamonds(index) }
    // update index state
    stateIndex = index
  }, [index])
  // effect on selected change
  useEffect(() => {
    // close diamond if not selected
    if (ready && !selected) { closeDiamond(index) }
    // update selected state
    stateSelected = selected
  }, [selected])
  // return container
  return (
    <div className="canvas-container">
      <div
        className="canvas-container-image"
        data-selected={selected}
      />
      <div
        className="canvas-container-image flipped"
        data-selected={selected}
      />
    </div>
  )
}

const createObjectKeyHandler = model => {
  window.addEventListener("keydown", event => {
    const speedR = 4;
    const speedP = 10;
    // rotation
    if (event.key === "ArrowLeft") {
      console.log(model.rotation.y -= 0.01 * speedR)
    } else if (event.key === "ArrowRight") {
      console.log(model.rotation.y += 0.01 * speedR)
    } else if (event.key === "ArrowUp") {
      console.log(model.rotation.x -= 0.01 * speedR)
    } else if (event.key === "ArrowDown") {
      console.log(model.rotation.x += 0.01 * speedR)
    } else if (event.key === "6") {
      console.log(model.rotation.z -= 0.01 * speedR)
    } else if (event.key === "4") {
      console.log(model.rotation.z += 0.01 * speedR)
    }
    // position
    if (event.key === "a") {
      console.log(model.position.x -= 0.01 * speedP)
    } else if (event.key === "d") {
      console.log(model.position.x += 0.01 * speedP)
    } else if (event.key === "w") {
      console.log(model.position.y += 0.01 * speedP)
    } else if (event.key === "s") {
      console.log(model.position.y -= 0.01 * speedP)
    } else if (event.key === "+") {
      console.log(model.position.z += 0.01 * speedP)
    } else if (event.key === "-") {
      console.log(model.position.z -= 0.01 * speedP)
    }
    console.clear()
    console.log(event.key)
    console.log({
      position: {
        x: model.position.x,
        y: model.position.y,
        z: model.position.z
      },
      rotation: {
        x: model.rotation.x,
        y: model.rotation.y,
        z: model.rotation.z
      }
    })
  })
}
