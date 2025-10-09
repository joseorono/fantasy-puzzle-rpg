import { useState } from "react";
import { Button } from "./components/ui/8bit/button";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">Vite</a>
        <a href="https://react.dev" target="_blank">React</a>
      </div>
      <h1 className="text-3xl font-bold bg-red-500">Vite + React</h1>
      <h2 className="text-2xl font-bold underline">
        Hello world!
      </h2>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs text-center">
        Click on the Vite and React logos to learn more
      </p>
      <p>
        <span className="text-blue-500">Hello World</span>
        <Button>Button</Button>
      </p>
    </>
  );
}

export default App;
