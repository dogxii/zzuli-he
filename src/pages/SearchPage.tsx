import { Loader2, RefreshCw, Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Grade, PinyinTable, Student, StudentData } from "../types";

// 数据加载状态
interface LoadingState {
	isLoading: boolean;
	progress: number;
	error: string | null;
}

// 缓存键
const CACHE_KEY = "zzuli_students_cache";
const CACHE_VERSION = "v2";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

interface CachedData {
	version: string;
	timestamp: number;
	studentsData: { [key: string]: Student[] };
	pinyinTable: PinyinTable;
}

// 判断是否为中文
const isChinese = (str: string): boolean => {
	return /^[\u4e00-\u9fa5]+$/.test(str);
};

// 判断是否为完整学号格式
const isStudentNumber = (str: string): boolean => {
	return /^542[1-5]\d{8}$/.test(str);
};

// 判断是否为部分学号（4位及以上数字）
const isPartialStudentNumber = (str: string): boolean => {
	return /^\d{4,}$/.test(str);
};

// 从缓存加载数据
const loadFromCache = (): CachedData | null => {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (!cached) return null;

		const data: CachedData = JSON.parse(cached);

		// 检查版本和过期时间
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

// 保存到缓存
const saveToCache = (
	studentsData: { [key: string]: Student[] },
	pinyinTable: PinyinTable,
) => {
	try {
		const cacheData: CachedData = {
			version: CACHE_VERSION,
			timestamp: Date.now(),
			studentsData,
			pinyinTable,
		};
		localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
	} catch (e) {
		// 缓存失败不影响正常使用
		console.warn("缓存保存失败:", e);
	}
};

const SearchPage: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedGrade, setSelectedGrade] = useState<Grade | "all">("all");
	const [results, setResults] = useState<Student[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [studentsData, setStudentsData] = useState<{
		[key: string]: Student[];
	}>({});
	const [pinyinTable, setPinyinTable] = useState<PinyinTable>({});
	const [loadingState, setLoadingState] = useState<LoadingState>({
		isLoading: true,
		progress: 0,
		error: null,
	});

	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dataLoadedRef = useRef(false);

	// 加载数据
	const loadData = useCallback(async (forceRefresh = false) => {
		if (dataLoadedRef.current && !forceRefresh) return;

		// 先尝试从缓存加载
		if (!forceRefresh) {
			const cached = loadFromCache();
			if (cached && Object.keys(cached.studentsData).length > 0) {
				setStudentsData(cached.studentsData);
				setPinyinTable(cached.pinyinTable);
				setLoadingState({
					isLoading: false,
					progress: 100,
					error: null,
				});
				dataLoadedRef.current = true;
				return;
			}
		}

		setLoadingState({
			isLoading: true,
			progress: 0,
			error: null,
		});

		try {
			// 加载拼音表
			const pinyinResponse = await fetch("/example/pinyinTable.json");
			if (!pinyinResponse.ok) throw new Error("拼音表加载失败");
			const pinyinData = await pinyinResponse.json();
			setPinyinTable(pinyinData);

			setLoadingState((prev) => ({ ...prev, progress: 10 }));

			// 并行加载所有年份数据
			const years = ["2021", "2022", "2023", "2024", "2025"];
			const data: { [key: string]: Student[] } = {};

			const loadPromises = years.map(async (year) => {
				try {
					// 使用国内 CDN
					const response = await fetch(
						`https://cdn.jsdmirror.com/gh/dogxii/zzuli-he@main/public/example/${year}.json`,
					);

					if (!response.ok) {
						// 备用：直接请求
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

			// 逐个处理结果以更新进度
			const results = await Promise.all(loadPromises);

			results.forEach((result, index) => {
				data[result.year] = result.data;
				setLoadingState((prev) => ({
					...prev,
					progress: 10 + ((index + 1) / years.length) * 90,
				}));
			});

			setStudentsData(data);

			// 保存到缓存
			saveToCache(data, pinyinData);

			setLoadingState({
				isLoading: false,
				progress: 100,
				error: null,
			});

			dataLoadedRef.current = true;
		} catch (error) {
			console.error("加载数据失败:", error);
			setLoadingState((prev) => ({
				...prev,
				isLoading: false,
				error:
					error instanceof Error ? error.message : "数据加载失败，请刷新重试",
			}));
		}
	}, []);

	// 初始加载
	useEffect(() => {
		loadData();
	}, [loadData]);

	// 获取拼音首字母
	const getInitials = useCallback(
		(str: string): string => {
			let initials = "";
			for (const char of str) {
				initials += pinyinTable[char] || "";
			}
			return initials.toLowerCase();
		},
		[pinyinTable],
	);

	// 执行搜索
	const performSearch = useCallback(
		(term: string, grade: Grade | "all") => {
			if (!term.trim()) {
				setResults([]);
				setIsSearching(false);
				return;
			}

			// 检查数据是否已加载
			const hasData = Object.values(studentsData).some((arr) => arr.length > 0);
			if (!hasData) {
				setResults([]);
				setIsSearching(false);
				return;
			}

			setIsSearching(true);

			const searchTermTrimmed = term.trim();
			const searchResults: Student[] = [];

			// 确定搜索范围
			const yearsToSearch =
				grade === "all"
					? ["2021", "2022", "2023", "2024", "2025"]
					: [`20${grade}`];

			for (const year of yearsToSearch) {
				const yearData = studentsData[year] || [];

				if (
					isStudentNumber(searchTermTrimmed) ||
					isPartialStudentNumber(searchTermTrimmed)
				) {
					// 学号搜索
					if (isStudentNumber(searchTermTrimmed)) {
						const result = yearData.find(
							(student) => student.XH === searchTermTrimmed,
						);
						if (result) searchResults.push(result);
					} else {
						const partialResults = yearData.filter((student) =>
							student.XH.includes(searchTermTrimmed),
						);
						searchResults.push(...partialResults);
					}
				} else if (isChinese(searchTermTrimmed)) {
					// 姓名搜索
					const nameResults = yearData.filter((student) =>
						student.XM.includes(searchTermTrimmed),
					);
					searchResults.push(...nameResults);
				} else {
					// 拼音首字母搜索
					const pinyinResults = yearData.filter((student) => {
						const initials = getInitials(student.XM);
						return initials.includes(searchTermTrimmed.toLowerCase());
					});
					searchResults.push(...pinyinResults);
				}
			}

			// 去重并限制结果数量
			const uniqueResults = searchResults
				.filter(
					(student, index, self) =>
						index === self.findIndex((s) => s.XH === student.XH),
				)
				.slice(0, 100);

			setResults(uniqueResults);
			setIsSearching(false);
		},
		[studentsData, getInitials],
	);

	// 搜索词变化时触发搜索（带防抖）
	useEffect(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		if (!searchTerm.trim()) {
			setResults([]);
			return;
		}

		searchTimeoutRef.current = setTimeout(() => {
			performSearch(searchTerm, selectedGrade);
		}, 200);

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchTerm, selectedGrade, performSearch]);

	// 强制刷新数据
	const handleRefresh = () => {
		dataLoadedRef.current = false;
		localStorage.removeItem(CACHE_KEY);
		loadData(true);
	};

	// 计算总学生数
	const totalStudents = Object.values(studentsData).reduce(
		(sum, arr) => sum + arr.length,
		0,
	);

	return (
		<div className="mx-auto max-w-4xl">
			<header className="mb-9">
				<h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
					学生查询
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
					输入学号、姓名或拼音首字母。
				</p>
			</header>

			{loadingState.isLoading && (
				<div className="mb-6 border-l-2 border-blue-500 pl-4">
					<div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>正在加载数据</span>
					</div>
					<div className="mt-3 h-1.5 bg-slate-200 dark:bg-white/10">
						<div
							className="h-full bg-blue-500 transition-all duration-300"
							style={{ width: `${loadingState.progress}%` }}
						/>
					</div>
				</div>
			)}

			{loadingState.error && (
				<div className="mb-6 flex items-center justify-between gap-4 border-l-2 border-red-500 pl-4 text-sm">
					<span className="text-red-700 dark:text-red-300">
						{loadingState.error}
					</span>
					<button
						type="button"
						onClick={handleRefresh}
						className="inline-flex items-center gap-2 text-red-700 transition-colors hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
					>
						<RefreshCw className="h-4 w-4" />
						重试
					</button>
				</div>
			)}

			{!loadingState.isLoading && !loadingState.error && totalStudents > 0 && (
				<div className="mb-6 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-500">
					<span>{totalStudents.toLocaleString()} 条数据</span>
					<button
						type="button"
						onClick={handleRefresh}
						className="inline-flex items-center gap-1.5 transition-colors hover:text-blue-600 dark:hover:text-blue-300"
						title="刷新数据"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						刷新
					</button>
				</div>
			)}

			<section className="mb-8">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end">
					<label className="relative flex-1">
						<span className="sr-only">查询内容</span>
						<Search className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder={loadingState.isLoading ? "数据加载中" : "输入查询内容"}
							disabled={loadingState.isLoading}
							className="h-16 w-full rounded-none border-0 border-b border-slate-300 bg-transparent pl-9 pr-10 text-xl font-semibold tracking-tight text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-blue-400"
						/>
						{isSearching && (
							<Loader2 className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
						)}
					</label>

					<label>
						<span className="sr-only">选择年级</span>
						<select
							value={selectedGrade}
							onChange={(e) =>
								setSelectedGrade(e.target.value as typeof selectedGrade)
							}
							disabled={loadingState.isLoading}
							className="h-16 min-w-36 rounded-none border-0 border-b border-slate-300 bg-transparent px-1 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-0 disabled:opacity-50 dark:border-white/15 dark:bg-[#0d1117] dark:text-slate-300 dark:focus:border-blue-400"
						>
							<option value="all">全部年级</option>
							<option value="25">2025级</option>
							<option value="24">2024级</option>
							<option value="23">2023级</option>
							<option value="22">2022级</option>
							<option value="21">2021级</option>
						</select>
					</label>
				</div>
			</section>

			{isSearching ? (
				<div className="flex items-center gap-2 border-t border-slate-200/80 pt-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
					<Loader2 className="h-4 w-4 animate-spin text-blue-500" />
					搜索中
				</div>
			) : results.length > 0 ? (
				<section className="border-y border-slate-200/80 dark:border-white/10">
					<div className="flex items-center justify-between py-3">
						<span className="text-xs text-slate-500 dark:text-slate-500">
							查询结果
						</span>
						<span className="text-sm text-slate-600 dark:text-slate-400">
							{results.length >= 100 ? "100+" : results.length} 条
						</span>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full text-left">
							<thead className="border-y border-slate-200/80 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:text-slate-500">
								<tr>
									<th className="py-3 pr-4 font-medium">学号</th>
									<th className="px-4 py-3 font-medium">姓名</th>
									<th className="px-4 py-3 font-medium">班级</th>
									<th className="py-3 pl-4 font-medium">性别</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 dark:divide-white/10">
								{results.map((student) => (
									<tr
										key={student.XH}
										className="transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/20"
									>
										<td className="py-3 pr-4 font-mono text-sm text-slate-800 dark:text-slate-200">
											{student.XH}
										</td>
										<td className="px-4 py-3 text-sm font-semibold text-slate-950 dark:text-white">
											{student.XM}
										</td>
										<td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
											{student.BJMC}
										</td>
										<td
											className={`py-3 pl-4 text-sm font-medium ${
												student.XB === "男性"
													? "text-blue-600 dark:text-blue-300"
													: "text-pink-600 dark:text-pink-300"
											}`}
										>
											{student.XB === "男性" ? "男" : "女"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			) : searchTerm && !isSearching && !loadingState.isLoading ? (
				<div className="flex items-center gap-2 border-t border-slate-200/80 pt-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
					未找到相关记录
				</div>
			) : null}
		</div>
	);
};

export default SearchPage;
