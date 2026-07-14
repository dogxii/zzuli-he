import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface StatsData {
	generatedAt: string;
	label: string;
	total: number;
	yearStats: {
		[year: string]: {
			total: number;
			male: number;
			female: number;
			ratio: string;
		};
	} | null;
	gender: {
		male: number;
		female: number;
		ratio: string;
		malePercent: string;
		femalePercent: string;
	};
	surnames: Array<{ name: string; count: number }>;
	rareNames: Array<{ name: string; count: number }>;
	topDuplicates: Array<{ name: string; count: number }>;
	nameLength: {
		distribution: { [key: string]: number };
		shortest: { length: number; names: string[] };
		longest: { length: number; names: string[] };
	};
	givenNames: {
		top: Array<{ name: string; count: number }>;
		topChars: Array<{ char: string; count: number }>;
	};
	colleges: Array<{ name: string; count: number }>;
	uniqueNamesCount: number;
	uniqueNamesPercent: string;
	interesting: {
		sameCharNames: string[];
		celebrityLikeNames: string[];
	};
}

const YEAR_OPTIONS = [
	{ value: "all", label: "全部年级", file: "stats.json" },
	{ value: "2025", label: "2025级", file: "stats-2025.json" },
	{ value: "2024", label: "2024级", file: "stats-2024.json" },
	{ value: "2023", label: "2023级", file: "stats-2023.json" },
	{ value: "2022", label: "2022级", file: "stats-2022.json" },
	{ value: "2021", label: "2021级", file: "stats-2021.json" },
];

const PAGES = [
	{ id: "overview", title: "总览" },
	{ id: "surnames", title: "姓氏" },
	{ id: "duplicates", title: "重名" },
	{ id: "givenNames", title: "名字" },
	{ id: "characters", title: "用字" },
	{ id: "length", title: "长度" },
	{ id: "interesting", title: "发现" },
	{ id: "colleges", title: "专业" },
];

const StatSection: React.FC<{
	title: string;
	meta?: string;
	children: React.ReactNode;
}> = ({ title, meta, children }) => (
	<section className="border-t border-slate-200/80 py-6 dark:border-white/10">
		<div className="mb-5 flex items-baseline justify-between gap-4">
			<h2 className="text-sm font-semibold text-slate-500 dark:text-slate-500">
				{title}
			</h2>
			{meta && (
				<span className="font-mono text-xs text-slate-400 dark:text-slate-600">
					{meta}
				</span>
			)}
		</div>
		{children}
	</section>
);

const rankColor = (index: number) => {
	if (index === 0) return "text-amber-500";
	if (index === 1) return "text-blue-500";
	if (index === 2) return "text-emerald-500";
	return "text-slate-400 dark:text-slate-600";
};

const StatsPage: React.FC = () => {
	const [stats, setStats] = useState<StatsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const [selectedYear, setSelectedYear] = useState("all");

	useEffect(() => {
		const loadStats = async () => {
			setLoading(true);
			setError(null);
			try {
				const yearOption = YEAR_OPTIONS.find((y) => y.value === selectedYear);
				const file = yearOption?.file || "stats.json";
				const response = await fetch(`/example/${file}`);
				if (!response.ok) throw new Error("统计数据加载失败");
				const data = await response.json();
				setStats(data);
			} catch (e) {
				setError(e instanceof Error ? e.message : "加载失败");
			} finally {
				setLoading(false);
			}
		};
		loadStats();
	}, [selectedYear]);

	if (loading) {
		return (
			<div className="flex min-h-[60vh] items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
				<Loader2 className="h-5 w-5 animate-spin text-blue-500" />
				正在加载统计数据
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className="flex min-h-[60vh] items-center text-sm text-red-600 dark:text-red-300">
				{error || "数据加载失败"}
			</div>
		);
	}

	const renderOverview = () => {
		const maxYearTotal = stats.yearStats
			? Math.max(...Object.values(stats.yearStats).map((item) => item.total), 1)
			: 1;

		return (
			<div>
				<section className="border-y border-slate-200/80 py-8 dark:border-white/10">
					<div className="grid gap-7 sm:grid-cols-[1fr_auto] sm:items-end">
						<div>
							<p className="text-6xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-7xl">
								{stats.total.toLocaleString()}
							</p>
							<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
								{stats.label} 学生总数
							</p>
						</div>
						<div className="grid grid-cols-2 gap-8 text-sm sm:text-right">
							<div>
								<p className="font-mono text-xs text-slate-400 dark:text-slate-600">
									无重名
								</p>
								<p className="mt-1 font-semibold text-slate-900 dark:text-white">
									{stats.uniqueNamesCount.toLocaleString()} 人
								</p>
								<p className="text-slate-500 dark:text-slate-500">
									{stats.uniqueNamesPercent}%
								</p>
							</div>
							<div>
								<p className="font-mono text-xs text-slate-400 dark:text-slate-600">
									男女比
								</p>
								<p className="mt-1 font-semibold text-slate-900 dark:text-white">
									{stats.gender.ratio}:1
								</p>
								<p className="text-slate-500 dark:text-slate-500">男:女</p>
							</div>
						</div>
					</div>
				</section>

				<StatSection title="性别分布" meta={`${stats.gender.ratio}:1`}>
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium text-blue-600 dark:text-blue-300">
							男生 {stats.gender.malePercent}%
						</span>
						<span className="font-medium text-pink-600 dark:text-pink-300">
							女生 {stats.gender.femalePercent}%
						</span>
					</div>
					<div className="mt-3 h-2 bg-pink-100 dark:bg-pink-950/40">
						<div
							className="h-full bg-blue-500"
							style={{ width: `${stats.gender.malePercent}%` }}
						/>
					</div>
				</StatSection>

				{stats.yearStats && (
					<StatSection title="各年级人数">
						<div className="space-y-4">
							{Object.entries(stats.yearStats)
								.sort(([a], [b]) => b.localeCompare(a))
								.map(([year, data]) => (
									<div key={year}>
										<div className="flex justify-between gap-4 text-sm">
											<span className="font-medium text-slate-800 dark:text-slate-200">
												{year}级
											</span>
											<span className="text-slate-500 dark:text-slate-500">
												{data.total.toLocaleString()} 人 · 男女比 {data.ratio}
											</span>
										</div>
										<div className="mt-2 h-1.5 bg-slate-100 dark:bg-white/10">
											<div
												className="h-full bg-emerald-500"
												style={{ width: `${(data.total / maxYearTotal) * 100}%` }}
											/>
										</div>
									</div>
								))}
						</div>
					</StatSection>
				)}
			</div>
		);
	};

	const renderSurnames = () => (
		<div>
			<StatSection title="姓氏排行" meta="前 20">
				<div className="space-y-3">
					{stats.surnames.slice(0, 20).map((item, index) => (
						<div key={item.name}>
							<div className="flex items-baseline gap-4 text-sm">
								<span
									className={`w-9 font-mono text-xs font-semibold ${rankColor(index)}`}
								>
									#{index + 1}
								</span>
								<span className="w-14 text-2xl font-semibold text-slate-950 dark:text-white">
									{item.name}
								</span>
								<div className="flex-1">
									<div className="flex justify-between text-sm">
										<span className="text-slate-400 dark:text-slate-600">姓氏</span>
										<span className="font-mono text-slate-600 dark:text-slate-400">
											{item.count} 人
										</span>
									</div>
									<div className="mt-2 h-1.5 bg-slate-100 dark:bg-white/10">
										<div
											className="h-full bg-blue-500"
											style={{
												width: `${(item.count / stats.surnames[0].count) * 100}%`,
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</StatSection>

			{stats.rareNames.length > 0 && (
				<StatSection title="稀有姓氏" meta="≤3人">
					<p className="text-sm leading-8 text-slate-700 dark:text-slate-300">
						{stats.rareNames.slice(0, 30).map((item) => (
							<span key={item.name} className="mr-4 inline-block">
								<span className="font-semibold text-purple-600 dark:text-purple-300">
									{item.name}
								</span>
								<span className="ml-1 font-mono text-xs text-slate-400">
									{item.count}
								</span>
							</span>
						))}
					</p>
				</StatSection>
			)}
		</div>
	);

	const renderDuplicates = () => (
		<StatSection title="重名排行" meta="前 30">
			<div className="grid gap-x-10 md:grid-cols-2">
				{stats.topDuplicates.slice(0, 30).map((item, index) => (
					<div
						key={item.name}
						className="flex items-center justify-between border-b border-slate-100 py-3 text-sm dark:border-white/10"
					>
						<div className="flex items-center gap-3">
							<span className={`w-9 font-mono text-xs ${rankColor(index)}`}>
								#{index + 1}
							</span>
							<span className="font-semibold text-slate-950 dark:text-white">
								{item.name}
							</span>
						</div>
						<span className="font-mono text-slate-500 dark:text-slate-500">
							{item.count} 人
						</span>
					</div>
				))}
			</div>
		</StatSection>
	);

	const renderGivenNames = () => (
		<StatSection title="热门名字" meta="不含姓 · 前 30">
			<div className="grid gap-x-10 md:grid-cols-3">
				{stats.givenNames.top.slice(0, 30).map((item, index) => (
					<div
						key={item.name}
						className="flex items-baseline justify-between border-b border-slate-100 py-3 dark:border-white/10"
					>
						<div>
							<span className={`font-mono text-xs ${rankColor(index)}`}>
								#{index + 1}
							</span>
							<p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
								{item.name}
							</p>
						</div>
						<span className="font-mono text-sm text-slate-500 dark:text-slate-500">
							{item.count}
						</span>
					</div>
				))}
			</div>
		</StatSection>
	);

	const renderCharacters = () => (
		<StatSection title="取名用字" meta="前 40">
			<div className="flex flex-wrap items-baseline gap-x-5 gap-y-4">
				{stats.givenNames.topChars.slice(0, 40).map((item, index) => {
					const size =
						index < 5
							? "text-5xl"
							: index < 15
								? "text-3xl"
								: "text-2xl";
					const color =
						index < 5
							? "text-blue-600 dark:text-blue-300"
							: index < 15
								? "text-emerald-600 dark:text-emerald-300"
								: "text-slate-700 dark:text-slate-300";

					return (
						<span
							key={item.char}
							className={`inline-flex items-baseline gap-1 font-semibold ${size} ${color}`}
							title={`${item.count}次`}
						>
							{item.char}
							<span className="font-mono text-xs font-normal text-slate-400 dark:text-slate-600">
								{item.count}
							</span>
						</span>
					);
				})}
			</div>
		</StatSection>
	);

	const renderLength = () => (
		<div>
			<StatSection title="名字长度分布">
				<div className="space-y-5">
					{Object.entries(stats.nameLength.distribution)
						.sort(([a], [b]) => Number(a) - Number(b))
						.map(([len, count]) => (
							<div key={len}>
								<div className="flex justify-between gap-4 text-sm">
									<span className="font-medium text-slate-800 dark:text-slate-200">
										{len} 个字
									</span>
									<span className="text-slate-500 dark:text-slate-500">
										{count.toLocaleString()} 人 ·{" "}
										{((count / stats.total) * 100).toFixed(1)}%
									</span>
								</div>
								<div className="mt-2 h-2 bg-slate-100 dark:bg-white/10">
									<div
										className="h-full bg-blue-500"
										style={{ width: `${(count / stats.total) * 100}%` }}
									/>
								</div>
							</div>
						))}
				</div>
			</StatSection>

			<StatSection title="极值">
				<div className="grid gap-8 text-sm md:grid-cols-2">
					<div>
						<p className="font-mono text-xs text-emerald-600 dark:text-emerald-300">
							最短 · {stats.nameLength.shortest.length} 字
						</p>
						<p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
							{stats.nameLength.shortest.names.join(" / ")}
						</p>
					</div>
					<div>
						<p className="font-mono text-xs text-amber-600 dark:text-amber-300">
							最长 · {stats.nameLength.longest.length} 字
						</p>
						<p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
							{stats.nameLength.longest.names.join(" / ")}
						</p>
					</div>
				</div>
			</StatSection>
		</div>
	);

	const renderInteresting = () => {
		const hasSameChar = stats.interesting.sameCharNames.length > 0;
		const hasCelebrityLike = stats.interesting.celebrityLikeNames.length > 0;

		if (!hasSameChar && !hasCelebrityLike) {
			return (
				<StatSection title="有趣发现">
					<p className="text-sm text-slate-500 dark:text-slate-500">
						该年级暂无特别有趣的名字发现。
					</p>
				</StatSection>
			);
		}

		return (
			<div>
				{hasSameChar && (
					<StatSection
						title="叠字名"
						meta={`${stats.interesting.sameCharNames.length} 个`}
					>
						<p className="text-sm leading-8 text-slate-700 dark:text-slate-300">
							{stats.interesting.sameCharNames.slice(0, 40).join(" / ")}
						</p>
					</StatSection>
				)}

				{hasCelebrityLike && (
					<StatSection title="相似名">
						<p className="text-sm leading-8 text-slate-700 dark:text-slate-300">
							{stats.interesting.celebrityLikeNames.join(" / ")}
						</p>
					</StatSection>
				)}
			</div>
		);
	};

	const renderColleges = () => (
		<StatSection title="专业人数排行" meta="前 20">
			<div className="space-y-4">
				{stats.colleges.slice(0, 20).map((item, index) => (
					<div key={item.name}>
						<div className="flex justify-between gap-4 text-sm">
							<span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">
								<span className={`mr-3 font-mono text-xs ${rankColor(index)}`}>
									#{index + 1}
								</span>
								{item.name}
							</span>
							<span className="font-mono text-slate-500 dark:text-slate-500">
								{item.count.toLocaleString()}
							</span>
						</div>
						<div className="mt-2 h-1.5 bg-slate-100 dark:bg-white/10">
							<div
								className="h-full bg-emerald-500"
								style={{
									width: `${(item.count / stats.colleges[0].count) * 100}%`,
								}}
							/>
						</div>
					</div>
				))}
			</div>
		</StatSection>
	);

	const renderCurrentPage = () => {
		switch (PAGES[currentPage].id) {
			case "overview":
				return renderOverview();
			case "surnames":
				return renderSurnames();
			case "duplicates":
				return renderDuplicates();
			case "givenNames":
				return renderGivenNames();
			case "characters":
				return renderCharacters();
			case "length":
				return renderLength();
			case "interesting":
				return renderInteresting();
			case "colleges":
				return renderColleges();
			default:
				return renderOverview();
		}
	};

	return (
		<div className="mx-auto max-w-4xl">
			<header className="mb-8">
				<h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
					姓名统计
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
					{stats.label} · {stats.total.toLocaleString()} 名学生
				</p>
			</header>

			<div className="mb-8 flex flex-col gap-4 border-y border-slate-200/80 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
				<label className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
					<span className="text-xs">范围</span>
					<select
						value={selectedYear}
						onChange={(event) => {
							setSelectedYear(event.target.value);
							setCurrentPage(0);
						}}
						className="rounded-none border-0 border-b border-slate-300 bg-transparent px-1 py-2 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-0 dark:border-white/15 dark:bg-[#0d1117] dark:text-white dark:focus:border-blue-400"
					>
						{YEAR_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>

				<nav className="flex gap-1 overflow-x-auto">
					{PAGES.map((page, index) => {
						const active = currentPage === index;

						return (
							<button
								type="button"
								key={page.id}
								onClick={() => setCurrentPage(index)}
								className={`inline-flex h-10 items-center gap-1.5 border-b-2 px-2 text-sm transition-colors ${
									active
										? "border-blue-500 text-blue-600 dark:text-blue-300"
										: "border-transparent text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
								}`}
							>
								<span>{page.title}</span>
							</button>
						);
					})}
				</nav>
			</div>

			<div className="min-h-[55vh]">{renderCurrentPage()}</div>

			<footer className="border-t border-slate-200/80 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-600">
				数据来源：ZZULI 学生信息 · 更新时间：
				{stats.generatedAt.split("T")[0]} ·{" "}
				<a href="https://he.dogxi.me" className="text-blue-600 hover:underline dark:text-blue-300">
					he.dogxi.me
				</a>
			</footer>
		</div>
	);
};

export default StatsPage;
