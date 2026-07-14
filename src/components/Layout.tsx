import { BarChart3, Moon, Search, Settings, Sun } from "lucide-react";
import type React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

interface LayoutProps {
	children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	const location = useLocation();
	const { theme, toggleTheme } = useTheme();

	const navigation = [
		{ name: "查询", href: "/search", icon: Search },
		{ name: "统计", href: "/stats", icon: BarChart3 },
		{ name: "更多", href: "/tools", icon: Settings },
	];

	const isActive = (path: string) =>
		location.pathname === path || (path === "/search" && location.pathname === "/");

	return (
		<div className="min-h-screen bg-[#fbfcfe] text-[#1f2328] transition-colors duration-200 dark:bg-[#0d1117] dark:text-[#e6edf3]">
			<aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center border-r border-slate-200/70 bg-white/85 dark:border-white/10 dark:bg-[#0d1117]/95 lg:flex">
				<Link
					to="/search"
					className="mt-7 mb-10 font-mono text-sm font-semibold tracking-[0.2em] text-slate-950 dark:text-white"
				>
					HE
				</Link>

				<nav className="flex flex-1 flex-col items-center gap-1">
					{navigation.map((item) => {
						const Icon = item.icon;
						const active = isActive(item.href);

						return (
							<Link
								key={item.name}
								to={item.href}
								className={`grid h-11 w-11 place-items-center border-l-2 text-sm transition-colors ${
									active
										? "border-l-blue-500 bg-blue-50/80 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300"
										: "border-l-transparent text-slate-500 hover:border-l-slate-300 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
								}`}
								title={item.name}
							>
								<Icon className="h-5 w-5" />
							</Link>
						);
					})}
				</nav>

				<button
					type="button"
					onClick={toggleTheme}
					className="mb-7 grid h-11 w-11 place-items-center border-l-2 border-l-transparent text-slate-500 transition-colors hover:border-l-slate-300 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
					title={theme === "light" ? "切换到黑夜模式" : "切换到日间模式"}
				>
					{theme === "light" ? (
						<Moon className="h-5 w-5" />
					) : (
						<Sun className="h-5 w-5" />
					)}
				</button>
			</aside>

			<header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 dark:border-white/10 dark:bg-[#0d1117]/95 lg:hidden">
				<Link
					to="/search"
					className="font-mono text-sm font-semibold tracking-[0.2em] text-slate-950 dark:text-white"
				>
					HE
				</Link>

				<nav className="flex items-center gap-1">
					{navigation.map((item) => {
						const Icon = item.icon;
						const active = isActive(item.href);

						return (
							<Link
								key={item.name}
								to={item.href}
								className={`grid h-10 w-10 place-items-center border-b-2 transition-colors ${
									active
										? "border-b-blue-500 text-blue-600 dark:text-blue-300"
										: "border-b-transparent text-slate-500 dark:text-slate-400"
								}`}
								title={item.name}
							>
								<Icon className="h-5 w-5" />
							</Link>
						);
					})}
					<button
						type="button"
						onClick={toggleTheme}
						className="grid h-10 w-10 place-items-center text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
						title={theme === "light" ? "切换到黑夜模式" : "切换到日间模式"}
					>
						{theme === "light" ? (
							<Moon className="h-5 w-5" />
						) : (
							<Sun className="h-5 w-5" />
						)}
					</button>
				</nav>
			</header>

			<main className="min-h-screen px-5 pt-20 pb-12 sm:px-8 lg:pl-28 lg:pt-0">
				<div className="mx-auto w-full max-w-5xl py-8 lg:py-12">{children}</div>
			</main>
		</div>
	);
};

export default Layout;
