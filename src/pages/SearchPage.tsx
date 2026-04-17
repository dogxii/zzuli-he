import {
	Command,
	Database,
	Hash,
	Loader2,
	Network,
	RefreshCw,
	Search,
	User,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { forceX, forceY } from "d3-force";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { forceCollide } from "d3-force-3d";
import ForceGraph2D from "react-force-graph-2d";
import type { Grade, PinyinTable, Student, StudentData } from "../types";

interface LoadingState {
	isLoading: boolean;
	progress: number;
	loadedYears: string[];
	error: string | null;
}

interface CachedData {
	version: string;
	timestamp: number;
	studentsData: { [key: string]: Student[] };
	pinyinTable: PinyinTable;
}

interface GraphNode {
	id: string;
	student: Student;
	year: string;
	className: string;
	avatarUrl: string;
	fallbackAvatarUrl: string;
	accentHue: number;
	degree: number;
	clusterX: number;
	clusterY: number;
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
	fx?: number;
	fy?: number;
}

interface GraphLink {
	source: string | GraphNode;
	target: string | GraphNode;
	kind: "class" | "class-skip" | "year" | "bridge";
	strength: number;
}

type SearchMode = "exact_id" | "full_name" | "pinyin_initials";
type ResultsViewMode = "list" | "mesh";

const CACHE_KEY = "zzuli_students_cache";
const CACHE_VERSION = "v2";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
const MAX_GRAPH_RESULTS = 220;
const VIEW_MODES: Array<{ value: ResultsViewMode; label: string }> = [
	{ value: "list", label: "LIST_VIEW" },
	{ value: "mesh", label: "NODE_MESH" },
];

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

const isChinese = (str: string): boolean => /^[\u4e00-\u9fa5]+$/.test(str);
const isStudentNumber = (str: string): boolean => /^5\d{11}$/.test(str);
const isPartialStudentNumber = (str: string): boolean => /^\d{4,}$/.test(str);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

const getStudentGrade = (student: Student) => {
	const derived = student.XH.slice(2, 4);
	return /^\d{2}$/.test(derived) ? derived : "--";
};

const getAccentHue = (key: string) => {
	let hash = 0;
	for (let index = 0; index < key.length; index += 1) hash = (hash * 31 + key.charCodeAt(index)) % 360;
	return (hash + 180) % 360;
};

const getAnimeAvatarUrl = (studentId: string) => {
	let hash = 0;
	for (let index = 0; index < studentId.length; index += 1) {
		hash = (hash * 131 + studentId.charCodeAt(index) * (index + 17)) % 1000003;
	}
	const avatarId = (hash % 235) + 1;
	return `https://esa-img.loliapi.com/i/pp/img${avatarId}.webp`;
};

const createFallbackAvatarSvg = (studentId: string, accentHue: number, year: string) => {
	const suffix = studentId.slice(-2);
	const panelHue = (accentHue + 180) % 360;
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
			<rect width="120" height="120" rx="28" fill="hsl(${panelHue} 38% 16%)" />
			<circle cx="60" cy="46" r="18" fill="hsl(${accentHue} 74% 78%)" />
			<path d="M32 90c5-16 18-24 28-24s23 8 28 24" fill="hsl(${accentHue} 74% 78%)" />
			<rect x="14" y="12" width="34" height="14" rx="7" fill="rgba(255,255,255,0.1)" />
			<text x="31" y="22" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, monospace" font-size="8" font-weight="700" fill="rgba(255,255,255,0.78)">20${year}</text>
			<text x="60" y="106" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, monospace" font-size="14" font-weight="700" fill="rgba(255,255,255,0.92)">${suffix}</text>
		</svg>
	`;
	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const buildGraphData = (students: Student[]) => {
	const limitedStudents = students.slice(0, MAX_GRAPH_RESULTS);
	const nodeMap = new Map<string, GraphNode>();
	const classGroups = new Map<string, Student[]>();
	const yearGroups = new Map<string, Student[]>();
	const classNames = Array.from(new Set(limitedStudents.map((student) => student.BJMC || "未分类班级"))).sort();
	const classCenterMap = new Map<string, { x: number; y: number }>();
	const centerX = 0;
	const centerY = 0;
	const perRing = 5;

	classNames.forEach((className, index) => {
		const ring = Math.floor(index / perRing);
		const ringIndex = index % perRing;
		const itemsInRing = Math.min(perRing, classNames.length - ring * perRing);
		const angle = (-Math.PI / 2) + (ringIndex / itemsInRing) * Math.PI * 2;
		const radius = 360 + ring * 280;
		classCenterMap.set(className, {
			x: centerX + Math.cos(angle) * radius,
			y: centerY + Math.sin(angle) * radius * 0.92,
		});
	});

	for (const student of limitedStudents) {
		const className = student.BJMC || "未分类班级";
		const year = getStudentGrade(student);
		const center = classCenterMap.get(className) || { x: 0, y: 0 };
		const classList = classGroups.get(className) || [];
		classList.push(student);
		classGroups.set(className, classList);
		const yearList = yearGroups.get(year) || [];
		yearList.push(student);
		yearGroups.set(year, yearList);
			const accentHue = getAccentHue(className);
				nodeMap.set(student.XH, {
					id: student.XH,
					student,
					year,
					className,
					accentHue,
					avatarUrl: getAnimeAvatarUrl(student.XH),
					fallbackAvatarUrl: createFallbackAvatarSvg(student.XH, accentHue, year),
					degree: 0,
					clusterX: center.x,
					clusterY: center.y,
		});
	}

	const linkKeySet = new Set<string>();
	const links: GraphLink[] = [];
	const pushLink = (sourceId: string, targetId: string, kind: GraphLink["kind"], strength: number) => {
		if (sourceId === targetId || !nodeMap.has(sourceId) || !nodeMap.has(targetId)) return;
		const key = [sourceId, targetId].sort().join("::");
		if (linkKeySet.has(key)) return;
		linkKeySet.add(key);
		links.push({ source: sourceId, target: targetId, kind, strength });
		nodeMap.get(sourceId)!.degree += 1;
		nodeMap.get(targetId)!.degree += 1;
	};

	const classLeadersByYear = new Map<string, string[]>();

	for (const [className, classStudents] of Array.from(classGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
		const sorted = [...classStudents].sort((a, b) => a.XH.localeCompare(b.XH));
		const leader = sorted[0];
		if (!leader) continue;
		const leaderBucket = classLeadersByYear.get(getStudentGrade(leader)) || [];
		leaderBucket.push(leader.XH);
		classLeadersByYear.set(getStudentGrade(leader), leaderBucket);

		for (let index = 0; index < sorted.length; index += 1) {
			const current = sorted[index];
			const next = sorted[(index + 1) % sorted.length];
			const skip = sorted.length > 4 ? sorted[(index + 2) % sorted.length] : undefined;
			if (next) pushLink(current.XH, next.XH, "class", 1);
			if (skip) pushLink(current.XH, skip.XH, "class-skip", 0.55);
			if (current.XH !== leader.XH) pushLink(current.XH, leader.XH, "class", 0.9);
		}
		void className;
	}

	for (const [, yearStudents] of Array.from(yearGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
		const sorted = [...yearStudents].sort((a, b) => a.XH.localeCompare(b.XH));
		for (let index = 0; index < sorted.length - 1; index += 1) {
			if (index % 5 === 0) pushLink(sorted[index].XH, sorted[index + 1].XH, "year", 0.35);
		}
	}

	const orderedYears = Array.from(classLeadersByYear.keys()).sort();
	for (const year of orderedYears) {
		const leaders = classLeadersByYear.get(year) || [];
		for (let index = 0; index < leaders.length - 1; index += 1) pushLink(leaders[index], leaders[index + 1], "bridge", 0.65);
	}
	for (let index = 0; index < orderedYears.length - 1; index += 1) {
		const currentLeader = classLeadersByYear.get(orderedYears[index])?.[0];
		const nextLeader = classLeadersByYear.get(orderedYears[index + 1])?.[0];
		if (currentLeader && nextLeader) pushLink(currentLeader, nextLeader, "bridge", 0.45);
	}

	return {
		nodes: Array.from(nodeMap.values()),
		links,
	};
};

const StudentResultsTable: React.FC<{ results: Student[] }> = ({ results }) => (
	<div className="animate-slide-up bg-white/50 dark:bg-slate-900/50 backdrop-blur tech-panel p-1 rounded-sm border-t-4 border-t-sys-accent dark:border-t-sys-accent-dark flex-1 flex flex-col min-h-0">
		<div className="flex items-center justify-between p-3 md:p-4 border-b border-sys-border dark:border-sys-border-dark font-mono text-[10px] md:text-xs text-slate-500 tracking-widest uppercase bg-slate-50 dark:bg-slate-800/50">
			<span className="flex items-center gap-2">
				<span className="w-1 h-3 bg-sys-accent dark:bg-sys-accent-dark inline-block" />
				QUERY_RESULTS
			</span>
			<span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-sm font-bold">
				MATCH: {results.length >= 100 ? "100+" : results.length}
			</span>
		</div>

		<div className="overflow-auto scrollbar-hide flex-1">
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
						<tr key={student.XH} className="group hover:bg-sys-accent/5 dark:hover:bg-sys-accent-dark/10 transition-colors">
							<td className="py-3.5 px-6 font-mono text-sm tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark transition-colors">{student.XH}</td>
							<td className="py-3.5 px-6 font-sans font-bold text-base md:text-lg tracking-wide text-slate-800 dark:text-slate-100">{student.XM}</td>
							<td className="py-3.5 px-6 font-sans text-xs md:text-sm text-slate-500 dark:text-slate-400">{student.BJMC}</td>
							<td className="py-3.5 px-6">
								<span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase border ${student.XB === "男性" ? "bg-blue-50/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50" : "bg-rose-50/80 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800/50"}`}>
									{student.XB === "男性" ? "MALE" : "FEMALE"}
								</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="md:hidden flex flex-col gap-2 p-2">
				{results.map((student) => (
					<div key={student.XH} className="bg-white dark:bg-slate-800/50 border border-sys-border dark:border-sys-border-dark p-3 rounded flex flex-col gap-2 active:bg-sys-light dark:active:bg-slate-800 transition-colors">
						<div className="flex justify-between items-start gap-2">
							<span className="font-sans font-bold text-lg text-slate-800 dark:text-slate-100 leading-none">{student.XM}</span>
							<span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest uppercase border ${student.XB === "男性" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" : "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800"}`}>
								{student.XB === "男性" ? "MALE" : "FEMALE"}
							</span>
						</div>
						<div className="flex justify-between items-end border-t border-dashed border-sys-border dark:border-sys-border-dark pt-2 mt-1 gap-3">
							<span className="font-mono text-xs tracking-wider text-slate-500 dark:text-slate-400">{student.XH}</span>
							<span className="font-sans text-[10px] text-slate-400 dark:text-slate-500 max-w-[60%] text-right truncate">{student.BJMC}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	</div>
);

const StudentNodeMesh: React.FC<{ results: Student[] }> = ({ results }) => {
	const graphData = useMemo(() => buildGraphData(results), [results]);
	const [activeNodeId, setActiveNodeId] = useState<string | null>(graphData.nodes[0]?.id ?? null);
	const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
	const [avatarFallbacks, setAvatarFallbacks] = useState<Record<string, true>>({});
	const [graphSize, setGraphSize] = useState({ width: 960, height: 680 });
	const graphRef = useRef<any>(null);
	const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
	const loadingImageSrcRef = useRef<Set<string>>(new Set());
	const containerRef = useRef<HTMLDivElement | null>(null);
	const hasAutoFittedRef = useRef(false);

	useEffect(() => {
		setActiveNodeId(graphData.nodes[0]?.id ?? null);
		setHoveredNodeId(null);
		setAvatarFallbacks({});
		imageCacheRef.current.clear();
		loadingImageSrcRef.current.clear();
		hasAutoFittedRef.current = false;
	}, [graphData]);

	useEffect(() => {
		const element = containerRef.current;
		if (!element) return undefined;

		const updateSize = () => {
			const nextWidth = Math.max(320, Math.round(element.clientWidth));
			const nextHeight = Math.max(520, Math.round(element.clientHeight));
			setGraphSize((current) => (current.width === nextWidth && current.height === nextHeight ? current : { width: nextWidth, height: nextHeight }));
		};

		updateSize();
		const observer = new ResizeObserver(() => updateSize());
		observer.observe(element);

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const preloadTargets = graphData.nodes;
		preloadTargets.forEach((node) => {
			const avatarSrc = avatarFallbacks[node.id] ? node.fallbackAvatarUrl : node.avatarUrl;
			if (imageCacheRef.current.has(avatarSrc) || loadingImageSrcRef.current.has(avatarSrc)) return;
			loadingImageSrcRef.current.add(avatarSrc);
			const image = new Image();
			image.onload = () => {
				imageCacheRef.current.set(avatarSrc, image);
				loadingImageSrcRef.current.delete(avatarSrc);
				graphRef.current?.refresh();
			};
			image.onerror = () => {
				loadingImageSrcRef.current.delete(avatarSrc);
				if (!avatarFallbacks[node.id]) {
					setAvatarFallbacks((current) => ({ ...current, [node.id]: true }));
				}
			};
			image.src = avatarSrc;
		});
	}, [avatarFallbacks, graphData]);

	useEffect(() => {
		const graph = graphRef.current;
		if (!graph || graphData.nodes.length === 0 || graphSize.width <= 0 || graphSize.height <= 0) return;
		graph.d3Force("charge").strength(graphData.nodes.length > 160 ? -170 : -220);
		graph.d3Force("link").distance((link: GraphLink) => {
			if (link.kind === "class") return 58;
			if (link.kind === "class-skip") return 86;
			if (link.kind === "year") return 146;
			return 220;
		});
		graph.d3Force("link").strength((link: GraphLink) => link.strength);
		graph.d3Force("center").strength(0.08);
		graph.d3Force("collide", forceCollide<GraphNode>((node: GraphNode) => Math.max(34, Math.min(48, 30 + node.degree * 1.9))).iterations(5).strength(1));
		graph.d3Force("clusterX", forceX<GraphNode>((node: GraphNode) => node.clusterX).strength(0.1));
		graph.d3Force("clusterY", forceY<GraphNode>((node: GraphNode) => node.clusterY).strength(0.1));

		if (!hasAutoFittedRef.current) {
			hasAutoFittedRef.current = true;
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					graph.zoomToFit(500, 90);
				});
			});
		}
	}, [graphData, graphSize.height, graphSize.width]);

	const nodesById = useMemo(() => new Map(graphData.nodes.map((node) => [node.id, node])), [graphData.nodes]);
	const activeId = hoveredNodeId || activeNodeId;
	const activeNode = activeId ? nodesById.get(activeId) || null : null;
	const highlightedNodeIds = useMemo(() => {
		const ids = new Set<string>();
		if (!activeId) return ids;
		ids.add(activeId);
		graphData.links.forEach((link) => {
			const sourceId = typeof link.source === "string" ? link.source : link.source.id;
			const targetId = typeof link.target === "string" ? link.target : link.target.id;
			if (sourceId === activeId || targetId === activeId) {
				ids.add(sourceId);
				ids.add(targetId);
			}
		});
		return ids;
	}, [activeId, graphData.links]);

	const highlightedLinkKeys = useMemo(() => {
		const keys = new Set<string>();
		if (!activeId) return keys;
		graphData.links.forEach((link) => {
			const sourceId = typeof link.source === "string" ? link.source : link.source.id;
			const targetId = typeof link.target === "string" ? link.target : link.target.id;
			if (sourceId === activeId || targetId === activeId) keys.add([sourceId, targetId].sort().join("::"));
		});
		return keys;
	}, [activeId, graphData.links]);

	const handleZoom = (direction: 1 | -1) => {
		const graph = graphRef.current;
		if (!graph) return;
		const currentZoom = graph.zoom();
		graph.zoom(clamp(currentZoom * (direction > 0 ? 1.18 : 0.84), 0.35, 3), 300);
	};

	const handleReset = () => {
		graphRef.current?.zoomToFit(500, 90);
		setHoveredNodeId(null);
	};

	const drawNode = useCallback(
		(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
			const radius = (hoveredNodeId === node.id || activeNodeId === node.id ? 22 : 18) / Math.sqrt(globalScale);
			const image = imageCacheRef.current.get(avatarFallbacks[node.id] ? node.fallbackAvatarUrl : node.avatarUrl);
			const isHighlighted = highlightedNodeIds.has(node.id);
			const accent = `hsla(${node.accentHue}, 88%, 62%, 1)`;
			const label = `${node.student.XM} · ${node.student.XH.slice(-4)}`;

			ctx.save();
			ctx.beginPath();
			ctx.arc(node.x || 0, node.y || 0, radius + 4 / Math.sqrt(globalScale), 0, 2 * Math.PI, false);
			ctx.fillStyle = isHighlighted ? "rgba(0, 174, 239, 0.18)" : "rgba(15, 23, 42, 0.2)";
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.clip();

			if (image) {
				ctx.filter = "none";
				ctx.drawImage(image, (node.x || 0) - radius, (node.y || 0) - radius, radius * 2, radius * 2);
				ctx.filter = "none";
			} else {
				ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
				ctx.fillRect((node.x || 0) - radius, (node.y || 0) - radius, radius * 2, radius * 2);
				ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
				ctx.font = `${12 / Math.sqrt(globalScale)}px sans-serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(node.student.XH.slice(-2), node.x || 0, node.y || 0);
			}

			ctx.restore();

			ctx.beginPath();
			ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI, false);
			ctx.strokeStyle = isHighlighted ? accent : "rgba(255,255,255,0.28)";
			ctx.lineWidth = isHighlighted ? 2.6 / Math.sqrt(globalScale) : 1.2 / Math.sqrt(globalScale);
			ctx.stroke();

			if (isHighlighted || globalScale > 1.5) {
				const fontSize = 9 / Math.sqrt(globalScale);
				ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, monospace`;
				const textWidth = ctx.measureText(label).width;
				const paddingX = 6 / Math.sqrt(globalScale);
				const paddingY = 4 / Math.sqrt(globalScale);
				const textY = (node.y || 0) + radius + 12 / Math.sqrt(globalScale);
				ctx.fillStyle = "rgba(2, 6, 23, 0.86)";
				ctx.fillRect((node.x || 0) - textWidth / 2 - paddingX, textY - fontSize, textWidth + paddingX * 2, fontSize + paddingY * 2);
				ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.96)" : "rgba(226,232,240,0.9)";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(label, node.x || 0, textY - fontSize / 2 + paddingY / 2);
			}
		},
		[activeNodeId, avatarFallbacks, highlightedNodeIds, hoveredNodeId],
	);

	const graphHeight = graphSize.height;
	const graphWidth = graphSize.width;
	const visibleNodeCount = graphData.nodes.length;
	const visibleLinkCount = graphData.links.length;

	return (
		<div className="animate-slide-up tech-panel border-t-4 border-t-sys-accent dark:border-t-sys-accent-dark overflow-hidden bg-white/40 dark:bg-slate-900/50 backdrop-blur">
			<div className="flex flex-col xl:flex-row min-h-[780px]">
				<div className="flex-1 min-w-0 border-b xl:border-b-0 xl:border-r border-sys-border dark:border-sys-border-dark">
					<div className="flex items-center justify-between gap-3 p-3 md:p-4 border-b border-sys-border dark:border-sys-border-dark bg-slate-50/90 dark:bg-slate-900/70 backdrop-blur">
						<div className="min-w-0">
							<div className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">NODE_MESH_VIEW</div>
							<div className="mt-1 flex items-center gap-3 text-xs md:text-sm text-slate-600 dark:text-slate-300 flex-wrap">
								<span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em]"><Network className="h-4 w-4 text-sys-accent dark:text-sys-accent-dark" />{visibleNodeCount} nodes</span>
								<span className="font-mono uppercase tracking-[0.18em] text-slate-400">{visibleLinkCount} links</span>
								<span className="hidden md:inline text-slate-400">学号后两位稳定映射二次元头像，支持拖动节点和滚轮缩放。</span>
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<button type="button" onClick={() => handleZoom(-1)} className="h-9 w-9 inline-flex items-center justify-center border border-sys-border dark:border-sys-border-dark bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-sys-accent dark:hover:text-sys-accent-dark transition-colors" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
							<button type="button" onClick={() => handleZoom(1)} className="h-9 w-9 inline-flex items-center justify-center border border-sys-border dark:border-sys-border-dark bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-sys-accent dark:hover:text-sys-accent-dark transition-colors" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
							<button type="button" onClick={handleReset} className="px-3 h-9 inline-flex items-center justify-center border border-sys-border dark:border-sys-border-dark bg-white/80 dark:bg-slate-800/80 font-mono text-[10px] tracking-[0.22em] text-slate-500 hover:text-sys-accent dark:hover:text-sys-accent-dark transition-colors uppercase">Reset</button>
						</div>
					</div>

					<div ref={containerRef} className="relative h-[620px] md:h-[680px] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(0,174,239,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(241,245,249,0.76))] dark:bg-[radial-gradient(circle_at_top,rgba(0,195,255,0.16),transparent_38%),linear-gradient(180deg,rgba(11,17,32,0.84),rgba(15,23,42,0.92))]">
						<div className="absolute inset-0 opacity-70 dark:opacity-40 pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, rgba(0,174,239,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,174,239,0.08) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
						<div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-slate-500 dark:text-slate-400 pointer-events-none">
							<span className="px-2.5 py-1 border border-sys-accent/25 dark:border-sys-accent-dark/25 bg-white/75 dark:bg-slate-900/70">FORCE_GRAPH_2D</span>
							{results.length > MAX_GRAPH_RESULTS && <span className="px-2.5 py-1 border border-amber-400/40 text-amber-600 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-900/20">Showing first {MAX_GRAPH_RESULTS}</span>}
						</div>

						<ForceGraph2D
							ref={graphRef}
							width={graphWidth}
							height={graphHeight}
			graphData={graphData}
			backgroundColor="rgba(0,0,0,0)"
			nodeRelSize={5}
			nodeVal={(node) => Math.max(1, (node as GraphNode).degree)}
			autoPauseRedraw={false}
			cooldownTicks={180}
			d3AlphaDecay={0.032}
			d3VelocityDecay={0.22}
			enableNodeDrag
							nodeCanvasObject={(node, ctx, globalScale) => drawNode(node as GraphNode, ctx, globalScale)}
							nodePointerAreaPaint={(node, color, ctx) => {
								const current = node as GraphNode;
								ctx.fillStyle = color;
								ctx.beginPath();
								ctx.arc(current.x || 0, current.y || 0, 24, 0, 2 * Math.PI, false);
								ctx.fill();
							}}
							linkColor={(link) => {
								const sourceId = typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
								const targetId = typeof link.target === "string" ? link.target : (link.target as GraphNode).id;
								const key = [sourceId, targetId].sort().join("::");
								if (highlightedLinkKeys.has(key)) return "rgba(0,174,239,0.92)";
								if ((link as GraphLink).kind === "bridge") return "rgba(56,189,248,0.32)";
								if ((link as GraphLink).kind === "year") return "rgba(148,163,184,0.18)";
								return "rgba(148,163,184,0.24)";
							}}
							linkWidth={(link) => {
								const sourceId = typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
								const targetId = typeof link.target === "string" ? link.target : (link.target as GraphNode).id;
								return highlightedLinkKeys.has([sourceId, targetId].sort().join("::")) ? 2.2 : (link as GraphLink).kind === "bridge" ? 1.5 : 1;
							}}
							linkDirectionalParticles={(link) => {
								const sourceId = typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
								const targetId = typeof link.target === "string" ? link.target : (link.target as GraphNode).id;
								return highlightedLinkKeys.has([sourceId, targetId].sort().join("::")) ? 2 : 0;
							}}
							linkDirectionalParticleWidth={1.4}
							linkDirectionalParticleSpeed={0.008}
							onNodeHover={(node) => setHoveredNodeId((node as GraphNode | null)?.id ?? null)}
							onNodeClick={(node) => {
								const current = node as GraphNode;
								setActiveNodeId(current.id);
								graphRef.current?.centerAt(current.x || 0, current.y || 0, 450);
								graphRef.current?.zoom(1.9, 450);
							}}
							onBackgroundClick={() => setHoveredNodeId(null)}
						/>
					</div>
				</div>

				<div className="w-full xl:w-[320px] shrink-0 bg-white/80 dark:bg-slate-950/60 backdrop-blur flex flex-col">
					<div className="p-4 md:p-5 border-b border-sys-border dark:border-sys-border-dark">
						<div className="font-mono text-[10px] tracking-[0.3em] uppercase text-slate-400">IDENTITY_TRACE</div>
						<h3 className="mt-2 text-lg font-sans font-bold text-slate-800 dark:text-slate-100">当前聚焦节点</h3>
						<p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">节点使用学号后两位稳定映射的二次元头像。班内为强连接，跨班与跨年级保留桥接，避免只堆成一团。</p>
					</div>

					{activeNode ? (
						<div className="p-4 md:p-5 flex flex-col gap-4">
							<div className="relative overflow-hidden rounded-[28px] border border-sys-border dark:border-sys-border-dark bg-slate-900">
								<div className="aspect-[4/5] overflow-hidden">
									<img src={avatarFallbacks[activeNode.id] ? activeNode.fallbackAvatarUrl : activeNode.avatarUrl} alt={`${activeNode.student.XM} 头像`} onError={() => setAvatarFallbacks((current) => ({ ...current, [activeNode.id]: true }))} className="h-full w-full object-cover" />
								</div>
								<div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
									<div className="font-sans text-xl font-bold text-white">{activeNode.student.XM}</div>
									<div className="mt-1 font-mono text-xs tracking-[0.2em] text-slate-300">{activeNode.student.XH}</div>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-3">
								<div className="rounded-2xl border border-sys-border dark:border-sys-border-dark bg-slate-50/80 dark:bg-slate-900/80 p-4">
									<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">Class Group</div>
									<div className="mt-2 text-sm font-sans font-semibold text-slate-800 dark:text-slate-100">{activeNode.student.BJMC}</div>
								</div>
								<div className="rounded-2xl border border-sys-border dark:border-sys-border-dark bg-slate-50/80 dark:bg-slate-900/80 p-4">
									<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">Profile Tags</div>
									<div className="mt-3 flex flex-wrap gap-2">
										<span className="px-2.5 py-1 rounded-full bg-sys-accent/10 dark:bg-sys-accent-dark/10 border border-sys-accent/20 dark:border-sys-accent-dark/20 font-mono text-[10px] tracking-[0.16em] uppercase text-sys-accent dark:text-sys-accent-dark">20{activeNode.year}</span>
										<span className={`px-2.5 py-1 rounded-full border font-mono text-[10px] tracking-[0.16em] uppercase ${activeNode.student.XB === "男性" ? "bg-blue-50/80 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300" : "bg-rose-50/80 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300"}`}>{activeNode.student.XB === "男性" ? "Male" : "Female"}</span>
										<span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-sys-border dark:border-sys-border-dark font-mono text-[10px] tracking-[0.16em] uppercase text-slate-500 dark:text-slate-300">Degree {activeNode.degree}</span>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-dashed border-sys-border dark:border-sys-border-dark p-4 text-xs leading-5 text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/50">
								当前节点会高亮关联边。你可以继续拖动画布、拖动单个节点，网络会实时重新收敛。
							</div>
						</div>
					) : (
						<div className="p-5 text-sm text-slate-500 dark:text-slate-400">暂无节点可展示。</div>
					)}
				</div>
			</div>
		</div>
	);
};

const SearchPage: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedGrade, setSelectedGrade] = useState<Grade | "all">("all");
	const [results, setResults] = useState<Student[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [studentsData, setStudentsData] = useState<{ [key: string]: Student[] }>({});
	const [pinyinTable, setPinyinTable] = useState<PinyinTable>({});
	const [resultsViewMode, setResultsViewMode] = useState<ResultsViewMode>("list");
	const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: true, progress: 0, loadedYears: [], error: null });

	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dataLoadedRef = useRef(false);

	const loadData = useCallback(async (forceRefresh = false) => {
		if (dataLoadedRef.current && !forceRefresh) return;
		if (!forceRefresh) {
			const cached = loadFromCache();
			if (cached && Object.keys(cached.studentsData).length > 0) {
				setStudentsData(cached.studentsData);
				setPinyinTable(cached.pinyinTable);
				setLoadingState({ isLoading: false, progress: 100, loadedYears: ["2021", "2022", "2023", "2024", "2025"], error: null });
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
				setLoadingState((prev) => ({ ...prev, progress: 10 + ((index + 1) / years.length) * 90, loadedYears: [...prev.loadedYears, result.year] }));
			});

			setStudentsData(data);
			saveToCache(data, pinyinData);
			setLoadingState({ isLoading: false, progress: 100, loadedYears: years, error: null });
			dataLoadedRef.current = true;
		} catch (error) {
			console.error("加载数据失败:", error);
			setLoadingState((prev) => ({ ...prev, isLoading: false, error: error instanceof Error ? error.message : "数据加载失败，请刷新重试" }));
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const getInitials = useCallback(
		(str: string): string => {
			let initials = "";
			for (const char of str) initials += pinyinTable[char] || "";
			return initials.toLowerCase();
		},
		[pinyinTable],
	);

	const performSearch = useCallback(
		(term: string, grade: Grade | "all") => {
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

			const uniqueResults = searchResults.filter((student, index, self) => index === self.findIndex((item) => item.XH === student.XH)).slice(0, 220);
			setResults(uniqueResults);
			setIsSearching(false);
		},
		[studentsData, getInitials],
	);

	useEffect(() => {
		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
		if (!searchTerm.trim()) {
			setResults([]);
			return;
		}
		searchTimeoutRef.current = setTimeout(() => {
			performSearch(searchTerm, selectedGrade);
		}, 300);
		return () => {
			if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
		};
	}, [searchTerm, selectedGrade, performSearch]);

	const handleRefresh = () => {
		dataLoadedRef.current = false;
		localStorage.removeItem(CACHE_KEY);
		loadData(true);
	};

	const totalStudents = Object.values(studentsData).reduce((sum, arr) => sum + arr.length, 0);
	const activeSearchMode = getSearchMode(searchTerm);
	const shouldShowMeshToggle = results.length > 0;

	return (
		<div className="w-full max-w-6xl mx-auto flex flex-col gap-6 md:gap-10 animate-fade-in relative flex-1">
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4 md:mt-8">
				<div className="relative">
					<div className="font-mono text-sys-accent dark:text-sys-accent-dark text-[10px] tracking-[0.3em] mb-2 font-bold uppercase">// TERMINAL_ACCESS</div>
					<h1 className="text-3xl md:text-5xl font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3"><div className="h-6 md:h-10 w-1.5 md:w-2 bg-sys-accent dark:bg-sys-accent-dark" />系统学籍检索</h1>
				</div>

				{!loadingState.isLoading && !loadingState.error && totalStudents > 0 && (
					<div className="tech-panel py-2 px-4 rounded-sm flex items-center gap-3 text-xs font-mono uppercase bg-white/50 dark:bg-slate-900/50 backdrop-blur self-start md:self-end">
						<Database className="h-4 w-4 text-sys-accent dark:text-sys-accent-dark" />
						<span className="text-slate-600 dark:text-slate-400">DATA_VOL:</span>
						<span className="font-bold text-slate-800 dark:text-slate-200">{totalStudents.toLocaleString()}</span>
						<button onClick={handleRefresh} className="ml-2 pl-2 border-l border-sys-border dark:border-sys-border-dark text-slate-400 hover:text-sys-accent dark:hover:text-sys-accent-dark transition-colors" aria-label="Sync Database"><RefreshCw className="h-3 w-3" /></button>
					</div>
				)}
			</div>

			{loadingState.isLoading && (
				<div className="tech-panel p-6 border-l-4 border-l-sys-accent dark:border-l-sys-accent-dark clip-edge relative overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur">
					<div className="absolute top-0 right-0 w-32 h-32 bg-sys-accent/10 dark:bg-sys-accent-dark/10 blur-2xl rounded-full" />
					<div className="flex flex-col gap-4 relative z-10">
						<div className="flex items-center gap-3"><Loader2 className="h-5 w-5 text-sys-accent dark:text-sys-accent-dark animate-spin" /><span className="font-sans font-bold text-lg text-slate-800 dark:text-slate-200 uppercase tracking-widest">Init Core Components...</span></div>
						<div className="w-full h-1 bg-slate-200 dark:bg-slate-800 relative"><div className="absolute top-0 left-0 h-full bg-sys-accent dark:bg-sys-accent-dark transition-all duration-300" style={{ width: `${loadingState.progress}%` }} /></div>
						<div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest gap-4"><span>[ LOAD_PROGRESS: {Math.round(loadingState.progress)}% ]</span><span>CHUNKS: {loadingState.loadedYears.join(", ")}</span></div>
					</div>
				</div>
			)}

			{loadingState.error && (
				<div className="tech-panel p-6 border-l-4 border-l-red-500 clip-edge bg-red-50/50 dark:bg-red-950/20 backdrop-blur">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><span className="font-mono text-sm font-bold tracking-widest text-red-600 dark:text-red-400">ERROR_CODE: {loadingState.error}</span><button onClick={handleRefresh} className="tech-btn-outline bg-transparent border-red-500 text-red-600 hover:bg-red-500 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-slate-900 py-1.5 px-4 text-xs"><RefreshCw className="h-3 w-3" /> RE-INITIALIZE</button></div>
				</div>
			)}

			<div className="relative group z-10 mb-4">
				<div className="flex flex-col md:flex-row md:items-stretch gap-0">
					<div className="flex-1 w-full relative">
						<div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"><Command className="h-4 w-4 text-slate-400 dark:text-slate-500" /></div>
						<input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={loadingState.isLoading ? "AWAITING..." : "ENTER ID, NAME, OR PINYIN..."} disabled={loadingState.isLoading} className="tech-input min-h-[64px] pl-4 md:pl-14 pr-4 py-4 md:py-5 border-t border-b border-l bg-white/80 dark:bg-slate-900/80 backdrop-blur w-full font-mono text-sm md:text-lg tracking-[0.2em] uppercase" />
						<div className="absolute bottom-0 left-0 h-px bg-sys-accent dark:bg-sys-accent-dark w-0 group-focus-within:w-full transition-all duration-500 ease-out z-20" />
					</div>

					<div className="hidden md:block w-full md:w-44 lg:w-40 shrink-0 relative">
						<select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value as typeof selectedGrade)} disabled={loadingState.isLoading} className="w-full min-h-[64px] appearance-none tech-input py-4 md:py-5 pl-4 pr-12 border text-center font-mono text-xs md:text-sm tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur cursor-pointer uppercase transition-colors">
							{GRADE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
						</select>
						<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-sys-border dark:border-sys-border-dark pl-3 opacity-50"><div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-current" /></div>
					</div>
				</div>

				<div className="md:hidden mt-3 grid grid-cols-3 gap-2">
					{GRADE_OPTIONS.map((option) => (
						<button key={option.value} type="button" onClick={() => setSelectedGrade(option.value)} className={`min-w-0 rounded-md border px-2 py-2.5 text-[10px] font-mono tracking-[0.14em] uppercase transition-colors ${selectedGrade === option.value ? "border-sys-accent bg-sys-accent/10 text-sys-accent dark:border-sys-accent-dark dark:bg-sys-accent-dark/10 dark:text-sys-accent-dark" : "border-sys-border text-slate-500 bg-white/70 dark:border-sys-border-dark dark:bg-slate-900/60 dark:text-slate-400"}`}>
							{option.value === "all" ? "全部" : option.value}
						</button>
					))}
				</div>

				<div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					{searchTerm.trim() && !loadingState.isLoading ? (
						<div className="flex items-center gap-2 flex-wrap text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
							<span className="px-2.5 py-1 border border-sys-accent/30 dark:border-sys-accent-dark/30 bg-sys-accent/5 dark:bg-sys-accent-dark/10 text-sys-accent dark:text-sys-accent-dark rounded-sm font-bold">{SEARCH_MODE_CONFIG[activeSearchMode].sub}</span>
							<span>{SEARCH_MODE_CONFIG[activeSearchMode].hint}</span>
						</div>
					) : <div />}

					{shouldShowMeshToggle && (
						<div className="inline-flex self-start md:self-auto border border-sys-border dark:border-sys-border-dark bg-white/70 dark:bg-slate-900/60 backdrop-blur p-1 rounded-sm">
							{VIEW_MODES.map((mode) => (
								<button key={mode.value} type="button" onClick={() => setResultsViewMode(mode.value)} className={`px-3 md:px-4 py-2 font-mono text-[10px] tracking-[0.22em] uppercase transition-colors ${resultsViewMode === mode.value ? "bg-sys-accent text-white dark:bg-sys-accent-dark dark:text-slate-950" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}>{mode.label}</button>
							))}
						</div>
					)}
				</div>
			</div>

			{isSearching ? (
				<div className="flex flex-col items-center justify-center py-20 gap-4 tech-panel bg-white/30 dark:bg-slate-900/30 backdrop-blur"><Loader2 className="w-8 h-8 text-sys-accent dark:text-sys-accent-dark animate-spin" /><div className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-slate-400"><div className="w-1.5 h-1.5 bg-sys-accent dark:bg-sys-accent-dark rounded-full animate-pulse" />SCANNING_DATABASE...</div></div>
			) : results.length > 0 ? (
				resultsViewMode === "mesh" ? <StudentNodeMesh results={results} /> : <StudentResultsTable results={results} />
			) : searchTerm && !loadingState.isLoading ? (
				<div className="py-20 flex flex-col items-center text-center space-y-4 tech-panel bg-white/30 dark:bg-slate-900/30 backdrop-blur border-dashed"><div className="text-slate-300 dark:text-slate-700 relative"><Command className="h-10 w-10 absolute opacity-50 blur-sm" /><Command className="h-10 w-10 relative z-10" /></div><div className="space-y-1 mt-2"><h3 className="font-sans font-bold text-lg text-slate-700 dark:text-slate-300 tracking-wider">NO_MATCH_FOUND</h3><p className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">Refine search parameters.</p></div></div>
			) : !loadingState.isLoading ? (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 pt-0 md:pt-4 animate-slide-up w-full">
					{[{ icon: Hash, mode: "exact_id" as SearchMode }, { icon: User, mode: "full_name" as SearchMode }, { icon: Search, mode: "pinyin_initials" as SearchMode }].map((item, index) => (
						<div key={index} className="tech-panel h-[104px] md:min-h-[148px] md:h-auto p-2.5 md:p-6 flex flex-col items-center justify-center text-center group bg-white/50 dark:bg-slate-900/50 backdrop-blur clip-edge overflow-hidden">
							<div className="p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-3 md:mb-4 group-hover:bg-sys-accent/10 dark:group-hover:bg-sys-accent-dark/10 transition-colors"><item.icon className="h-5 w-5 md:h-6 md:w-6 text-slate-400 dark:text-slate-500 group-hover:text-sys-accent dark:group-hover:text-sys-accent-dark transition-colors" /></div>
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
