import { useEffect } from "react"
import * as THREE from "three"
import { FBXLoader, OrbitControls } from "three/examples/jsm/Addons.js"
import { Tween } from "./modules/Tween"
import items from "./objects/diamonds.json"
import items_selected from "./objects/diamonds_selected.json"
import item_broken from "./objects/diamond_broken.json"
import "./Canvas.css"
import { color, cos, float, mix, PI2, range, sin, SpriteNodeMaterial, timerLocal, uniform, uv, vec3, vec4, WebGPURenderer } from "three/webgpu"

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

renderer.domElement.classList.add("diamond-canvas")

// raycaster modules
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()


const galaxyTween = new Tween()


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
  const model = await new FBXLoader().loadAsync("./models/diamond_v5.fbx")
  // load diamond texture
  const textures = [
    // normal textures
    await new THREE.TextureLoader().loadAsync("./textures/diamond_01_purple.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_02_blue.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_03_dark_blue.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_04_dark_green.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_05_green.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_06_orange.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_07_red.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_08_rose.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_09_yellow.png"),
    // glowing textures
    await new THREE.TextureLoader().loadAsync("./textures/diamond_01_purple_glow.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_02_blue_glow.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_03_dark_blue_glow.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_04_dark_green_glow.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_05_green_glow.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_06_orange_glow.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_07_red_glow.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_08_rose_glow.png"),
    await new THREE.TextureLoader().loadAsync("./textures/diamond_09_yellow_glow.png"),
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
    // create float tween
    item.floatTween = new Tween()
    // set index on model
    item.model.full.index = i
    item.model.full.color = item.color
    item.model.full.color_name = item.color_name
    item.model.full.tween = item.tween
    // create wrap group
    item.wrap = new THREE.Object3D()
    // remove children from model
    item.model.add(diamond.top)
    item.model.add(diamond.bottom)
    item.model.add(diamond.full)
    // add children to wrap
    item.wrap.add(diamond.top)
    item.wrap.add(diamond.bottom)
    item.wrap.add(diamond.full)
    // glow model
    item.model.glow = item.model.full.clone(true)
    item.model.glow.material = new THREE.MeshPhysicalMaterial({
      map: textures[items.length + i] || textures[items.length],
      envMap: envTexture,
      color: new THREE.Color("#FFFFFF"),
      metalness: 0,
      roughness: 0.01,
      transparent: true,
      opacity: 0,
      transmission: 0.3,
      reflectivity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide
    })
    item.model.full.glowTween = new Tween()
    item.glowTween = item.model.full.glowTween
    item.model.full.glow = item.model.glow
    item.wrap.add(item.model.glow)
    // add wrap to model
    item.model.add(item.wrap)
    // set initial wrap position
    item.wrap.position.y = item.float
    // set initial float direction
    item.wrap.direction = "up"
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
      item.floatTween.update()
      item.glowTween.update()
    }
    // update galaxy tween
    galaxyTween.update()
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
    document.body.style.cursor = "default"
  }, false)
  let hoverObject = null
  // mouse move event
  window.addEventListener("mousemove", event => {
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
    if (result) {
      if (hoverObject && hoverObject.color_name !== result.object.color_name) {
        hoverObject.tween.animateObject(hoverObject.material, { opacity: 1 }, {
          duration: 300,
          easing: "out-cubic"
        })
        hoverObject.glowTween.animateObject(hoverObject.glow.material, { opacity: 0 }, {
          duration: 300,
          easing: "out-cubic"
        })
      }
      hoverObject = result.object
      hoverObject.tween.animateObject(hoverObject.material, { opacity: 0 }, {
        duration: 300,
        easing: "out-cubic"
      })
      hoverObject.glowTween.animateObject(hoverObject.glow.material, { opacity: 1 }, {
        duration: 300,
        easing: "out-cubic"
      })
      document.body.style.cursor = "pointer"
    } else if (hoverObject) {
      hoverObject.tween.animateObject(hoverObject.material, { opacity: 1 }, {
        duration: 300,
        easing: "out-cubic"
      })
      hoverObject.glowTween.animateObject(hoverObject.glow.material, { opacity: 0 }, {
        duration: 300,
        easing: "out-cubic"
      })
      hoverObject = null
      document.body.style.cursor = "default"
    }
  }, false)
  // initial resize
  onResize()
  // float diamonds
  onFloat()
  // galaxy animation
  initGalaxy()
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

// method to float diamonds
const onFloat = () => {
  const floatDown = item => {
    item.floatTween.animateObject(item.wrap, {
      position: { y: -0.25 }
    }, {
      duration: 800,
      easing: "in-out-sine",
      onComplete() { floatUp(item) }
    })
  }
  const floatUp = item => {
    item.floatTween.animateObject(item.wrap, {
      position: { y: 0.25 }
    }, {
      duration: 800,
      easing: "in-out-sine",
      onComplete() { floatDown(item) }
    })
  }
  // for each item
  for (let i = 0; i < items.length; i++) {
    // current item
    setTimeout(() => floatDown(items[i]), i * 100)
  }
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
      item.model.glow.visible = false
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
  galaxyUp()
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
      item.model.glow.visible = true
      item.model.top.visible = false
      item.model.bottom.visible = false
      // reset selected index
      selectedIndex = null
    }
  })
  galaxyDown()
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
    <div className="canvas-container" data-selected={selected}>
      <div
        className="canvas-container-image non-flipped"
      />
      <div
        className="canvas-container-image flipped"
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

let galaxyMesh = null

function initGalaxy() {

  let camera, scene, renderer, controls;

  function init() {

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 8);

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x201919);

    // galaxy

    const material = new SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const size = uniform(0.066);
    material.scaleNode = range(0, 1).mul(size);

    const time = timerLocal(0.4);

    const radiusRatio = range(0, 1);
    const radius = radiusRatio.pow(1.5).mul(5).toVar();

    const branches = 50;
    const branchAngle = range(0, branches).floor().mul(PI2.div(branches));
    const angle = branchAngle.add(time.mul(radiusRatio.oneMinus()));

    const position = vec3(
      cos(angle),
      0,
      sin(angle)
    ).mul(radius);

    const randomOffset = range(vec3(- 1), vec3(1)).pow(3).mul(radiusRatio).add(0.2);

    material.positionNode = position.add(randomOffset);

    const colorInside = uniform(color('#e1dddb'));
    const colorOutside = uniform(color('#d6d6d6'));
    const colorFinal = mix(colorInside, colorOutside, radiusRatio.oneMinus().pow(2).oneMinus());
    const alpha = float(0.1).div(uv().sub(0.5).length()).sub(0.2);
    material.colorNode = vec4(colorFinal, alpha);

    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, 20000);

    mesh.rotation.set(Math.PI / 1.1, 0, 0)

    galaxyMesh = mesh

    scene.add(mesh);

    // debug

    // const gui = new GUI();

    // gui.add(size, 'value', 0, 1, 0.001).name('size');

    // gui.addColor({ color: colorInside.value.getHex(THREE.SRGBColorSpace) }, 'color')
    //   .name('colorInside')
    //   .onChange(function (value) {

    //     colorInside.value.set(value);

    //   });

    // gui.addColor({ color: colorOutside.value.getHex(THREE.SRGBColorSpace) }, 'color')
    //   .name('colorOutside')
    //   .onChange(function (value) {

    //     colorOutside.value.set(value);

    //   });

    // renderer

    renderer = new WebGPURenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 50;

    window.addEventListener('resize', onWindowResize);

    const container = document.querySelector(".canvas-container")

    renderer.domElement.classList.add("galaxy-canvas")

    container.appendChild(renderer.domElement)

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  }

  async function animate() {

    controls.update();

    renderer.render(scene, camera);

  }

  init()

}



const galaxyUp = () => {
  window.galaxyMesh = galaxyMesh
  galaxyTween.animateObject(galaxyMesh, {
    rotation: { x: Math.PI / 0.9 },
    position: { y: 1.5 }
  }, {
    duration: 800,
    easing: 'out-cubic'
  })
}

const galaxyDown = () => {
  galaxyTween.animateObject(galaxyMesh, {
    rotation: { x: Math.PI / 1.1 },
    position: { y: 0 }
  }, {
    duration: 800,
    easing: 'out-cubic'
  })
}
