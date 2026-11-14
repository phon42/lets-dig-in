import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Play from "./pages/Play";
import Tv from "./pages/Tv";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play/:code" element={<Play />} />
      <Route path="/tv/:code" element={<Tv />} />
    </Routes>
  );
}
