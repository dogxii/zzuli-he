import { Database, Hash, Loader2, RefreshCw, Search, User, Command } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Grade, PinyinTable, Student, StudentData } from "../types";

interface LoadingState {
	isLoading: boolean;
	progress: number;
	loadedYears: string[];
	error: string | null;
}

const CACHE_KEY = "zzuli_students_cache";
const CACHE_VERSION = "v2";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; 

interface CachedData {
	version: string;
	timestamp: number;
	studentsData: { [key: string]: Student[] };
	pinyinTable: PinyinTable;
}

const isChinese = (str: string): boolean => /^[\u4e00-\u9fa5]+$/.test(str);
const isStudentNumber = (str: string): boolean => /^542[1-5]\d{8}$/.test(str);
const isPartialStudentNumber = (str: string): boolean => /^\d{4,}$/.test(str);

type SearchMode = "exact_id" | "full_name" | "pinyin_initials";

const GRADE_OPTIONS: Array<{ value: Grade | "all"; label: string }> = [
	{ value: "all", label: "ALL_YEARS [ * ]" },
	{ value: "25", label: "CLASS_25" },
	{ value: "24", label: "CLASS_24" },
	{ value: "23", label: "CLASS_23" },
	{ value: "22", label: "CLASS_22" },
	{ value: "21", label: "CLASS_21" },
];

const SEARCH_MODE_CONFIG: Record<SearchMode, { label: string; sub: string; hint: string }> = {
	exact_id: {
		label: "学号检索",
		sub: "EXACT_ID_MATCH",
		hint: "输入完整学号时精确命中，输入 4 位以上数字时自动执行学号片段检索。",
	},
	full_name: {
		label: "姓名检索",
		sub: "FULL_NAME_MATCH",
		hint: "支持中文姓名包含匹配，适合按全名或部分姓名快速筛选。",
	},
	pinyin_initials: {
		label: "首拼检索",
		sub: "PINYIN_INITIALS",
		hint: "输入姓名首字母即可检索，例如 `zsf` 可匹配对应拼音首拼。",
	},
};

const getSearchMode = (term: string): SearchMode => {
	const trimmed = term.trim();
	if (isStudentNumber(trimmed) || isPartialStudentNumber(trimmed)) return "exact_id";
	if (isChinese(trimmed)) return "full_name";
	return "pinyin_initials";
};

const loadFromCache = (): CachedData | null => {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (!cached) return null;
		const data: CachedData = JSON.parse(cached);
		if (data.version !== CACHE_VERSION) return null;
		if (Date.now() - data.timestamp > CACHE_EXPIRY) {
			localStorage.removeItem(CACHE_KEY);
			return null;
		}
		return data;
	} catch {
		localStorage.removeItem(CACHE_KEY);
		return null;
	}
};

const saveToCache = (studentsData: { [key: string]: Student[] }, pinyinTable: PinyinTable) => {
	try {
		const cacheData: CachedData = {
			version: CACHE_VERSION,
			timestamp: Date.now(),
			studentsData,
			pinyinTable,
		};
		localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
	} catch (e) {
		console.warn("缓存保存失败:", e);
	}
};

const SearchPage: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedGrade, setSelectedGrade] = useState<Grade | "all">("all");
	const [results, setResults] = useState<Student[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [studentsData, setStudentsData] = useState<{ [key: string]: Student[] }>({});
	const [pinyinTable, setPinyinTable] = useState<PinyinTable>({});
	const [loadingState, setLoadingState] = useState<LoadingState>({
		isLoading: true,
		progress: 0,
		loadedYears: [],
		error: null,
	});

	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dataLoadedRef = useRef(false);

	const loadData = useCallback(async (forceRefresh = false) => {
		if (dataLoadedRef.current && !forceRefresh) return;
		if (!forceRefresh) {
			const cached = loadFromCache();
			if (cached && Object.keys(cached.studentsData).length > 0) {
				setStudentsData(cached.studentsData);
				setPinyinTable(cached.pinyinTable);
				setLoadingState({
					isLoading: false,
					progress: 100,
					loadedYears: ["2021", "2022", "2023", "2024", "2025"],
					error: null,
				});
				dataLoadedRef.current = true;
				return;
			}
		}

		setLoadingState({ isLoading: true, progress: 0, loadedYears: [], error: null });

		try {
			const pinyinResponse = await fetch("/example/pinyinTable.json");
			if (!pinyinResponse.ok) throw new Error("拼音表加载失败");
			const pinyinData = await pinyinResponse.json();
			setPinyinTable(pinyinData);

			setLoadingState((prev) => ({ ...prev, progress: 10 }));
			const years = ["2021", "2022", "2023", "2024", "2025"];
			const data: { [key: string]: Student[] } = {};

			const loadPromises = years.map(async (year) => {
				try {
					const response = await fetch(`https://cdn.jsdmirror.com/gh/dogxii/zzuli-he@main/public/example/${year}.json`);
					if (!response.ok) {
						const fallbackResponse = await fetch(`/example/${year}.json`);
						if (!fallbackResponse.ok) throw new Error(`${year}数据加载失败`);
						const yearData: StudentData = await fallbackResponse.json();
						return { year, data: yearData.aaData || [] };
					}
					const yearData: StudentData = await response.json();
					return { year, data: yearData.aaData || [] };
				} catch (error) {
					console.error(`加载 ${year} 数据失败:`, error);
					return { year, data: [] };
				}
			});

			const loadedResults = await Promise.all(loadPromises);
			loadedResults.forEach((result, index) => {
				data[result.year] = result.data;
				setLoadingState((prev) => ({
					...prev,
					progress: 10 + ((index + 1) / years.length) * 90,
					loadedYears: [...prev.loadedYears, result.year],
				}));
			});

			setStudentsData(data);
			saveToCache(data, pinyinData);

			setLoadingState({ isLoading: false, progress: 100, loadedYears: years, error: null });
			dataLoadedRef.current = true;
		} catch (error) {
			console.error("加载数据失败:", error);
			setLoadingState((prev) => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : "数据加载失败，请刷新重试",
			}));
		}
	}, []);

	useEffect(() => { loadData(); }, [loadData]);

	const getInitials = useCallback((str: string): string => {
		let initials = "";
		for (const char of str) initials += pinyinTable[char] || "";
		return initials.toLowerCase();
	}, [pinyinTable]);

	const performSearch = useCallback((term: string, grade: Grade | "all") => {
		if (!term.trim()) {
			setResults([]);
			setIsSearching(false);
			return;
		}

		const hasData = Object.values(studentsData).some((arr) => arr.length > 0);
		if (!hasData) {
			setResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		const searchTermTrimmed = term.trim();
		const searchResults: Student[] = [];
		const yearsToSearch = grade === "all" ? ["2021", "2022", "2023", "2024", "2025"] : [`20${grade}`];

		for (const year of yearsToSearch) {
			const yearData = studentsData[year] || [];
			if (isStudentNumber(searchTermTrimmed) || isPartialStudentNumber(searchTermTrimmed)) {
				if (isStudentNumber(searchTermTrimmed)) {
					const result = yearData.find((student) => student.XH === searchTermTrimmed);
					if (result) searchResults.push(result);
				} else {
					searchResults.push(...yearData.filter((student) => student.XH.includes(searchTermTrimmed)));
				}
			} else if (isChinese(searchTermTrimmed)) {
				searchResults.push(...yearData.filter((student) => student.XM.includes(searchTermTrimmed)));
			} else {
				searchResults.push(...yearData.filter((student) => getInitials(student.XM).includes(searchTermTrimmed.toLowerCase())));
			}
		}

		const uniqueResults = searchResults
			.filter((student, index, self) => index === self.findIndex((s) => s.XH === student.XH))
			.slice(0, 100);

		setResults(uniqueResults);
		setIsSearching(false);
	}, [studentsData, getInitials]);

	useEffect(() => {
		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
		if (!searchTerm.trim()) { setResults([]); return; }
		searchTimeoutRef.current = setTimeout(() => { performSearch(searchTerm, selectedGrade); }, 300);
		return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
	}, [searchTerm, selectedGrade, performSearch]);

	const handleRefresh = () => {
		dataLoadedRef.current = false;
		localStorage.removeItem(CACHE_KEY);
		loadData(true);
	};

	const totalStudents = Object.values(studentsData).reduce((sum, arr) => sum + arr.length, 0);
	const activeSearchMode = getSearchMode(searchTerm);

	return (
		<div className="w-full max-w-5xl mx-auto flex flex-col gap-6 md:gap-10 animate-fade-in relative flex-1">
			
			{/* Tech Dashboard Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4 md:mt-8">
				<div className="relative">
					<div className="font-mono text-sys-accent dark:text-sys-accent-dark text-[10px] tracking-[0.3em] mb-2 font-bold uppercase">
						// TERMINAL_ACCESS
					</div>
					<h1 className="text-3xl md:text-5xl font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
						<div className="h-6 md:h-10 w-1.5 md:w-2 bg-sys-accent dark:bg-sys-accent-dark" />
						系统学籍检索
					</h1>
				</div>

				{!loadingState.isLoading && !loadingState.error && totalStudents > 0 && (
					<div className="tech-panel py-2 px-4 rounded-sm flex items-center gap-3 text-xs font-mono uppercase bg-white/50 dark:bg-slate-900/50 backdrop-blur self-start md:self-end">
						<Database className="h-4 w-4 text-sys-accent dark:text-sys-accent-dark" />
						<span className="text-slate-600 dark:text-slate-400">DATA_VOL:</span>
						<span className="font-bold text-slate-800 dark:text-slate-200">{totalStudents.toLocaleString()}</span>
						<button onClick={handleRefresh} className="ml-2 pl-2 border-l border-sys-border dark:border-sys-border-dark text-slate-400 hover:text-sys-accent dark:hover:text-sys-accent-dark transition-colors" aria-label="Sync Database">
							<RefreshCw className="h-3 w-3" />
						</button>
					</div>
				)}
			</div>

			{/* Loading State */}
			{loadingState.isLoading && (
				<div className="tech-panel p-6 border-l-4 border-l-sys-accent dark:border-l-sys-accent-dark clip-edge relative overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur">
					<div className="absolute top-0 right-0 w-32 h-32 bg-sys-accent/10 dark:bg-sys-accent-dark/10 blur-2xl rounded-full" />
					<div className="flex flex-col gap-4 relative z-10">
						<div className="flex items-center gap-3">
							<Loader2 className="h-5 w-5 text-sys-accent dark:text-sys-accent-dark animate-spin" />
							<span className="font-sans font-bold text-lg text-slate-800 dark:text-slate-200 uppercase tracking-widest">Init Core Components...</span>
						</div>
						<div className="w-full h-1 bg-slate-200 dark:bg-slate-800 relative">
							<div className="absolute top-0 left-0 h-full bg-sys-accent dark:bg-sys-accent-dark transition-all duration-300" style={{ width: `${loadingState.progress}%` }} />
						</div>
						<div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
							<span>[ LOAD_PROGRESS: {Math.round(loadingState.progress)}% ]</span>
							<span>CHUNKS: {loadingState.loadedYears.join(", ")}</span>
						</div>
					</div>
				</div>
			)}

			{/* Error State */}
			{loadingState.error && (
				<div className="tech-panel p-6 border-l-4 border-l-red-500 clip-edge bg-red-50/50 dark:bg-red-950/20 backdrop-blur">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<span className="font-mono text-sm font-bold tracking-widest text-red-600 dark:text-red-400">ERROR_CODE: {loadingState.error}</span>
						<button onClick={handleRefresh} className="tech-btn-outline bg-transparent border-red-500 text-red-600 hover:bg-red-500 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-slate-900 py-1.5 px-4 text-xs">
							<RefreshCw className="h-3 w-3" /> RE-INITIALIZE
						</button>
					</div>
				</div>
			)}

			{/* Search Input Area */}
			<div className="relative group z-10 mb-4">
				<div className="flex flex-col md:flex-row md:items-stretch gap-0">
					<div className="flex-1 w-full relative">
						<div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
							<Command className="h-4 w-4 text-slate-400 dark:text-slate-500" />
						</div>
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder={loadingState.isLoading ? "AWAITING..." : "ENTER ID, NAME, OR PINYIN..."}
							disabled={loadingState.isLoading}
							className="tech-input min-h-[64px] pl-4 md:pl-14 pr-4 py-4 md:py-5 border-t border-b border-l bg-white/80 dark:bg-slate-900/80 backdrop-blur w-full font-mono text-sm md:text-lg tracking-[0.2em] uppercase"
						/>
						{/* Scanline effect on focus */}
						<div className="absolute bottom-0 left-0 h-px bg-sys-accent dark:bg-sys-accent-dark w-0 group-focus-within:w-full transition-all duration-500 ease-out z-20" />
					</div>
					
					<div className="hidden md:block w-full md:w-44 lg:w-40 shrink-0 relative">
						<select
							value={selectedGrade}
							onChange={(e) => setSelectedGrade(e.target.value as typeof selectedGrade)}
							disabled={loadingState.isLoading}
							className="w-full min-h-[64px] appearance-none tech-input py-4 md:py-5 pl-4 pr-12 border text-center font-mono text-xs md:text-sm tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur cursor-pointer uppercase transition-colors"
						>
							{GRADE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
						{/* Tech drop icon */}
						<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-sys-border dark:border-sys-border-dark pl-3 opacity-50">
							<div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-current"></div>
						</div>
					</div>
				</div>
				<div className="md:hidden mt-3 grid grid-cols-3 gap-2">
					{GRADE_OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => setSelectedGrade(option.value)}
							className={`min-w-0 rounded-md border px-2 py-2.5 text-[10px] font-mono tracking-[0.14em] uppercase transition-colors ${
								selectedGrade === option.value
									? "border-sys-accent bg-sys-accent/10 text-sys-accent dark:border-sys-accent-dark dark:bg-sys-accent-dark/10 dark:text-sys-accent-dark"
									: "border-sys-border text-slate-500 bg-white/70 dark:border-sys-border-dark dark:bg-slate-900/60 dark:text-slate-400"
							}`}
						>
							{option.value === "all" ? "全部" : option.value}
						</button>
					))}
				</div>
				{searchTerm.trim() && !loadingState.isLoading && (
					<div className="mt-3 flex items-center gap-2 flex-wrap text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
						<span className="px-2.5 py-1 border border-sys-accent/30 dark:border-sys-accent-dark/30 bg-sys-accent/5 dark:bg-sys-accent-dark/10 text-sys-accent dark:text-sys-accent-dark rounded-sm font-bold">
							{SEARCH_MODE_CONFIG[activeSearchMode].sub}
						</span>
						<span>{SEARCH_MODE_CONFIG[activeSearchMode].hint}</span>
					</div>
				)}
			</div>

			{/* Results Grid / Table */}
			{isSearching ? (
				<div className="flex flex-col items-center justify-center py-20 gap-4 tech-panel bg-white/30 dark:bg-slate-900/30 backdrop-blur">
					<Loader2 className="w-8 h-8 text-sys-accent dark:text-sys-accent-dark animate-spin" />
					<div className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-slate-400">
						<div className="w-1.5 h-1.5 bg-sys-accent dark:bg-sys-accent-dark rounded-full animate-pulse" />
						SCANNING_DATABASE...
					</div>
				</div>
			) : results.length > 0 ? (
				<div className="animate-slide-up bg-white/50 dark:bg-slate-900/50 backdrop-blur tech-panel p-1 rounded-sm border-t-4 border-t-sys-accent dark:border-t-sys-accent-dark flex-1 flex flex-col min-h-0">
					
					{/* Result Header */}
					<div className="flex items-center justify-between p-3 md:p-4 border-b border-sys-border dark:border-sys-border-dark font-mono text-[10px] md:text-xs text-slate-500 tracking-widest uppercase bg-slate-50 dark:bg-slate-800/50">
						<span className="flex items-center gap-2">
							<span className="w-1 h-3 bg-sys-accent dark:bg-sys-accent-dark inline-block" />
							QUERY_RESULTS
						</span>
						<span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-sm font-bold">
							MATCH: {results.length >= 100 ? "100+" : results.length}
						</span>
					</div>

					{/* Mobile Cards for small screens, Table for larger screens */}
					<div className="overflow-auto scrollbar-hide flex-1">
						{/* Desktop Table view */}
						<table className="w-full text-left hidden md:table border-collapse">
							<thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur z-10 shadow-sm shadow-black/5">
								<tr className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
									<th className="py-4 px-6 border-b border-sys-border dark:border-sys-border-dark">ID_NUM</th>
									<th className="py-4 px-6 border-b border-sys-border dark:border-sys-border-dark">FULL_NAME</th>
									<th className="py-4 px-6 border-b border-sys-border dark:border-sys-border-dark">CLASS_GROUP</th>
									<th className="py-4 px-6 border-b border-sys-border dark:border-sys-border-dark">SEX</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-sys-border/50 dark:divide-sys-border-dark/50">
								{results.map((student) => (
									<tr 
										key={student.XH} 
										className="group hover:bg-sys-accent/5 dark:hover:bg-sys-accent-dark/10 transition-colors"
									>
										<td className="py-3.5 px-6 font-mono text-sm tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark transition-colors">
											{student.XH}
										</td>
										<td className="py-3.5 px-6 font-sans font-bold text-base md:text-lg tracking-wide text-slate-800 dark:text-slate-100">
											{student.XM}
										</td>
										<td className="py-3.5 px-6 font-sans text-xs md:text-sm text-slate-500 dark:text-slate-400">
											{student.BJMC}
										</td>
										<td className="py-3.5 px-6">
											<span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase border ${
												student.XB === "男性" 
													? "bg-blue-50/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50" 
													: "bg-rose-50/80 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800/50"
											}`}>
												{student.XB === "男性" ? "MALE" : "FEMALE"}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{/* Mobile Card view */}
						<div className="md:hidden flex flex-col gap-2 p-2">
							{results.map((student) => (
								<div key={student.XH} className="bg-white dark:bg-slate-800/50 border border-sys-border dark:border-sys-border-dark p-3 rounded flex flex-col gap-2 active:bg-sys-light dark:active:bg-slate-800 transition-colors">
									<div className="flex justify-between items-start">
										<span className="font-sans font-bold text-lg text-slate-800 dark:text-slate-100 leading-none">{student.XM}</span>
										<span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest uppercase border ${
												student.XB === "男性" 
													? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" 
													: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800"
											}`}>
												{student.XB === "男性" ? "MALE" : "FEMALE"}
										</span>
									</div>
									<div className="flex justify-between items-end border-t border-dashed border-sys-border dark:border-sys-border-dark pt-2 mt-1">
										<span className="font-mono text-xs tracking-wider text-slate-500 dark:text-slate-400">{student.XH}</span>
										<span className="font-sans text-[10px] text-slate-400 dark:text-slate-500 max-w-[60%] text-right truncate">{student.BJMC}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			) : searchTerm && !isSearching && !loadingState.isLoading ? (
				<div className="py-20 flex flex-col items-center text-center space-y-4 tech-panel bg-white/30 dark:bg-slate-900/30 backdrop-blur border-dashed">
					<div className="text-slate-300 dark:text-slate-700 relative">
						<Command className="h-10 w-10 absolute opacity-50 blur-sm" />
						<Command className="h-10 w-10 relative z-10" />
					</div>
					<div className="space-y-1 mt-2">
						<h3 className="font-sans font-bold text-lg text-slate-700 dark:text-slate-300 tracking-wider">NO_MATCH_FOUND</h3>
						<p className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">Refine search parameters.</p>
					</div>
				</div>
			) : !loadingState.isLoading ? (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 pt-0 md:pt-4 animate-slide-up w-full">
					{[
						{ icon: Hash, mode: "exact_id" as SearchMode },
						{ icon: User, mode: "full_name" as SearchMode },
						{ icon: Search, mode: "pinyin_initials" as SearchMode }
					].map((item, i) => (
						<div key={i} className="tech-panel h-[104px] md:min-h-[148px] md:h-auto p-2.5 md:p-6 flex flex-col items-center justify-center text-center group bg-white/50 dark:bg-slate-900/50 backdrop-blur clip-edge overflow-hidden">
							<div className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-3 md:mb-4 group-hover:bg-sys-accent/10 dark:group-hover:bg-sys-accent-dark/10 transition-colors">
								<item.icon className="h-5 w-5 md:h-6 md:w-6 text-slate-400 dark:text-slate-500 group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark transition-colors" />
							</div>
							<h3 className="font-sans font-bold text-xs md:text-sm text-slate-700 dark:text-slate-300 mb-1 tracking-wide md:tracking-wider">{SEARCH_MODE_CONFIG[item.mode].label}</h3>
							<p className="font-mono text-[8px] md:text-[9px] tracking-[0.15em] md:tracking-[0.2em] text-slate-400 break-all">{SEARCH_MODE_CONFIG[item.mode].sub}</p>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
};

export default SearchPage;
