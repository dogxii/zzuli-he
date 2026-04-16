import { BarChart3, Menu, Moon, Search, Settings, Sun, X, Activity } from "lucide-react";
import type React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

interface LayoutProps {
	children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const location = useLocation();
	const { theme, toggleTheme } = useTheme();

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const navigation = [
		{ name: "系统检索", href: "/search", icon: Search, tag: "ARCHIVE" },
		{ name: "数据视界", href: "/stats", icon: BarChart3, tag: "METRICS" },
		{ name: "外部资源", href: "/tools", icon: Settings, tag: "NETWORK" },
	];

	const isActive = (path: string) => {
		return (
			location.pathname === path ||
			(path === "/search" && location.pathname === "/")
		);
	};

	return (
		<div className="min-h-screen flex flex-col font-sans overflow-hidden">
			{/* Tech-UI Minimal Header */}
			<header className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl border-b border-sys-border dark:border-sys-border-dark ${scrolled ? 'bg-sys-light/90 dark:bg-sys-dark/90 shadow-sm' : 'bg-sys-light/60 dark:bg-sys-dark/60'}`}>

				<div className="hidden md:flex justify-between items-center px-4 py-1 text-[10px] font-mono tracking-widest text-slate-500 uppercase border-b border-sys-border dark:border-sys-border-dark bg-white/30 dark:bg-black/30">
					<div className="flex items-center gap-4">
						<span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-fast" /> SECURE_LINK_ACTIVE</span>
						<span>NODE: ZZULI_DB</span>
					</div>
					<span>UI_VERSION: 2.0.TECH</span>
				</div>

				<div className="max-w-7xl mx-auto px-4 lg:px-8">
					<div className="flex justify-between items-center h-16 md:h-20">

						{/* Left: Brand Identity */}
						<div className="flex-shrink-0 flex items-center space-x-4">
							<Link key="home" to="/" className="flex flex-col group relative">
								<span className="font-sans font-bold text-xl md:text-2xl tracking-tighter text-slate-800 dark:text-slate-100 group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark transition-colors flex items-center gap-2">
									<Activity className="h-5 w-5" />
									我超・盒
								</span>
							</Link>
						</div>

						{/* Middle: Tech Nav Desktop */}
						<nav className="hidden lg:flex items-center space-x-8">
							{navigation.map((item) => (
								<Link
									key={item.name}
									to={item.href}
									className={`group flex items-center gap-2 h-16 md:h-20 relative`}
								>
									{isActive(item.href) && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-sys-accent dark:bg-sys-accent-dark" />}
									<div className="flex flex-col items-center">
										<span className={`font-bold tracking-widest text-sm transition-colors duration-200 ${isActive(item.href) ? 'text-sys-accent dark:text-sys-accent-dark' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
											{item.name}
										</span>
										<span className="font-mono text-[9px] tracking-widest opacity-50 uppercase mt-0.5">{item.tag}</span>
									</div>
								</Link>
							))}
						</nav>

						{/* Right: Actions */}
						<div className="flex items-center gap-4">
							{/* Theme Toggle */}
							<button
								onClick={toggleTheme}
								className="flex items-center justify-center h-10 w-10 rounded border border-sys-border dark:border-sys-border-dark bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-sys-accent dark:hover:text-sys-accent-dark"
								aria-label="Toggle Theme"
							>
								{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
							</button>

							{/* Mobile Menu Button */}
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="lg:hidden flex items-center justify-center h-10 w-10 border border-sys-border dark:border-sys-border-dark bg-white dark:bg-slate-800 text-slate-500"
							>
								{isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
							</button>
						</div>

					</div>
				</div>
			</header>

			{/* Mobile Tech Menu Overlay */}
			<div className={`fixed inset-0 z-40 backdrop-blur-md bg-sys-light/95 dark:bg-sys-dark/95 transition-all duration-300 ease-out ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
				<div className="h-full flex flex-col pt-24 px-8 pb-8">
					<div className="flex items-center gap-2 mb-8 font-mono text-xs tracking-widest text-slate-400 border-b border-sys-border dark:border-sys-border-dark pb-4">
						<Activity className="h-4 w-4" /> <span>SYSTEM_NAVIGATION</span>
					</div>
					<div className="space-y-4">
						{navigation.map((item, index) => (
							<Link
								key={item.name}
								to={item.href}
								onClick={() => setIsMobileMenuOpen(false)}
								className="block group bg-white dark:bg-slate-800 border border-sys-border dark:border-sys-border-dark p-4 active:scale-95 transition-transform"
								style={{ transitionDelay: `${index * 50}ms`, transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-20px)', opacity: isMobileMenuOpen ? 1 : 0 }}
							>
								<div className="flex justify-between items-center">
									<div className="flex flex-col">
										<span className="font-sans font-bold text-xl text-slate-800 dark:text-slate-200 group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark transition-colors">
											{item.name}
										</span>
										<span className="font-mono text-[10px] text-slate-500 tracking-widest mt-1">[{item.tag}]</span>
									</div>
									<item.icon className="h-5 w-5 text-slate-400 group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark" />
								</div>
							</Link>
						))}
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10 flex flex-col">
				{children}
			</main>
		</div>
	);
};

export default Layout;
