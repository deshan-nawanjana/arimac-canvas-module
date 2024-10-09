import { useState } from "react"
import Canvas from "./canvas/Canvas"
import "./App.css"

// diamond count
const diamondCount = 9

export default function App() {
  // module ready state
  const [ready, setReady] = useState(false)
  // current diamond index
  const [index, setIndex] = useState(0)
  // wheel event listener
  const onWheel = event => {
    // return if not ready
    if (!ready) { return }
    // check wheel direction
    if (event.deltaY > 0) {
      // increase index
      setIndex(index === diamondCount - 1 ? 0 : index + 1)
    } else {
      // decrease index
      setIndex(index === 0 ? diamondCount - 1 : index - 1)
    }
  }
  // key down event listener
  const onKeyDown = event => {
    // return if not ready
    if (!ready) { return }
    // check wheel direction
    if (event.key === "PageDown") {
      // increase index
      setIndex(index === diamondCount - 1 ? 0 : index + 1)
    } else if (event.key === "PageUp") {
      // decrease index
      setIndex(index === 0 ? diamondCount - 1 : index - 1)
    }
  }
  return (
    <div
      className="app-container"
      tabIndex={0}
      onWheel={onWheel}
      onKeyDown={onKeyDown}>
      <Canvas
        ready={ready}
        setReady={setReady}
        index={index}
        setIndex={setIndex}
      />
      <div className="content-container">
        <div className="overlay-text">
          Overlay Text : Index ({index})
        </div>
      </div>
    </div>
  )
}
