import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Host from "./pages/Host";
import Player from "./pages/Player";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/host/:code" element={<Host />} />
      <Route path="/play/:code" element={<Player />} />
    </Routes>
  );
}
