import { CubeTextureLoader, ImageLoader, TextureLoader } from "three"
import { FBXLoader } from "three/examples/jsm/Addons.js"

export const AssetLoader = {
  /** Loader modules */
  loaders: {
    FBXLoader: new FBXLoader(),
    TextureLoader: new TextureLoader(),
    CubeTextureLoader: new CubeTextureLoader(),
    ImageLoader: new ImageLoader()
  },
  /** Load single asset */
  async load(asset) {
    // load asset by loader
    return this.loaders[asset.loader].loadAsync(asset.source)
  },
  /** Load multiple assets */
  async loadAll(assets) {
    // recursive load for nested object
    const recursive = async child => {
      // check input type
      if (typeof child === "object") {
        // get key nodes
        const keys = Object.keys(child)
        // for each key
        for (let i = 0; i < keys.length; i++) {
          // current key and node
          const key = keys[i]
          const node = child[key]
          // check for asset definition
          if ("source" in node && "loader" in node) {
            // load asset and assign to child node
            child[key] = await this.load(node)
          } else {
            // find recursively
            await recursive(node)
          }
        }
      }
    }
    // start loader
    await recursive(assets)
  }
}
