import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HoroscopeUpload from "./components/horoscopeupload";
import BlogUpload from "./components/blogupload";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/upload-horoscope" element={<HoroscopeUpload />} />
        <Route path="/upload-blog" element={<BlogUpload />} />
      </Routes>
    </Router>
  );
};

export default App;
