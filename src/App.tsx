import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";
import { ThemeProvider } from "./contexts/ThemeContext";

// 懒加载页面组件
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const ToolsPage = React.lazy(() => import("./pages/ToolsPage"));

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/tools" element={<ToolsPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
