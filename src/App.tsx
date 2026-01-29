import Home from './components/Home'
import useAzan from './hooks/useAzan'

const App = () => {
  // initialize azan manager (singleton) so auto-play scheduling runs
  useAzan();

  return (
    <div>
      <Home />
    </div>
  )
}

export default App