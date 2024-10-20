import { CanvasTexture } from "three"

// cache images
const cacheImages = {}

export const HueLoader = {
  /** Load image with hue rotation */
  loadAsync(input) {
    return new Promise(resolve => {
      // get source and rotation from input
      const source = input.split("#")[0]
      const rotation = parseInt(input.split("#")[1] || 0)
      // create or get cached image
      const image = cacheImages[source] || new Image()
      // load callback
      const onLoad = () => {
        // store image in cache
        cacheImages[source] = image
        // create hue rotated canvas
        const canvas = this.createCanvas(image, rotation)
        // resolve as texture
        resolve(new CanvasTexture(canvas))
      }
      // find cache image
      if (source in cacheImages) {
        // load from cache
        onLoad()
      } else {
        // add event listener
        image.addEventListener("load", onLoad)
        // set image source to load
        image.src = source
      }
    })
  },
  /**
   * Create canvas from image with given hue rotation
   * @param {HTMLImageElement} image
   * @param {number} rotation 
   */
  createCanvas(image, rotation) {
    // create canvas and get context
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    // set image dimensions
    canvas.width = image.width
    canvas.height = image.height
    // draw image on canvas
    context.drawImage(image, 0, 0, image.width, image.height)
    // get canvas image data
    const data = context.getImageData(0, 0, canvas.width, canvas.height)
    // get pixel items
    const items = data.data
    // for each pixel
    for (let i = 0; i < items.length; i += 4) {
      // get RGB values
      const r = items[i]
      const g = items[i + 1]
      const b = items[i + 2]
      // convert to HSL
      let { h, s, l } = this.toHSL(r, g, b)
      // rotate hue amount
      h = (h + rotation / 360) % 1
      // convert to RGB 
      const { r: newR, g: newG, b: newB } = this.toRGB(h, s, l)
      // set rotated values
      items[i] = newR
      items[i + 1] = newG
      items[i + 2] = newB
    }
    // put updated data on context
    context.putImageData(data, 0, 0)
    // return rotated canvas
    return canvas
  },
  /** Covert RGB value into HSL format */
  toHSL(r, g, b) {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2
    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: {
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        }
        case g: {
          h = (b - r) / d + 2
          break
        }
        case b: {
          h = (r - g) / d + 4
          break
        }
        default: {
          break
        }
      }
      h /= 6
    }
    return { h, s, l }
  },
  /** Covert HSL value into RGB format */
  toRGB(h, s, l) {
    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }
}
