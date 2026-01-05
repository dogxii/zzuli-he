const fs = require("fs");
const path = require("path");

// 读取所有年份的数据
const years = ["2021", "2022", "2023", "2024", "2025"];
const dataDir = path.join(__dirname, "../public/example");

// 尝试加载拼音表
let pinyinTable = {};
try {
	const pinyinPath = path.join(dataDir, "pinyinTable.json");
	if (fs.existsSync(pinyinPath)) {
		pinyinTable = JSON.parse(fs.readFileSync(pinyinPath, "utf-8"));
	}
} catch (e) {
	console.warn("⚠️ 未找到拼音表，跳过拼音分析");
}

async function loadAllData() {
	const allStudents = [];
	const studentsByYear = {};

	for (const year of years) {
		try {
			const filePath = path.join(dataDir, `${year}.json`);
			const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
			studentsByYear[year] = data.aaData || [];
			allStudents.push(...(data.aaData || []));
			console.log(`✅ 加载 ${year} 年数据: ${studentsByYear[year].length} 人`);
		} catch (error) {
			console.error(`❌ 加载 ${year} 年数据失败:`, error.message);
			studentsByYear[year] = [];
		}
	}

	return { allStudents, studentsByYear };
}

// 提取名字（去除姓氏）
function getGivenName(name) {
	const compoundSurnames = [
		"欧阳",
		"司马",
		"上官",
		"诸葛",
		"慕容",
		"令狐",
		"皇甫",
		"东方",
		"西门",
		"南宫",
		"尉迟",
	];

	for (const cs of compoundSurnames) {
		if (name.startsWith(cs)) {
			return name.slice(cs.length);
		}
	}
	return name.slice(1);
}

// 提取姓氏
function getSurname(name) {
	const compoundSurnames = [
		"欧阳",
		"司马",
		"上官",
		"诸葛",
		"慕容",
		"令狐",
		"皇甫",
		"东方",
		"西门",
		"南宫",
		"尉迟",
	];

	for (const cs of compoundSurnames) {
		if (name.startsWith(cs)) {
			return cs;
		}
	}
	return name.charAt(0);
}

function analyzeSurnames(students) {
	const surnameCount = {};
	students.forEach((student) => {
		const surname = getSurname(student.XM);
		surnameCount[surname] = (surnameCount[surname] || 0) + 1;
	});

	return Object.entries(surnameCount)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

function analyzeFullNames(students) {
	const nameCount = {};
	students.forEach((student) => {
		const name = student.XM;
		nameCount[name] = (nameCount[name] || 0) + 1;
	});

	return Object.entries(nameCount)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

function analyzeGender(students) {
	let male = 0;
	let female = 0;
	students.forEach((student) => {
		if (student.XB === "男性") male++;
		else female++;
	});
	return {
		male,
		female,
		ratio: female > 0 ? (male / female).toFixed(2) : male,
	};
}

function analyzeNameLength(students) {
	const lengthCount = {};
	let shortestNames = [];
	let longestNames = [];
	let minLength = Infinity;
	let maxLength = 0;

	students.forEach((student) => {
		const len = student.XM.length;
		lengthCount[len] = (lengthCount[len] || 0) + 1;

		if (len < minLength) {
			minLength = len;
			shortestNames = [student.XM];
		} else if (len === minLength) {
			shortestNames.push(student.XM);
		}

		if (len > maxLength) {
			maxLength = len;
			longestNames = [student.XM];
		} else if (len === maxLength) {
			longestNames.push(student.XM);
		}
	});

	return {
		distribution: lengthCount,
		shortestNames: [...new Set(shortestNames)].slice(0, 20),
		longestNames: [...new Set(longestNames)].slice(0, 20),
		minLength,
		maxLength,
	};
}

function analyzeGivenNames(students) {
	const givenNameCount = {};
	const singleCharCount = {};

	students.forEach((student) => {
		const givenName = getGivenName(student.XM);
		if (givenName) {
			givenNameCount[givenName] = (givenNameCount[givenName] || 0) + 1;
			for (const char of givenName) {
				singleCharCount[char] = (singleCharCount[char] || 0) + 1;
			}
		}
	});

	const topGivenNames = Object.entries(givenNameCount)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 100);

	const topSingleChars = Object.entries(singleCharCount)
		.map(([char, count]) => ({ char, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 100);

	return { topGivenNames, topSingleChars };
}

// New: Gender specific character analysis
function analyzeGenderChars(students) {
	const maleChars = {};
	const femaleChars = {};

	students.forEach((s) => {
		const givenName = getGivenName(s.XM);
		for (const char of givenName) {
			if (s.XB === "男性") {
				maleChars[char] = (maleChars[char] || 0) + 1;
			} else if (s.XB === "女性") {
				femaleChars[char] = (femaleChars[char] || 0) + 1;
			}
		}
	});

	const sortAndSlice = (obj) =>
		Object.entries(obj)
			.map(([char, count]) => ({ char, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 50);

	return {
		male: sortAndSlice(maleChars),
		female: sortAndSlice(femaleChars),
	};
}

function analyzeColleges(students) {
	const collegeCount = {};
	students.forEach((student) => {
		const bjmc = student.BJMC;
		// Try to extract major more accurately
		// Usually format: MajorName + Year + ClassNumber (e.g. 软件工程21-01)
		// Or: IEC + MajorName + Year + ClassNumber
		let major = bjmc.replace(/\d{2,4}-\d+$/, "").trim(); // Remove year-class suffix
		major = major.replace(/[0-9]+$/, "").trim(); // Remove trailing numbers if any

		collegeCount[major] = (collegeCount[major] || 0) + 1;
	});

	return Object.entries(collegeCount)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

// New: Class Statistics
function analyzeClasses(students) {
	const classCounts = {};
	students.forEach((s) => {
		classCounts[s.BJMC] = (classCounts[s.BJMC] || 0) + 1;
	});

	const sortedClasses = Object.entries(classCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);

	const totalClasses = sortedClasses.length;
	const avgSize =
		totalClasses > 0 ? (students.length / totalClasses).toFixed(1) : 0;

	return {
		totalClasses,
		avgSize,
		largest: sortedClasses.slice(0, 10),
		smallest: sortedClasses
			.filter((c) => c.count > 0)
			.slice(-10)
			.reverse(),
	};
}

function findUniqueNames(students) {
	const nameCount = {};
	students.forEach((student) => {
		nameCount[student.XM] = (nameCount[student.XM] || 0) + 1;
	});
	return Object.entries(nameCount)
		.filter(([_, count]) => count === 1)
		.map(([name]) => name);
}

function findInterestingNames(students) {
	const interesting = {
		sameCharNames: [],
		celebrityLikeNames: [],
		abccNames: [], // A B C C pattern (e.g. 王飞飞)
		aabcNames: [], // A A B C pattern (e.g. 杨杨意)
	};

	const celebrityNames = [
		"王思聪",
		"马云",
		"刘强东",
		"雷军",
		"李彦宏",
		"马化腾",
		"周杰伦",
		"王力宏",
		"林俊杰",
		"张学友",
		"刘德华",
		"周星驰",
		"成龙",
		"李小龙",
		"王菲",
		"那英",
		"张靓颖",
		"李宇春",
		"王一博",
		"肖战",
		"易烊千玺",
		"胡歌",
		"彭于晏",
		"吴彦祖",
		"沈腾",
		"贾玲",
		"杨幂",
		"赵丽颖",
		"迪丽热巴",
	];

	students.forEach((student) => {
		const name = student.XM;
		const givenName = getGivenName(name);
		const surname = getSurname(name);

		// ABCC (Surname + X + X)
		if (givenName.length === 2 && givenName[0] === givenName[1]) {
			interesting.sameCharNames.push(name);
			interesting.abccNames.push(name);
		}

		// AABC (Surname + Surname + Given) - rare but possible, or just double char surname
		// Actually AABC usually refers to patterns like "杨杨X".
		if (name.length === 3 && name[0] === name[1]) {
			interesting.aabcNames.push(name);
		}

		if (
			celebrityNames.includes(name) ||
			celebrityNames.some(
				(cn) => cn.slice(1) === givenName && cn.length === name.length,
			)
		) {
			interesting.celebrityLikeNames.push(name);
		}
	});

	interesting.sameCharNames = [...new Set(interesting.sameCharNames)].slice(
		0,
		50,
	);
	interesting.celebrityLikeNames = [
		...new Set(interesting.celebrityLikeNames),
	].slice(0, 30);
	interesting.abccNames = [...new Set(interesting.abccNames)].slice(0, 30);
	interesting.aabcNames = [...new Set(interesting.aabcNames)].slice(0, 30);

	return interesting;
}

// 生成单个年份或全部数据的统计
function generateStatsForStudents(students, label, allYearStats = null) {
	const surnames = analyzeSurnames(students);
	const fullNames = analyzeFullNames(students);
	const gender = analyzeGender(students);
	const nameLength = analyzeNameLength(students);
	const givenNames = analyzeGivenNames(students);
	const genderChars = analyzeGenderChars(students);
	const colleges = analyzeColleges(students);
	const classStats = analyzeClasses(students);
	const uniqueNames = findUniqueNames(students);
	const interesting = findInterestingNames(students);

	const stats = {
		generatedAt: new Date().toISOString(),
		label: label,
		total: students.length,
		yearStats: allYearStats,
		gender: {
			male: gender.male,
			female: gender.female,
			ratio: gender.ratio,
			malePercent: ((gender.male / students.length) * 100).toFixed(1),
			femalePercent: ((gender.female / students.length) * 100).toFixed(1),
		},
		surnames: surnames.slice(0, 50),
		rareNames: surnames.filter((s) => s.count <= 3).slice(0, 30),
		duplicateNames: fullNames.filter((n) => n.count > 1).slice(0, 50),
		topDuplicates: fullNames.slice(0, 30),
		nameLength: {
			distribution: nameLength.distribution,
			shortest: {
				length: nameLength.minLength,
				names: nameLength.shortestNames.slice(0, 10),
			},
			longest: {
				length: nameLength.maxLength,
				names: nameLength.longestNames.slice(0, 10),
			},
		},
		givenNames: {
			top: givenNames.topGivenNames.slice(0, 50),
			topChars: givenNames.topSingleChars.slice(0, 50),
		},
		genderChars: {
			male: genderChars.male,
			female: genderChars.female,
		},
		colleges: colleges.slice(0, 30),
		classStats: classStats,
		uniqueNamesCount: uniqueNames.length,
		uniqueNamesPercent: ((uniqueNames.length / students.length) * 100).toFixed(
			1,
		),
		interesting: {
			sameCharNames: interesting.sameCharNames,
			celebrityLikeNames: interesting.celebrityLikeNames,
			abccNames: interesting.abccNames,
			aabcNames: interesting.aabcNames,
		},
	};

	return stats;
}

async function main() {
	console.log("🚀 开始分析学生数据...\n");

	const { allStudents, studentsByYear } = await loadAllData();

	console.log(`\n📊 总计: ${allStudents.length} 名学生\n`);

	// 各年级统计信息（用于总览）
	const yearStats = {};
	for (const year of years) {
		const students = studentsByYear[year];
		const gender = analyzeGender(students);
		yearStats[year] = {
			total: students.length,
			male: gender.male,
			female: gender.female,
			ratio: gender.ratio,
		};
	}

	console.log("📅 各年级统计:");
	for (const [year, stats] of Object.entries(yearStats)) {
		console.log(
			`  ${year}级: ${stats.total}人 (男${stats.male} 女${stats.female} 比例${stats.ratio})`,
		);
	}

	// 生成总体统计数据
	console.log("\n📊 生成总体统计数据...");
	const allStats = generateStatsForStudents(allStudents, "全部年级", yearStats);
	const allStatsPath = path.join(dataDir, "stats.json");
	fs.writeFileSync(allStatsPath, JSON.stringify(allStats, null, 2), "utf-8");
	console.log(`✅ 总体统计数据已保存: ${allStatsPath}`);

	// 生成各年级统计数据
	for (const year of years) {
		console.log(`\n📊 生成 ${year} 级统计数据...`);
		const yearStudents = studentsByYear[year];
		const stats = generateStatsForStudents(yearStudents, `${year}级`, null);
		const statsPath = path.join(dataDir, `stats-${year}.json`);
		fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), "utf-8");
		console.log(`✅ ${year}级统计数据已保存: ${statsPath}`);
	}

	// 打印一些有趣的统计
	console.log("\n" + "=".repeat(50));
	console.log("📈 有趣统计摘要");
	console.log("=".repeat(50));

	const surnames = analyzeSurnames(allStudents);
	console.log("\n👨‍👩‍👧‍👦 最常见姓氏 TOP 10:");
	surnames.slice(0, 10).forEach((s, i) => {
		console.log(`  ${i + 1}. ${s.name}: ${s.count}人`);
	});

	const fullNames = analyzeFullNames(allStudents);
	console.log("\n🔤 最多重名 TOP 10:");
	fullNames.slice(0, 10).forEach((n, i) => {
		console.log(`  ${i + 1}. ${n.name}: ${n.count}人`);
	});

	const gender = analyzeGender(allStudents);
	console.log(`\n⚧ 性别统计:`);
	console.log(
		`  男生: ${gender.male}人 (${((gender.male / allStudents.length) * 100).toFixed(1)}%)`,
	);
	console.log(
		`  女生: ${gender.female}人 (${((gender.female / allStudents.length) * 100).toFixed(1)}%)`,
	);
	console.log(`  男女比例: ${gender.ratio}:1`);

	const colleges = analyzeColleges(allStudents);
	console.log("\n🏫 人数最多的专业 TOP 5:");
	colleges.slice(0, 5).forEach((c, i) => {
		console.log(`  ${i + 1}. ${c.name}: ${c.count}人`);
	});

	const genderChars = analyzeGenderChars(allStudents);
	console.log(
		"\n👦 男生最爱用字 TOP 5: " +
			genderChars.male
				.slice(0, 5)
				.map((c) => c.char)
				.join(", "),
	);
	console.log(
		"👧 女生最爱用字 TOP 5: " +
			genderChars.female
				.slice(0, 5)
				.map((c) => c.char)
				.join(", "),
	);

	console.log("\n✅ 所有统计数据生成完成！");
}

main().catch(console.error);
