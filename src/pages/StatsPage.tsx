import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Crown,
	Fingerprint,
	GraduationCap,
	Hash,
	Heart,
	Loader2,
	Sparkles,
	TrendingUp,
	Type,
	Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

// 统计数据类型
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

// 年级选项
const YEAR_OPTIONS = [
	{ value: "all", label: "全部年级", file: "stats.json" },
	{ value: "2025", label: "2025级", file: "stats-2025.json" },
	{ value: "2024", label: "2024级", file: "stats-2024.json" },
	{ value: "2023", label: "2023级", file: "stats-2023.json" },
	{ value: "2022", label: "2022级", file: "stats-2022.json" },
	{ value: "2021", label: "2021级", file: "stats-2021.json" },
];

// 分页配置
const PAGES = [
	{ id: "overview", title: "总览", icon: BarChart3 },
	{ id: "surnames", title: "姓氏排行", icon: Crown },
	{ id: "duplicates", title: "重名排行", icon: Users },
	{ id: "givenNames", title: "热门名字", icon: Type },
	{ id: "characters", title: "取名用字", icon: Hash },
	{ id: "length", title: "名字长度", icon: TrendingUp },
	{ id: "interesting", title: "有趣发现", icon: Sparkles },
	{ id: "colleges", title: "专业分布", icon: GraduationCap },
];

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

	const nextPage = () => {
		setCurrentPage((prev) => (prev + 1) % PAGES.length);
	};

	const prevPage = () => {
		setCurrentPage((prev) => (prev - 1 + PAGES.length) % PAGES.length);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
					<p className="mt-4 text-gray-600 dark:text-gray-300">
						正在加载统计数据...
					</p>
				</div>
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center text-red-500">
					<p>{error || "数据加载失败"}</p>
				</div>
			</div>
		);
	}

	const renderOverview = () => (
		<div className="space-y-6">
			{/* 总人数卡片 */}
			<div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-blue-100 text-sm">{stats.label} 学生总数</p>
						<p className="text-4xl font-bold mt-1">
							{stats.total.toLocaleString()}
						</p>
					</div>
					<Users className="h-16 w-16 text-white/30" />
				</div>
			</div>

			{/* 性别分布 */}
			<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
					<Heart className="h-5 w-5 text-pink-500" />
					性别分布
				</h3>
				<div className="flex items-center gap-4">
					<div className="flex-1">
						<div className="flex justify-between mb-2">
							<span className="text-blue-600 dark:text-blue-400 font-medium">
								男生 {stats.gender.malePercent}%
							</span>
							<span className="text-pink-600 dark:text-pink-400 font-medium">
								女生 {stats.gender.femalePercent}%
							</span>
						</div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
								style={{ width: `${stats.gender.malePercent}%` }}
							/>
						</div>
						<p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
							男女比例 {stats.gender.ratio}:1
						</p>
					</div>
				</div>
			</div>

			{/* 各年级统计 - 仅在全部年级时显示 */}
			{stats.yearStats && (
				<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
						<GraduationCap className="h-5 w-5 text-green-500" />
						各年级人数
					</h3>
					<div className="space-y-3">
						{Object.entries(stats.yearStats)
							.sort(([a], [b]) => b.localeCompare(a))
							.map(([year, data]) => (
								<div key={year} className="relative">
									<div className="flex justify-between text-sm mb-1">
										<span className="text-gray-700 dark:text-gray-300">
											{year}级
										</span>
										<span className="text-gray-500 dark:text-gray-400">
											{data.total.toLocaleString()}人 (男女比{data.ratio})
										</span>
									</div>
									<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
										<div
											className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
											style={{
												width: `${(data.total / stats.total) * 100 * 5}%`,
											}}
										/>
									</div>
								</div>
							))}
					</div>
				</div>
			)}

			{/* 独特名字 */}
			<div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
				<div className="flex items-center gap-3">
					<Fingerprint className="h-10 w-10 text-white/80" />
					<div>
						<p className="text-amber-100 text-sm">独特名字(无重名)</p>
						<p className="text-2xl font-bold">
							{stats.uniqueNamesCount.toLocaleString()}人 (
							{stats.uniqueNamesPercent}%)
						</p>
					</div>
				</div>
			</div>
		</div>
	);

	const renderSurnames = () => (
		<div className="space-y-4">
			<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
					🏆 姓氏排行榜 TOP 20
				</h3>
				<div className="space-y-3">
					{stats.surnames.slice(0, 20).map((item, index) => (
						<div
							key={item.name}
							className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
						>
							<span
								className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
									index === 0
										? "bg-yellow-400 text-yellow-900"
										: index === 1
											? "bg-gray-300 text-gray-700"
											: index === 2
												? "bg-amber-600 text-white"
												: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
								}`}
							>
								{index + 1}
							</span>
							<span className="text-2xl font-bold text-gray-900 dark:text-white w-12">
								{item.name}
							</span>
							<div className="flex-1">
								<div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
									<div
										className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-end pr-2"
										style={{
											width: `${(item.count / stats.surnames[0].count) * 100}%`,
										}}
									>
										<span className="text-xs text-white font-medium">
											{item.count}人
										</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* 稀有姓氏 */}
			{stats.rareNames.length > 0 && (
				<div className="bg-purple-50/70 dark:bg-purple-900/30 backdrop-blur-sm rounded-xl p-6 shadow-lg">
					<h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
						💎 稀有姓氏 (≤3人)
					</h3>
					<div className="flex flex-wrap gap-2">
						{stats.rareNames.slice(0, 30).map((item) => (
							<span
								key={item.name}
								className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full text-sm"
							>
								{item.name} ({item.count})
							</span>
						))}
					</div>
				</div>
			)}
		</div>
	);

	const renderDuplicates = () => (
		<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				👥 重名排行榜 TOP 30
			</h3>
			<p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
				{stats.label}最容易"撞名"的名字
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{stats.topDuplicates.slice(0, 30).map((item, index) => (
					<div
						key={item.name}
						className={`flex items-center justify-between p-3 rounded-lg ${
							index < 3
								? "bg-red-50 dark:bg-red-900/30"
								: "bg-gray-50 dark:bg-gray-700/50"
						}`}
					>
						<div className="flex items-center gap-2">
							<span
								className={`text-sm font-bold ${index < 3 ? "text-red-600 dark:text-red-400" : "text-gray-500"}`}
							>
								#{index + 1}
							</span>
							<span className="font-medium text-gray-900 dark:text-white">
								{item.name}
							</span>
						</div>
						<span
							className={`px-2 py-1 rounded-full text-xs font-bold ${
								index < 3
									? "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200"
									: "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
							}`}
						>
							{item.count}人
						</span>
					</div>
				))}
			</div>
		</div>
	);

	const renderGivenNames = () => (
		<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				📝 最受欢迎的名字 (不含姓) TOP 30
			</h3>
			<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
				{stats.givenNames.top.slice(0, 30).map((item, index) => (
					<div
						key={item.name}
						className={`p-3 rounded-lg text-center ${
							index < 3
								? "bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30"
								: "bg-gray-50 dark:bg-gray-700/50"
						}`}
					>
						<span className="text-xs text-gray-500 dark:text-gray-400">
							#{index + 1}
						</span>
						<p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
							{item.name}
						</p>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							{item.count}人
						</p>
					</div>
				))}
			</div>
		</div>
	);

	const renderCharacters = () => (
		<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				🔤 最常用的取名用字 TOP 40
			</h3>
			<div className="flex flex-wrap gap-2">
				{stats.givenNames.topChars.slice(0, 40).map((item, index) => {
					const size =
						index < 5
							? "text-3xl px-4 py-2"
							: index < 15
								? "text-2xl px-3 py-1.5"
								: "text-xl px-2 py-1";
					const color =
						index < 5
							? "bg-blue-500 text-white"
							: index < 15
								? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
								: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";

					return (
						<span
							key={item.char}
							className={`rounded-lg font-bold ${size} ${color}`}
							title={`${item.count}次`}
						>
							{item.char}
						</span>
					);
				})}
			</div>
			<div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
				{stats.givenNames.topChars.slice(0, 8).map((item, index) => (
					<div
						key={item.char}
						className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
					>
						<span className="font-medium">
							{index + 1}. {item.char}
						</span>
						<span className="text-gray-500">{item.count}次</span>
					</div>
				))}
			</div>
		</div>
	);

	const renderLength = () => (
		<div className="space-y-4">
			<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
					📏 名字长度分布
				</h3>
				<div className="space-y-4">
					{Object.entries(stats.nameLength.distribution)
						.sort(([a], [b]) => Number(a) - Number(b))
						.map(([len, count]) => (
							<div key={len}>
								<div className="flex justify-between text-sm mb-1">
									<span className="text-gray-700 dark:text-gray-300">
										{len}个字
									</span>
									<span className="text-gray-500">
										{count.toLocaleString()}人 (
										{((count / stats.total) * 100).toFixed(1)}%)
									</span>
								</div>
								<div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
									<div
										className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg"
										style={{ width: `${(count / stats.total) * 100}%` }}
									/>
								</div>
							</div>
						))}
				</div>
			</div>

			{/* 最长最短名字 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-green-50/70 dark:bg-green-900/30 rounded-xl p-6 shadow-lg">
					<h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
						📝 最短名字 ({stats.nameLength.shortest.length}字)
					</h4>
					<div className="flex flex-wrap gap-2">
						{stats.nameLength.shortest.names.map((name) => (
							<span
								key={name}
								className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded-full"
							>
								{name}
							</span>
						))}
					</div>
				</div>
				<div className="bg-orange-50/70 dark:bg-orange-900/30 rounded-xl p-6 shadow-lg">
					<h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">
						📜 最长名字 ({stats.nameLength.longest.length}字)
					</h4>
					<div className="flex flex-wrap gap-2">
						{stats.nameLength.longest.names.map((name) => (
							<span
								key={name}
								className="px-3 py-1 bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200 rounded-full"
							>
								{name}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);

	const renderInteresting = () => (
		<div className="space-y-4">
			{/* 叠字名 */}
			{stats.interesting.sameCharNames.length > 0 && (
				<div className="bg-pink-50/70 dark:bg-pink-900/30 backdrop-blur-sm rounded-xl p-6 shadow-lg">
					<h3 className="text-lg font-semibold text-pink-800 dark:text-pink-200 mb-4">
						🌸 叠字名 (共{stats.interesting.sameCharNames.length}个)
					</h3>
					<div className="flex flex-wrap gap-2">
						{stats.interesting.sameCharNames.slice(0, 40).map((name) => (
							<span
								key={name}
								className="px-3 py-1.5 bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-200 rounded-full"
							>
								{name}
							</span>
						))}
					</div>
				</div>
			)}

			{/* 与名人相似 */}
			{stats.interesting.celebrityLikeNames.length > 0 && (
				<div className="bg-yellow-50/70 dark:bg-yellow-900/30 backdrop-blur-sm rounded-xl p-6 shadow-lg">
					<h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
						⭐ 与名人"撞名"
					</h3>
					<div className="flex flex-wrap gap-2">
						{stats.interesting.celebrityLikeNames.map((name) => (
							<span
								key={name}
								className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 rounded-full"
							>
								{name}
							</span>
						))}
					</div>
				</div>
			)}

			{/* 如果没有有趣发现 */}
			{stats.interesting.sameCharNames.length === 0 &&
				stats.interesting.celebrityLikeNames.length === 0 && (
					<div className="bg-gray-50/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg text-center">
						<p className="text-gray-500 dark:text-gray-400">
							该年级暂无特别有趣的名字发现
						</p>
					</div>
				)}
		</div>
	);

	const renderColleges = () => (
		<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				🏫 专业人数排行 TOP 20
			</h3>
			<div className="space-y-3">
				{stats.colleges.slice(0, 20).map((item, index) => (
					<div key={item.name} className="relative">
						<div className="flex justify-between text-sm mb-1">
							<span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
								<span className="text-gray-400 w-6">#{index + 1}</span>
								{item.name}
							</span>
							<span className="text-gray-500">
								{item.count.toLocaleString()}人
							</span>
						</div>
						<div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
								style={{
									width: `${(item.count / stats.colleges[0].count) * 100}%`,
								}}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
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
		<div className="max-w-4xl mx-auto space-y-6">
			{/* 标题 */}
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
					📊 有趣的姓名统计
				</h1>
				<p className="text-gray-600 dark:text-gray-300">
					ZZULI {stats.label} {stats.total.toLocaleString()}{" "}
					名学生的姓名数据分析
				</p>
			</div>

			{/* 年级选择 */}
			<div className="flex justify-center">
				<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-1.5 shadow-lg inline-flex gap-1">
					{YEAR_OPTIONS.map((option) => (
						<button
							type="button"
							key={option.value}
							onClick={() => setSelectedYear(option.value)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
								selectedYear === option.value
									? "bg-blue-500 text-white shadow-md"
									: "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			{/* 分页导航 */}
			<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-2 shadow-lg">
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={prevPage}
						className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
					</button>

					<div className="flex-1 overflow-x-auto">
						<div className="flex justify-center gap-1 min-w-max px-2">
							{PAGES.map((page, index) => {
								const Icon = page.icon;
								return (
									<button
										type="button"
										key={page.id}
										onClick={() => setCurrentPage(index)}
										className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
											currentPage === index
												? "bg-blue-500 text-white shadow-md"
												: "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
										}`}
									>
										<Icon className="h-4 w-4" />
										<span className="hidden sm:inline">{page.title}</span>
									</button>
								);
							})}
						</div>
					</div>

					<button
						type="button"
						onClick={nextPage}
						className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
					</button>
				</div>
			</div>

			{/* 页面指示器 */}
			<div className="flex justify-center gap-1.5">
				{PAGES.map((page, index) => (
					<button
						type="button"
						key={page.id}
						onClick={() => setCurrentPage(index)}
						className={`h-2 rounded-full transition-all ${
							currentPage === index
								? "w-6 bg-blue-500"
								: "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
						}`}
					/>
				))}
			</div>

			{/* 内容区域 */}
			<div className="min-h-[60vh]">{renderCurrentPage()}</div>

			{/* 页脚 */}
			<div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
				<p>
					数据来源：ZZULI 学生信息 | 更新时间：{stats.generatedAt.split("T")[0]}
				</p>
				<p className="mt-1">
					🔗{" "}
					<a
						href="https://he.dogxi.me"
						className="text-blue-500 hover:underline"
					>
						he.dogxi.me
					</a>
				</p>
			</div>
		</div>
	);
};

export default StatsPage;
