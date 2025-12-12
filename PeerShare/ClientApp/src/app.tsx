import "./styles/index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StartPage } from "./routes/start-page.tsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
