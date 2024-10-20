import * as THREE from "three"

// helper to apply material into model

export const SceneLoader = {
  /** Load all light systems */
  loadLights() {
    // create ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 3)
    // create directional light
    const directional = new THREE.DirectionalLight(0xffffff, 1)
    directional.position.set(5, 10, 7.5)
    directional.castShadow = true
    // return all lights
    return [ambient, directional]
  },
  /** Load models with updated meshes and textures */
  loadModels(assets, setup) {
    // get diamond model
    const diamond = assets.models.diamond
    // get reflection texture
    const reflection = assets.textures.reflection
    // method to set mesh material
    const setMaterial = (mesh, texture, options) => {
      // set material
      mesh.material = new THREE.MeshPhysicalMaterial({
        ...setup.material,
        envMap: reflection,
        map: texture,
        ...options
      })
      // set shadow options
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
    // map and return diamonds
    return assets.textures.diamond.map((texture, index) => {
      // create outer model
      const outer = new THREE.Object3D()
      // set initial scale
      outer.scale.set(0.15, 0.15, 0.15)
      // create inner model
      const inner = new THREE.Object3D()
      // add into outer
      outer.add(inner)
      // get diamond parts
      const idle = diamond.children[2].clone()
      const glow = diamond.children[2].clone()
      const top = diamond.children[1].clone()
      const bottom = diamond.children[0].clone()
      // apply materials
      setMaterial(idle, texture.idle)
      setMaterial(glow, texture.glow, { opacity: 0 })
      setMaterial(top, texture.idle)
      setMaterial(bottom, texture.idle)
      // set visibility
      top.visible = false
      bottom.visible = false
      // set diamond index
      outer.index = index
      // set meshes on outer model
      outer.meshes = { outer, inner, idle, glow, top, bottom }
      // add into inner model
      inner.add(idle, glow, top, bottom)
      // return outer model
      return outer
    })
  }
}
