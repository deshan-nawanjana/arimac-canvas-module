import * as THREE from "three"

// raycaster module
const raycaster = new THREE.Raycaster()
// mouse pointer vector
const mouse = new THREE.Vector2()

export const EventLoader = {
  /** Camera module */
  camera: null,
  /** Intersect object with raycaster */
  objects: [],
  /** Current pointed object */
  current: null,
  /** Pointer event listener */
  trigger: event => {
    // update mouse vector
    mouse.x = (event.pageX / window.innerWidth) * 2 - 1
    mouse.y = -(event.pageY / window.innerHeight) * 2 + 1
    // set raycaster from camera
    raycaster.setFromCamera(mouse, EventLoader.camera)
    // get intersect result
    const result = raycaster.intersectObjects(EventLoader.objects)[0]
    // return if no results
    if (result) {
      // get object
      const object = result.object
      // check event type
      if (event.type === "click") {
        // callback click event
        EventLoader.onClick(object)
      } else if (event.type === "mousemove" && !EventLoader.current) {
        // get current object
        EventLoader.current = object
        // callback focus event
        EventLoader.onFocus(object)
      } else if (event.type === "mousemove" && EventLoader.current) {
        // check with current uuid
        if (EventLoader.current.uuid !== object.uuid) {
          // blur previous object
          EventLoader.onBlur(EventLoader.current)
          // get current object
          EventLoader.current = object
          // callback focus event
          EventLoader.onFocus(object)
        }
      }
    } else if (!result && EventLoader.current) {
      // callback focus event
      EventLoader.onBlur(EventLoader.current)
      // clear current object
      EventLoader.current = null
    }
  },
  /** Click event listener */
  onClick: null,
  /** Mouse focus event listener */
  onFocus: null,
  /** Mouse blur event listener */
  onBlur: null
}
