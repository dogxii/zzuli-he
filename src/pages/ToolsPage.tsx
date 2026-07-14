import { ExternalLink } from "lucide-react";
import React from "react";

const ToolsPage: React.FC = () => {
	const tools = [
		{
			name: "假条生成",
			url: "https://jt.dogxi.me",
			desc: "zzuli 假条生成器",
		},
		{
			name: "课程平台",
			url: "https://wk.dogxi.top",
			desc: "低价刷课下单平台",
		},
	];

	const links = [
		{ name: "GitHub", url: "https://github.com/dogxii" },
		{ name: "主页", url: "https://dogxi.me/" },
		{ name: "博客", url: "https://blog.dogxi.me/" },
	];

	return (
		<div className="mx-auto max-w-3xl">
			<header className="mb-9">
				<h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
					我超 盒
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
					方便快捷查询学生信息的网页，用于检验是否为本校(zzuli)学生。请勿用于非法用途。
				</p>
			</header>

			<section className="border-y border-slate-200/80 py-5 dark:border-white/10">
				<div className="flex flex-wrap gap-x-6 gap-y-3">
					{links.map((link) => {
						return (
							<a
								key={link.name}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300"
							>
								{link.name}
							</a>
						);
					})}
				</div>
			</section>

			<section className="py-8">
				<div className="mb-4 flex items-baseline justify-between">
					<h2 className="text-sm font-semibold text-slate-500 dark:text-slate-500">
						其他工具
					</h2>
					<span className="font-mono text-xs text-slate-400 dark:text-slate-600">
						{tools.length} 个链接
					</span>
				</div>

				<div className="border-t border-slate-200/80 dark:border-white/10">
					{tools.map((tool) => {
						return (
							<a
								key={tool.name}
								href={tool.url}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-center justify-between gap-4 border-b border-slate-200/80 py-4 transition-colors hover:border-blue-200 dark:border-white/10 dark:hover:border-blue-400/30"
							>
								<span className="flex min-w-0 items-center gap-3">
									<span className="min-w-0">
										<span className="block font-semibold text-slate-950 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-300">
											{tool.name}
										</span>
										<span className="block truncate text-sm text-slate-500 dark:text-slate-500">
											{tool.desc} · {tool.url.replace("https://", "")}
										</span>
									</span>
								</span>
								<ExternalLink className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600 dark:text-slate-600 dark:group-hover:text-blue-300" />
							</a>
						);
					})}
				</div>
			</section>

			<footer className="border-t border-slate-200/80 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-600">
				Built on Vercel · by Dogxi
			</footer>
		</div>
	);
};

export default ToolsPage;
