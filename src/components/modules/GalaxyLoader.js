import * as THREE from "three"
import { color, cos, float, mix, PI2, range, sin, SpriteNodeMaterial, timerLocal, uniform, uv, vec3, vec4, WebGPURenderer } from "three/webgpu"

// create three modules
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, 45, 0.1, 100)
const renderer = new WebGPURenderer({ alpha: true })
// set camera position
camera.position.set(0, 1.99, 8)
// set camera rotation
camera.rotation.set(-0.24380, 0, 0)

const material = new SpriteNodeMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
})
const size = uniform(0.066)
material.scaleNode = range(0, 1).mul(size)
const time = timerLocal(0.4)
const radiusRatio = range(0, 1)
const radius = radiusRatio.pow(1.5).mul(5).toVar()
const branches = 50
const branchAngle = range(0, branches).floor().mul(PI2.div(branches))
const angle = branchAngle.add(time.mul(radiusRatio.oneMinus()))
const position = vec3(cos(angle), 0, sin(angle)).mul(radius)
const randomOffset = range(vec3(- 1), vec3(1)).pow(3).mul(radiusRatio).add(0.2)
material.positionNode = position.add(randomOffset)
const colorInside = uniform(color('#e1dddb'))
const colorOutside = uniform(color('#d6d6d6'))
const colorFinal = mix(colorInside, colorOutside, radiusRatio.oneMinus().pow(2).oneMinus())
const alpha = float(0.1).div(uv().sub(0.5).length()).sub(0.2)
material.colorNode = vec4(colorFinal, alpha)
const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, 20000)
mesh.rotation.set(Math.PI / 1.1, 0, 0)
scene.add(mesh)
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera)
})

// method on resize
const resize = () => {
  // get dimensions
  const width = window.innerWidth
  const height = window.innerHeight
  // update camera and renderer
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// initial resize
resize()
// resize event listener
window.addEventListener("resize", resize)

export const GalaxyLoader = { renderer, mesh }
