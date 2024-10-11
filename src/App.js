import Canvas, { useCanvas } from "./components/Canvas"
import "./App.css"

export default function App() {
  // create canvas context
  const context = useCanvas()
  // event for canvas interaction
  const onEvent = event => {
    // check event type
    if (event.type === "wheel") {
      // add index by wheel direction
      context.addIndex(event.deltaY < 0 ? 1 : -1)
    } else if (event.type === "keydown") {
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        // increase index for next section
        context.addIndex(1)
      } else if (event.key === "ArrowRight" || event.key === "PageDown") {
        // decrease index for last section
        context.addIndex(-1)
      } else if (event.key === " " && !context.active) {
        // active currently selected diamond
        context.setActive(true)
      } else if (event.key === "Escape" && context.active) {
        // inactive currently active diamond
        context.setActive(false)
      }
    }
  }
  // app container
  return (
    <div
      className="app-container"
      tabIndex={0}
      onWheel={onEvent}
      onKeyDown={onEvent}>
      <Canvas context={context} />
      <div className="content-container">
        {
          context.active && (
            <button
              className="close-button"
              onClick={() => context.setActive(false)}>
              Close Diamond
            </button>
          )
        }
        <div className="overlay-text">
          {
            context.isReady ? (
              <span>
                Overlay Text : Index ({context.index}) {
                  context.active && " + SELECTED"
                }
              </span>
            ) : "Loading..."
          }
        </div>
      </div>
    </div>
  )
}
