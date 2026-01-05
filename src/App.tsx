import React, { Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";
import { ThemeProvider } from "./contexts/ThemeContext";

// 懒加载页面组件
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const StatsPage = React.lazy(() => import("./pages/StatsPage"));
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
							<Route path="/stats" element={<StatsPage />} />
							<Route path="/tools" element={<ToolsPage />} />
						</Routes>
					</Suspense>
				</Layout>
			</Router>
		</ThemeProvider>
	);
}

export default App;
