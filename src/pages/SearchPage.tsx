import { Database, Hash, Loader2, RefreshCw, Search, User } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Grade, PinyinTable, Student, StudentData } from "../types";

// 数据加载状态
interface LoadingState {
	isLoading: boolean;
	progress: number;
	loadedYears: string[];
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
		loadedYears: [],
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
					loadedYears: ["2021", "2022", "2023", "2024", "2025"],
					error: null,
				});
				dataLoadedRef.current = true;
				return;
			}
		}

		setLoadingState({
			isLoading: true,
			progress: 0,
			loadedYears: [],
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
					loadedYears: [...prev.loadedYears, result.year],
				}));
			});

			setStudentsData(data);

			// 保存到缓存
			saveToCache(data, pinyinData);

			setLoadingState({
				isLoading: false,
				progress: 100,
				loadedYears: years,
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
		<div className="max-w-4xl mx-auto space-y-8">
			{/* 简洁标题 */}
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
					🔍 学生查询
				</h1>
				<p className="text-gray-600 dark:text-gray-300">
					输入学号、姓名或拼音首字母
				</p>
			</div>

			{/* 数据加载状态 */}
			{loadingState.isLoading && (
				<div className="bg-blue-50/80 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
					<div className="flex items-center gap-3 mb-2">
						<Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
						<span className="text-blue-700 dark:text-blue-300 font-medium">
							正在加载数据...
						</span>
					</div>
					<div className="w-full bg-blue-200/50 dark:bg-blue-800/50 rounded-full h-2">
						<div
							className="bg-blue-500 h-2 rounded-full transition-all duration-300"
							style={{ width: `${loadingState.progress}%` }}
						/>
					</div>
					<p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
						已加载: {loadingState.loadedYears.join(", ") || "准备中..."}
					</p>
				</div>
			)}

			{/* 加载错误 */}
			{loadingState.error && (
				<div className="bg-red-50/80 dark:bg-red-900/30 rounded-xl p-4 border border-red-200/50 dark:border-red-700/50">
					<div className="flex items-center justify-between">
						<span className="text-red-700 dark:text-red-300">
							{loadingState.error}
						</span>
						<button
							type="button"
							onClick={handleRefresh}
							className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
						>
							<RefreshCw className="h-4 w-4" />
							重试
						</button>
					</div>
				</div>
			)}

			{/* 数据状态指示 */}
			{!loadingState.isLoading && !loadingState.error && totalStudents > 0 && (
				<div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
					<Database className="h-4 w-4" />
					<span>已加载 {totalStudents.toLocaleString()} 条学生数据</span>
					<button
						type="button"
						onClick={handleRefresh}
						className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
						title="刷新数据"
					>
						<RefreshCw className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* 搜索框 */}
			<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
				<div className="space-y-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder={
								loadingState.isLoading
									? "数据加载中，请稍候..."
									: "输入查询内容..."
							}
							disabled={loadingState.isLoading}
							className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
						/>
						{isSearching && (
							<Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
						)}
					</div>

					<select
						value={selectedGrade}
						onChange={(e) =>
							setSelectedGrade(e.target.value as typeof selectedGrade)
						}
						disabled={loadingState.isLoading}
						className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm disabled:opacity-50"
					>
						<option value="all">全部年级</option>
						<option value="25">2025级</option>
						<option value="24">2024级</option>
						<option value="23">2023级</option>
						<option value="22">2022级</option>
						<option value="21">2021级</option>
					</select>
				</div>
			</div>

			{/* 搜索结果 */}
			{isSearching ? (
				<div className="text-center py-12">
					<Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
					<p className="text-gray-600 dark:text-gray-300 mt-2">搜索中...</p>
				</div>
			) : results.length > 0 ? (
				<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 overflow-hidden shadow-lg">
					<div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-200/50 dark:border-gray-600/50">
						<span className="text-sm text-gray-600 dark:text-gray-300">
							找到 {results.length >= 100 ? "100+" : results.length} 条记录
						</span>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead className="bg-gray-50/50 dark:bg-gray-700/50">
								<tr>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
										学号
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
										姓名
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
										班级
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
										性别
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 dark:divide-gray-600">
								{results.map((student) => (
									<tr
										key={student.XH}
										className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors"
									>
										<td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
											{student.XH}
										</td>
										<td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
											{student.XM}
										</td>
										<td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
											{student.BJMC}
										</td>
										<td className="px-4 py-3 text-sm">
											<span
												className={`px-2 py-1 rounded text-xs ${
													student.XB === "男性"
														? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
														: "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300"
												}`}
											>
												{student.XB === "男性" ? "男" : "女"}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			) : searchTerm && !isSearching && !loadingState.isLoading ? (
				<div className="text-center py-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20">
					<User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
					<p className="text-gray-600 dark:text-gray-300">未找到相关记录</p>
				</div>
			) : !loadingState.isLoading ? (
				<div className="bg-blue-50/50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
					<div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
						<div>
							<Hash className="h-8 w-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
							<p className="text-sm text-gray-600 dark:text-gray-300">
								学号查询
							</p>
						</div>
						<div>
							<User className="h-8 w-8 text-green-500 dark:text-green-400 mx-auto mb-2" />
							<p className="text-sm text-gray-600 dark:text-gray-300">
								姓名查询
							</p>
						</div>
						<div>
							<Search className="h-8 w-8 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
							<p className="text-sm text-gray-600 dark:text-gray-300">
								拼音查询
							</p>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default SearchPage;
