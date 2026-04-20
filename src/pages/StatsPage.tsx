import {
	BarChart3,
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
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
	{ value: "all", label: "全样本库 ALL", file: "stats.json" },
	{ value: "2025", label: "25届 G.25", file: "stats-2025.json" },
	{ value: "2024", label: "24届 G.24", file: "stats-2024.json" },
	{ value: "2023", label: "23届 G.23", file: "stats-2023.json" },
	{ value: "2022", label: "22届 G.22", file: "stats-2022.json" },
	{ value: "2021", label: "21届 G.21", file: "stats-2021.json" },
];

const PAGES = [
	{ id: "overview", title: "宏观概览", icon: BarChart3 },
	{ id: "surnames", title: "姓氏族谱", icon: Crown },
	{ id: "duplicates", title: "重名指数", icon: Users },
	{ id: "givenNames", title: "名讳热度", icon: Type },
	{ id: "characters", title: "遣词用字", icon: Hash },
	{ id: "length", title: "字数分布", icon: TrendingUp },
	{ id: "interesting", title: "趣味特征", icon: Sparkles },
	{ id: "colleges", title: "学科版图", icon: GraduationCap },
];

const StatsPage: React.FC = () => {
	const [stats, setStats] = useState<StatsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const [selectedYear, setSelectedYear] = useState("all");
	const yearFilterRef = useRef<HTMLDivElement | null>(null);
	const yearFilterScrollLeftRef = useRef(0);

	useEffect(() => {
		const loadStats = async () => {
			setLoading(true);
			setError(null);
			try {
				const yearOption = YEAR_OPTIONS.find((y) => y.value === selectedYear);
				const file = yearOption?.file || "stats.json";
				const response = await fetch(`/example/${file}`);
				if (!response.ok) throw new Error("加载失败，无法获取数据切片");
				const data = await response.json();
				setStats(data);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Load failed");
			} finally {
				setLoading(false);
			}
		};
		loadStats();
	}, [selectedYear]);

	useLayoutEffect(() => {
		if (!yearFilterRef.current) return;

		const restoreScroll = () => {
			if (yearFilterRef.current) {
				yearFilterRef.current.scrollLeft = yearFilterScrollLeftRef.current;
			}
		};

		restoreScroll();
		const frameId = window.requestAnimationFrame(restoreScroll);

		return () => window.cancelAnimationFrame(frameId);
	}, [selectedYear, loading]);

	if (loading && !stats) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
				<Loader2 className="w-12 h-12 text-sys-accent dark:text-sys-accent-dark animate-spin" />
				<p className="font-mono text-sm tracking-widest uppercase text-gray-500">Compiling Matrix...</p>
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="editorial-card p-12 text-center max-w-lg border-red-500/20 bg-red-50/50 dark:bg-red-900/10">
					<p className="font-serif font-bold text-2xl text-red-600 dark:text-red-400 mb-4">解析异常</p>
					<p className="font-mono text-sm tracking-widest text-red-500/80 uppercase">{error || "DATA_STREAM_INTERRUPTED"}</p>
				</div>
			</div>
		);
	}

	const renderOverview = () => (
		<div className="space-y-4 md:space-y-6 animate-slide-up">
			
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
				{/* Total Population Bento */}
				<div className="editorial-card p-5 sm:p-6 md:p-12 bg-gradient-to-br from-[#1A1A1A] to-[#333] dark:from-[#1A1A1A] dark:to-[#0A0A0A] text-white flex flex-col justify-between min-h-[220px] sm:min-h-[260px] md:min-h-[300px] group overflow-hidden relative">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'rgba(255,255,255,0.05)\'/%3E%3C/svg%3E')] opacity-50" />
					<div className="flex justify-between items-start gap-3 relative z-10">
						<span className="font-mono text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-widest text-gray-400 uppercase">VOL. 总体量 // {stats.label}</span>
						<Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:text-white transition-colors duration-500 shrink-0" />
					</div>
					<div className="relative z-10 mt-auto pt-10 sm:pt-12 md:pt-16">
						<p className="font-serif font-black text-5xl sm:text-6xl md:text-8xl tracking-tighter mb-3 sm:mb-4 leading-none">
							{stats.total.toLocaleString()}
						</p>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-mono tracking-[0.2em] sm:tracking-widest text-gray-400">
							<span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> {stats.gender.malePercent}% M</span>
							<span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" /> {stats.gender.femalePercent}% F</span>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-4 md:gap-6">
					{/* Gender Ratio Mini Bento */}
					<div className="editorial-card flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-between">
						<div className="flex justify-between items-start gap-3 mb-5 md:mb-8">
							<span className="font-serif font-bold text-lg sm:text-xl text-[#1A1A1A] dark:text-[#E5E5E5]">性别分布结构</span>
							<Heart className="w-5 h-5 text-gray-400 dark:text-gray-600 shrink-0" />
						</div>
						<div className="space-y-3 md:space-y-4">
							<div className="h-4 w-full bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden flex relative">
								<div
									className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-1000"
									style={{ width: `${stats.gender.malePercent}%` }}
								/>
							</div>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 font-mono text-xs sm:text-sm">
								<span className="text-blue-600 dark:text-blue-400">男 M: {stats.gender.malePercent}%</span>
								<span className="text-gray-500 tracking-[0.18em] text-[11px] sm:text-xs">RATIO {stats.gender.ratio}:1</span>
								<span className="text-rose-600 dark:text-rose-400">女 F: {stats.gender.femalePercent}%</span>
							</div>
						</div>
					</div>

					{/* Unique Names Mini Bento */}
					<div className="editorial-card flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-between bg-sys-accent/5 dark:bg-sys-accent-dark/5 border-sys-accent/20">
						<div className="flex justify-between items-start gap-3 mb-4">
							<span className="font-serif font-bold text-lg sm:text-xl text-sys-accent dark:text-sys-accent-dark">绝对唯一姓名</span>
							<Fingerprint className="w-5 h-5 text-sys-accent/50 dark:text-sys-accent-dark/50 shrink-0" />
						</div>
						<div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-4">
							<p className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1A1A] dark:text-[#E5E5E5]">
								{stats.uniqueNamesCount.toLocaleString()}
							</p>
							<p className="font-mono text-xs sm:text-sm text-gray-500 tracking-[0.16em] sm:tracking-widest sm:mb-1 uppercase">
								({stats.uniqueNamesPercent}% of TOTAL)
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Year Stats Timeline (if 'all') */}
			{stats.yearStats && (
				<div className="editorial-card p-5 sm:p-6 md:p-12">
					<div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 border-b border-sys-border dark:border-sys-border-dark pb-4 md:pb-6">
						<GraduationCap className="w-6 h-6 text-gray-400" />
						<h3 className="font-serif font-bold text-xl md:text-2xl text-[#1A1A1A] dark:text-[#E5E5E5]">生源年度轴线</h3>
						<span className="font-mono text-xs tracking-widest text-gray-400 ml-auto hidden sm:block uppercase">Population Timeline</span>
					</div>
					<div className="space-y-5 md:space-y-8">
						{Object.entries(stats.yearStats)
							.sort(([a], [b]) => b.localeCompare(a))
							.map(([year, data]) => (
								<div key={year} className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
								<div className="font-mono font-medium text-base sm:text-lg tracking-widest shrink-0 border-l-2 border-sys-accent dark:border-sys-accent-dark pl-3 sm:pl-4 text-[#1A1A1A] dark:text-[#E5E5E5]">
										{year}
									</div>
									<div className="flex-1 min-w-0">
										<div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full relative overflow-hidden">
											<div
												className="absolute top-0 left-0 h-full bg-[#1A1A1A] dark:bg-[#E5E5E5] transition-all duration-1000 group-hover:bg-sys-accent dark:group-hover:bg-sys-accent-dark"
												style={{ width: `${Math.min((data.total / stats.total) * 100 * 5, 100)}%` }}
											/>
										</div>
									</div>
									<div className="font-mono text-xs sm:text-sm tracking-[0.18em] sm:tracking-widest text-gray-500 text-left sm:text-right shrink-0 uppercase">
										{data.total.toLocaleString()} // {data.ratio} M/F
									</div>
								</div>
							))}
					</div>
				</div>
			)}
		</div>
	);

	const renderSurnames = () => (
		<div className="space-y-4 md:space-y-6 animate-slide-up">
			<div className="editorial-card p-5 md:p-12 overflow-hidden">
				<div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 border-b border-sys-border dark:border-sys-border-dark pb-4 md:pb-6 min-w-0">
					<Crown className="w-5 h-5 md:w-6 md:h-6 text-gray-400 shrink-0" />
					<h3 className="font-serif font-bold text-xl md:text-3xl text-[#1A1A1A] dark:text-[#E5E5E5] min-w-0">大宗百家姓</h3>
					<span className="font-mono text-xs tracking-widest text-gray-400 ml-auto uppercase hidden md:block">TOP 20 SURNAMES</span>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-3 md:gap-y-6">
					{stats.surnames.slice(0, 20).map((item, index) => (
						<div key={item.name} className="flex items-center gap-3 md:gap-6 group hover:bg-[#FAFAFA] dark:hover:bg-[#111111] p-2.5 md:p-3 rounded-xl transition-colors min-w-0">
							<span className={`w-8 font-mono text-xs font-bold tracking-widest ${index < 3 ? 'text-sys-accent dark:text-sys-accent-dark' : 'text-gray-400'}`}>
								{(index + 1).toString().padStart(2, '0')}
							</span>
							<span className="text-2xl md:text-3xl font-serif font-bold text-[#1A1A1A] dark:text-[#E5E5E5] shrink-0">{item.name}</span>
							<div className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-800 relative">
								<div 
									className="absolute top-0 left-0 h-full bg-gray-400 dark:bg-gray-500"
									style={{ width: `${(item.count / stats.surnames[0].count) * 100}%` }}
								/>
							</div>
							<span className="font-mono text-xs md:text-sm tracking-[0.16em] md:tracking-widest text-gray-500 text-right shrink-0 whitespace-nowrap">
								{item.count}
							</span>
						</div>
					))}
				</div>
			</div>

			{stats.rareNames.length > 0 && (
				<div className="editorial-card p-5 md:p-12 bg-[#FAFAFA] dark:bg-[#111111] border-none relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-gray-300 dark:bg-gray-700" />
					<h3 className="font-serif font-bold text-lg md:text-xl text-gray-500 mb-4 md:mb-6 uppercase tracking-[0.16em] md:tracking-widest">珍稀姓氏萃选 (≤3人)</h3>
					<div className="flex flex-wrap gap-3 md:gap-4">
						{stats.rareNames.slice(0, 40).map((item) => (
							<div key={item.name} className="flex items-baseline gap-2">
								<span className="font-serif text-2xl text-[#1A1A1A] dark:text-[#E5E5E5]">{item.name}</span>
								<span className="font-mono text-[10px] text-gray-400 border border-gray-200 dark:border-gray-800 rounded px-1">{item.count}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);

	const renderDuplicates = () => (
		<div className="editorial-card p-5 md:p-12 animate-slide-up overflow-hidden">
			<div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 border-b border-sys-border dark:border-sys-border-dark pb-4 md:pb-6 min-w-0">
				<Users className="w-5 h-5 md:w-6 md:h-6 text-gray-400 shrink-0" />
				<h3 className="font-serif font-bold text-xl md:text-3xl text-[#1A1A1A] dark:text-[#E5E5E5] min-w-0">重名巅峰榜</h3>
				<span className="font-mono text-xs tracking-widest text-gray-400 ml-auto uppercase hidden md:block">Highest Duplication Frequency</span>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 md:gap-y-4">
				{stats.topDuplicates.slice(0, 30).map((item, index) => (
					<div key={item.name} className="flex items-center justify-between gap-3 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800/50 group min-w-0">
						<div className="flex items-center gap-3 md:gap-6 min-w-0">
							<span className={`font-mono text-xs tracking-widest w-6 ${index < 3 ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
								{(index + 1).toString().padStart(2, '0')}
							</span>
							<span className="font-serif font-bold text-lg md:text-xl tracking-wide md:tracking-widest text-[#1A1A1A] dark:text-[#E5E5E5] truncate">{item.name}</span>
						</div>
						<span className="font-mono text-xs md:text-sm text-gray-500 bg-gray-50 dark:bg-[#1A1A1A] px-2.5 md:px-3 py-1 rounded shrink-0 whitespace-nowrap">
							{item.count} 人
						</span>
					</div>
				))}
			</div>
		</div>
	);

	const renderGivenNames = () => (
		<div className="editorial-card p-5 md:p-12 animate-slide-up bg-[#FAFAFA] dark:bg-[#111111] overflow-hidden">
			<div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-12 border-b border-sys-border dark:border-sys-border-dark pb-4 md:pb-6 min-w-0">
				<Type className="w-5 h-5 md:w-6 md:h-6 text-gray-400 shrink-0" />
				<h3 className="font-serif font-bold text-xl md:text-3xl text-[#1A1A1A] dark:text-[#E5E5E5] min-w-0">名讳偏好趋势</h3>
				<span className="font-mono text-xs tracking-widest text-gray-400 ml-auto uppercase hidden sm:block">Excluding Surnames</span>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 md:gap-y-12 gap-x-4 md:gap-x-6 text-center">
				{stats.givenNames.top.slice(0, 30).map((item, index) => (
					<div key={item.name} className="flex flex-col items-center justify-center group relative">
						<span className="font-mono text-[10px] tracking-widest text-gray-400 mb-3 opacity-50 group-hover:opacity-100 transition-opacity">NO.{index + 1}</span>
						<span className="font-serif font-black text-2xl md:text-3xl text-[#1A1A1A] dark:text-[#E5E5E5] mb-2 tracking-wide md:tracking-widest group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark transition-colors break-all">{item.name}</span>
						<span className="font-mono text-xs tracking-widest text-gray-500 border-t border-gray-200 dark:border-gray-800 pt-2 w-12">{item.count}</span>
					</div>
				))}
			</div>
		</div>
	);

	const renderCharacters = () => (
		<div className="editorial-card p-5 md:p-12 animate-slide-up overflow-hidden">
			<div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 border-b border-sys-border dark:border-sys-border-dark pb-4 md:pb-6 min-w-0">
				<Hash className="w-5 h-5 md:w-6 md:h-6 text-gray-400 shrink-0" />
				<h3 className="font-serif font-bold text-xl md:text-3xl text-[#1A1A1A] dark:text-[#E5E5E5] min-w-0">高频单字图谱</h3>
				<span className="font-mono text-xs tracking-widest text-gray-400 ml-auto uppercase hidden md:block">Character Frequency</span>
			</div>
			<div className="flex flex-wrap gap-x-5 md:gap-x-8 gap-y-6 md:gap-y-8 items-end justify-center py-4 md:py-8">
				{stats.givenNames.topChars.slice(0, 40).map((item, index) => {
					const size = index < 3 ? 'text-5xl md:text-8xl' :
								 index < 10 ? 'text-3xl md:text-5xl' :
								 index < 20 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl opacity-60';
					return (
						<div key={item.char} className={`font-serif font-bold text-[#1A1A1A] dark:text-[#E5E5E5] hover:text-sys-accent dark:hover:text-sys-accent-dark transition-colors cursor-crosshair group relative flex flex-col items-center ${size} leading-none`}>
							{item.char}
							<span className="absolute -bottom-6 font-mono text-[10px] tracking-widest text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-sys-light dark:bg-sys-dark px-1">
								{item.count}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);

	const renderLength = () => (
		<div className="space-y-4 md:space-y-6 animate-slide-up">
			<div className="editorial-card p-5 md:p-12 overflow-hidden">
				<div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 border-b border-sys-border dark:border-sys-border-dark pb-4 md:pb-6 min-w-0">
					<TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-gray-400 shrink-0" />
					<h3 className="font-serif font-bold text-xl md:text-3xl text-[#1A1A1A] dark:text-[#E5E5E5] min-w-0">构词长度生态</h3>
					<span className="font-mono text-xs tracking-widest text-gray-400 ml-auto uppercase hidden md:block">Length Distribution</span>
				</div>
				<div className="space-y-5 md:space-y-8 max-w-2xl mx-auto">
					{Object.entries(stats.nameLength.distribution)
						.sort(([a], [b]) => Number(a) - Number(b))
						.map(([len, count]) => (
							<div key={len} className="group">
								<div className="flex items-end justify-between gap-3 font-serif text-base md:text-lg mb-2 text-[#1A1A1A] dark:text-[#E5E5E5]">
									<span>{len} 字</span>
									<span className="font-mono text-xs md:text-sm text-gray-500 tracking-[0.14em] md:tracking-widest text-right shrink-0">
										{count.toLocaleString()} ({(count / stats.total * 100).toFixed(1)}%)
									</span>
								</div>
								<div className="h-[2px] bg-gray-100 dark:bg-gray-800">
									<div
										className="h-full bg-sys-accent dark:bg-sys-accent-dark transition-all duration-1000 origin-left transform group-hover:scale-y-200"
										style={{ width: `${(count / stats.total) * 100}%` }}
									/>
								</div>
							</div>
						))}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
				<div className="editorial-card p-5 md:p-8">
					<h4 className="font-serif font-bold text-lg md:text-xl mb-4 md:mb-6 text-[#1A1A1A] dark:text-[#E5E5E5] border-l-2 border-gray-300 dark:border-gray-700 pl-3 md:pl-4">
						极简之极 ({stats.nameLength.shortest.length}字)
					</h4>
					<div className="flex flex-wrap gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
						{stats.nameLength.shortest.names.map((name) => (
							<span key={name} className="font-serif font-bold text-xl md:text-2xl text-[#1A1A1A] dark:text-[#E5E5E5]">
								{name}
							</span>
						))}
					</div>
				</div>
				<div className="editorial-card p-5 md:p-8">
					<h4 className="font-serif font-bold text-lg md:text-xl mb-4 md:mb-6 text-[#1A1A1A] dark:text-[#E5E5E5] border-l-2 border-gray-300 dark:border-gray-700 pl-3 md:pl-4">
						修长之极 ({stats.nameLength.longest.length}字)
					</h4>
					<div className="flex flex-wrap gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
						{stats.nameLength.longest.names.map((name) => (
							<span key={name} className="font-serif font-bold text-xl md:text-2xl text-[#1A1A1A] dark:text-[#E5E5E5] break-all">
								{name}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);

	const renderInteresting = () => (
		<div className="space-y-4 md:space-y-6 animate-slide-up">
			{stats.interesting.sameCharNames.length > 0 && (
				<div className="editorial-card p-5 md:p-12">
					<div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-8">
						<Sparkles className="w-5 h-5 text-gray-400 shrink-0" />
						<h3 className="font-serif font-bold text-xl md:text-2xl text-[#1A1A1A] dark:text-[#E5E5E5]">双声叠韵 ({stats.interesting.sameCharNames.length})</h3>
					</div>
					<div className="flex flex-wrap gap-4 md:gap-6 text-gray-500 dark:text-gray-400">
						{stats.interesting.sameCharNames.slice(0, 40).map((name) => (
							<span key={name} className="font-serif text-lg md:text-xl hover:text-sys-accent dark:hover:text-sys-accent-dark transition-colors cursor-default">
								{name}
							</span>
						))}
					</div>
				</div>
			)}

			{stats.interesting.celebrityLikeNames.length > 0 && (
				<div className="editorial-card p-5 md:p-12 bg-gray-50 dark:bg-[#111111]/50 border-none">
					<div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-8">
						<span className="w-2 h-2 rounded-full bg-sys-accent dark:bg-sys-accent-dark" />
						<h3 className="font-serif font-bold text-xl md:text-2xl text-[#1A1A1A] dark:text-[#E5E5E5]">名人轶韵</h3>
					</div>
					<div className="flex flex-wrap gap-4 md:gap-8">
						{stats.interesting.celebrityLikeNames.map((name) => (
							<span key={name} className="font-serif font-black text-2xl md:text-3xl tracking-wide md:tracking-widest text-[#1A1A1A] dark:text-[#E5E5E5] break-all">
								{name}
							</span>
						))}
					</div>
				</div>
			)}
		</div>
	);

	const renderColleges = () => (
		<div className="editorial-card p-5 md:p-12 animate-slide-up overflow-hidden">
			<div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 border-b border-sys-border dark:border-sys-border-dark pb-4 md:pb-6 min-w-0">
				<GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-gray-400 shrink-0" />
				<h3 className="font-serif font-bold text-xl md:text-3xl text-[#1A1A1A] dark:text-[#E5E5E5] min-w-0">院系专业序列</h3>
				<span className="font-mono text-xs tracking-widest text-gray-400 ml-auto uppercase hidden md:block">Major Distribution TOP 20</span>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 md:gap-y-6">
				{stats.colleges.slice(0, 20).map((item, index) => (
					<div key={item.name} className="relative group">
						<div className="flex justify-between items-baseline gap-3 mb-2 min-w-0">
							<span className="font-serif text-sm md:text-base text-[#1A1A1A] dark:text-[#E5E5E5] flex items-center gap-2 md:gap-3 min-w-0">
								<span className="font-mono text-xs text-gray-400">{(index + 1).toString().padStart(2, '0')}</span>
								<span className="truncate">{item.name}</span>
							</span>
							<span className="font-mono text-xs md:text-sm tracking-[0.14em] md:tracking-widest text-gray-500 shrink-0">
								{item.count.toLocaleString()}
							</span>
						</div>
						<div className="h-[1px] w-full bg-gray-100 dark:bg-gray-800">
							<div className="h-full bg-gray-400 dark:bg-gray-600 transition-all duration-700" style={{ width: `${(item.count / stats.colleges[0].count) * 100}%` }} />
						</div>
					</div>
				))}
			</div>
		</div>
	);

	const renderCurrentPage = () => {
		switch (PAGES[currentPage].id) {
			case "overview": return renderOverview();
			case "surnames": return renderSurnames();
			case "duplicates": return renderDuplicates();
			case "givenNames": return renderGivenNames();
			case "characters": return renderCharacters();
			case "length": return renderLength();
			case "interesting": return renderInteresting();
			case "colleges": return renderColleges();
			default: return renderOverview();
		}
	};

	return (
		<div className="max-w-[58rem] mx-auto w-full min-w-0 overflow-x-hidden pb-12 md:pb-16">
			
			{/* Minimal Header */}
			<div className="pt-4 md:pt-8 mb-8 md:mb-12">
				<h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-black tracking-tight text-[#1A1A1A] dark:text-[#E5E5E5] mb-3 md:mb-4">
					数据统计视界
					<span className="text-sys-accent dark:text-sys-accent-dark">.</span>
				</h1>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm font-mono text-gray-500 uppercase tracking-[0.18em] sm:tracking-widest mt-4 md:mt-6">
					<span>DATA_HORIZON // ANALYTICS</span>
					<span className="hidden sm:block w-8 h-px bg-gray-300 dark:bg-gray-700" />
					<span>BASED ON {stats?.total.toLocaleString() || 0} RECORDS</span>
				</div>
			</div>

			{/* Filter Section */}
			<div
				ref={yearFilterRef}
				onScroll={(e) => {
					yearFilterScrollLeftRef.current = e.currentTarget.scrollLeft;
				}}
				className="flex overflow-x-auto gap-2 mb-8 md:mb-10 pb-3 md:pb-4 scrollbar-hide border-b border-sys-border dark:border-sys-border-dark"
			>
				{YEAR_OPTIONS.map((option) => (
					<button
						key={option.value}
						type="button"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => setSelectedYear(option.value)}
						className={`shrink-0 px-4 sm:px-5 md:px-6 py-2 rounded-full font-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-widest transition-colors ${
							selectedYear === option.value 
								? 'bg-[#1A1A1A] text-white dark:bg-[#E5E5E5] dark:text-[#1A1A1A]' 
								: 'bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] hover:text-[#1A1A1A] dark:hover:text-[#E5E5E5]'
						}`}
					>
						{option.label}
					</button>
				))}
			</div>

			{/* Sub-Navigation Grid (Bento Style) */}
			<div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-8 md:mb-12">
				{PAGES.map((page, index) => {
					const Icon = page.icon;
					return (
						<button
							key={page.id}
							onClick={() => setCurrentPage(index)}
							className={`flex flex-col items-center justify-center p-2.5 md:p-4 gap-2 md:gap-3 rounded-xl md:rounded-2xl transition-colors duration-200 ${
								currentPage === index 
									? 'bg-sys-light-card dark:bg-sys-dark-card border border-sys-border dark:border-sys-border-dark shadow-sm text-[#1A1A1A] dark:text-[#E5E5E5]' 
									: 'bg-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-600 dark:hover:text-gray-300 border border-transparent'
							}`}
						>
							<Icon className="h-4 w-4 md:h-5 md:w-5" />
							<span className="font-serif text-xs hidden md:block">{page.title}</span>
						</button>
					);
				})}
			</div>

			{/* Main Display Area */}
			<div className="min-h-[60vh]">
				{renderCurrentPage()}
			</div>
		</div>
	);
};

export default StatsPage;
