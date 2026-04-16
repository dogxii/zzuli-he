import { Book, Code, Dog, ExternalLink, Github, Sheet } from "lucide-react";
import type React from "react";

const ToolsPage: React.FC = () => {
	const tools = [
		{
			name: "假条生成系统",
			label: "LEAVE GENERATOR",
			url: "https://jt.dogxi.me",
			icon: Sheet,
			desc: "zzuli 假条生成器",
			color: "text-sys-accent dark:text-sys-accent-dark",
		},
		{
			name: "课程辅助平台",
			label: "COURSE ASSISTANT",
			url: "https://wk.dogxi.top",
			icon: Book,
			desc: "一站式低价刷课下单平台",
			color: "text-rose-500 dark:text-rose-400",
		},
	];

	return (
		<div className="max-w-5xl mx-auto pb-16 animate-fade-in relative">
			{/* Decorative backdrop */}
			<div className="absolute top-20 right-20 w-96 h-96 border border-sys-border dark:border-sys-border-dark rounded-full -z-10 opacity-50" />
			<div className="absolute top-40 right-10 w-72 h-72 border border-sys-accent/20 dark:border-sys-accent-dark/20 rounded-full -z-10" />

			{/* Minimal Header */}
			<div className="pt-8 mb-16">
				<h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight text-[#1A1A1A] dark:text-[#E5E5E5] mb-4">
					工具与更多
					<span className="text-sys-accent dark:text-sys-accent-dark">.</span>
				</h1>
				<div className="flex flex-wrap items-center gap-4 text-sm font-mono text-gray-500 uppercase tracking-widest mt-6">
					<span>EXT_RESOURCES // ABOUT</span>
					<span className="hidden sm:block w-8 h-px bg-gray-300 dark:bg-gray-700" />
					<span>V1.0 REFINED</span>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
				{/* Left Col: About */}
				<div className="lg:col-span-7 space-y-12">
					<div className="editorial-card p-8 md:p-12">
						<h2 className="font-serif font-bold text-3xl mb-8 text-[#1A1A1A] dark:text-[#E5E5E5]">
							关于我超盒
						</h2>
						<div className="space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed font-sans font-light text-lg">
							<p>
								这是一个基于公开信息构建的学生信息检索切片，致力于以最优雅的形式呈现结构化数据。
							</p>
							<div className="p-4 border-l-2 border-rose-500 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-medium text-sm my-6">
								<p className="font-serif tracking-wide">
									敬告：该系统仅供校内身份核验与学习交流使用。严禁将其用于任何形式的隐私侵犯或非法数据采集。
								</p>
							</div>
							<p className="text-sm font-mono tracking-widest uppercase">
								// MAINTAINER: DOGXI
								<br />
								// CDN_NODE: JSDELIVR
							</p>
						</div>

						{/* Quick Links */}
						<div className="flex flex-wrap gap-4 mt-12 pt-8 border-t border-sys-border dark:border-sys-border-dark">
							<a
								href="https://github.com/dogxii"
								target="_blank"
								rel="noopener noreferrer"
								className="editorial-btn-outline"
							>
								<Github className="h-4 w-4" /> GITHUB
							</a>
							<a href="https://dogxi.me/" className="editorial-btn-outline">
								<Dog className="h-4 w-4" /> 主页
							</a>
							<a
								href="https://blog.dogxi.me/"
								className="editorial-btn-outline"
							>
								<Code className="h-4 w-4" /> 博客
							</a>
						</div>
					</div>
				</div>

				{/* Right Col: Tools */}
				<div className="lg:col-span-5 space-y-6">
					<h2 className="font-serif font-bold text-2xl text-[#1A1A1A] dark:text-[#E5E5E5] mb-8 pb-4 border-b border-sys-border dark:border-sys-border-dark">
						外部资源{" "}
						<span className="font-mono text-sm font-normal text-gray-400 ml-4 uppercase tracking-widest">
							Tools
						</span>
					</h2>

					<div className="flex flex-col gap-6">
						{tools.map((tool) => {
							const Icon = tool.icon;
							return (
								<a
									key={tool.name}
									href={tool.url}
									target="_blank"
									rel="noopener noreferrer"
									className="editorial-card p-6 flex items-start gap-6 group hover:border-sys-accent dark:hover:border-sys-accent-dark transition-colors"
								>
									<div
										className={`p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#111111] ${tool.color}`}
									>
										<Icon className="h-6 w-6" />
									</div>
									<div className="flex-1">
										<h3 className="font-serif font-bold text-xl text-[#1A1A1A] dark:text-[#E5E5E5] mb-1 group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark transition-colors">
											{tool.name}
										</h3>
										<p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-3">
											{tool.label}
										</p>
										<p className="text-gray-500 font-light text-sm">
											{tool.desc}
										</p>
									</div>
									<ExternalLink className="h-4 w-4 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
								</a>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ToolsPage;
