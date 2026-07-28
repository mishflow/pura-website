import Poster from './Poster'
import RenderStory from './RenderStory'

function App() {
  // `?render=story` = headless capture target for the daily auto-post pipeline.
  const params = new URLSearchParams(window.location.search)
  if (params.get('render') === 'story') return <RenderStory />
  return <Poster />
}

export default App
