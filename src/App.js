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
  // diamond selected state
  const [selected, setSelected] = useState(false)
  // method to next diamond
  const onNext = () => {
    setIndex(index === diamondCount - 1 ? 0 : index + 1)
  }
  // method to previous diamond
  const onPrevious = () => {
    setIndex(index === 0 ? diamondCount - 1 : index - 1)
  }
  // wheel event listener
  const onWheel = event => {
    // return if not ready or selected
    if (!ready || selected) { return }
    // rotate by wheel direction
    if (event.deltaY > 0) { onNext() } else { onPrevious() }
  }
  // key down event listener
  const onKeyDown = event => {
    // return if not ready or selected
    if (!ready || selected) { return }
    // rotate by key code
    if (event.key === "PageDown") {
      onNext()
    } else if (event.key === "PageUp") {
      onPrevious()
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
        selected={selected}
        setSelected={setSelected}
      />
      <div className="content-container">
        {
          selected && (
            <button
              className="close-button"
              onClick={() => setSelected(false)}>
              Close Diamond
            </button>
          )
        }
        <div className="overlay-text">
          {
            ready ? (
              <span>
                Overlay Text : Index ({index}) {
                  selected && " + SELECTED"
                }
              </span>
            ) : "Loading..."
          }
        </div>
      </div>
    </div>
  )
}
