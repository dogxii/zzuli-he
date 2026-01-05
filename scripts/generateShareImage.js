const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../public/example");
const outputDir = path.join(__dirname, "../public/share");

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// 生成 HTML 模板
function generateHTML(stats, isAllYears = false) {
	const topSurnames = stats.surnames.slice(0, 10);
	const topDuplicates = stats.topDuplicates.slice(0, 10);
	const topMajors = stats.colleges.slice(0, 10);

	// 性别常用字
	const maleChars = stats.genderChars
		? stats.genderChars.male.slice(0, 12)
		: [];
	const femaleChars = stats.genderChars
		? stats.genderChars.female.slice(0, 12)
		: [];

	// 名字长度分布
	const lenDist = stats.nameLength.distribution;
	const total = stats.total;
	const len2 = lenDist["2"] || 0;
	const len3 = lenDist["3"] || 0;
	// 计算4字及以上
	let len4Plus = 0;
	Object.entries(lenDist).forEach(([k, v]) => {
		if (parseInt(k) >= 4) len4Plus += v;
	});

	const p2 = ((len2 / total) * 100).toFixed(1);
	const p3 = ((len3 / total) * 100).toFixed(1);
	const p4 = ((len4Plus / total) * 100).toFixed(1);

	const longestNames = stats.nameLength.longest.names.slice(0, 8);

	// 有趣的名字
	const sameCharNames = stats.interesting.sameCharNames.slice(0, 18);
	const celebrityNames = stats.interesting.celebrityLikeNames.slice(0, 18);
	// ABCC 名字 (如: 王飞飞) - 如果 generateStats.js 中没有这个字段，就用空数组
	const abccNames = stats.interesting.abccNames
		? stats.interesting.abccNames.slice(0, 12)
		: [];

	const title = isAllYears
		? "ZZULI 姓名大数据报告"
		: `ZZULI ${stats.label}姓名大数据`;
	const subtitle = isAllYears
		? "郑州轻工业大学 2021-2025 级学生数据分析"
		: `郑州轻工业大学 ${stats.label}学生数据分析`;

	// 年级统计部分（仅全部年级时显示）
	const yearStatsSection =
		isAllYears && stats.yearStats
			? `
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📅</div>
                    <div class="section-title">各年级概况</div>
                </div>
                <div class="year-grid">
                    ${Object.entries(stats.yearStats)
											.sort(([a], [b]) => b.localeCompare(a))
											.map(
												([year, data]) => `
                        <div class="year-card">
                            <div class="year-label">${year}级</div>
                            <div class="year-count">${data.total.toLocaleString()}人</div>
                            <div class="year-ratio">男女比 ${data.ratio}</div>
                        </div>
                    `,
											)
											.join("")}
                </div>
            </div>
        `
			: "";

	// 专业统计部分
	const majorStatsSection = `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">🎓</div>
                <div class="section-title">人数最多的专业 TOP 10</div>
            </div>
            <div class="major-list">
                ${topMajors
									.map(
										(m, i) => `
                    <div class="major-item">
                        <div class="major-rank">${i + 1}</div>
                        <div class="major-name">${m.name}</div>
                        <div class="major-bar-container">
                            <div class="major-bar" style="width: ${(m.count / topMajors[0].count) * 100}%"></div>
                        </div>
                        <div class="major-count">${m.count}人</div>
                    </div>
                `,
									)
									.join("")}
            </div>
        </div>
    `;

	// 名字长度分布部分
	const nameLengthSection = `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📏</div>
                <div class="section-title">名字长度分布</div>
            </div>
            <div class="length-stats">
                <div class="length-card">
                    <div class="length-val">${p2}%</div>
                    <div class="length-label">二字名</div>
                    <div class="length-bar"><div style="width: ${p2}%"></div></div>
                </div>
                <div class="length-card highlight">
                    <div class="length-val">${p3}%</div>
                    <div class="length-label">三字名</div>
                    <div class="length-bar"><div style="width: ${p3}%"></div></div>
                </div>
                <div class="length-card">
                    <div class="length-val">${p4}%</div>
                    <div class="length-label">四字及以上</div>
                    <div class="length-bar"><div style="width: ${Math.max(p4, 5)}%"></div></div>
                </div>
            </div>
            ${
							longestNames.length > 0
								? `
            <div class="longest-names-box">
                <div class="sub-title">最长的名字</div>
                <div class="tag-cloud">
                    ${longestNames.map((n) => `<span class="tag long">${n}</span>`).join("")}
                </div>
            </div>
            `
								: ""
						}
        </div>
    `;

	// 性别常用字部分
	const genderCharSection =
		maleChars.length > 0
			? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">🔤</div>
                <div class="section-title">男女生最爱用字</div>
            </div>
            <div class="gender-chars-container">
                <div class="gender-char-box male">
                    <div class="gender-char-title">👦 男生爱用</div>
                    <div class="char-tags">
                        ${maleChars.map((c) => `<span class="char-tag">${c.char}</span>`).join("")}
                    </div>
                </div>
                <div class="gender-char-box female">
                    <div class="gender-char-title">👧 女生爱用</div>
                    <div class="char-tags">
                        ${femaleChars.map((c) => `<span class="char-tag">${c.char}</span>`).join("")}
                    </div>
                </div>
            </div>
        </div>
    `
			: "";

	// 有趣的名字部分
	const interestingSection = `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">✨</div>
                <div class="section-title">有趣的发现</div>
            </div>

            ${
							sameCharNames.length > 0
								? `
            <div class="interesting-box">
                <div class="sub-title" style="color: #db2777">🌸 叠字名 (共${stats.interesting.sameCharNames.length}人)</div>
                <div class="tag-cloud">
                    ${sameCharNames.map((n) => `<span class="tag pink">${n}</span>`).join("")}
                </div>
            </div>
            `
								: ""
						}

            ${
							celebrityNames.length > 0
								? `
            <div class="interesting-box" style="margin-top: 15px;">
                <div class="sub-title" style="color: #d97706">⭐ 与名人"撞名"</div>
                <div class="tag-cloud">
                    ${celebrityNames.map((n) => `<span class="tag gold">${n}</span>`).join("")}
                </div>
            </div>
            `
								: ""
						}
        </div>
    `;

	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f4f6;
            min-height: 100vh;
            padding: 40px;
            display: flex;
            justify-content: center;
        }

        .container {
            width: 800px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            overflow: hidden;
            position: relative;
        }

        /* 顶部装饰条 */
        .top-bar {
            height: 8px;
            background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
        }

        .header {
            padding: 40px 40px 30px;
            text-align: center;
            background: #fff;
            border-bottom: 1px solid #f3f4f6;
        }

        .header h1 {
            font-size: 36px;
            color: #111827;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        .header p {
            color: #6b7280;
            font-size: 16px;
        }

        .total-badge {
            display: inline-flex;
            align-items: center;
            background: #eff6ff;
            color: #2563eb;
            padding: 8px 20px;
            border-radius: 50px;
            margin-top: 20px;
            font-size: 18px;
            font-weight: 600;
        }

        .content {
            padding: 40px;
            background: #fff;
        }

        /* 核心数据卡片 */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: #f9fafb;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            border: 1px solid #e5e7eb;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 800;
            color: #111827;
            line-height: 1.2;
        }

        .stat-label {
            font-size: 13px;
            color: #6b7280;
            margin-top: 6px;
            font-weight: 500;
        }

        .stat-sub {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 2px;
        }

        /* 章节通用样式 */
        .section {
            margin-bottom: 40px;
        }

        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            gap: 10px;
        }

        .section-icon {
            font-size: 24px;
        }

        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
        }

        .sub-title {
            font-size: 14px;
            font-weight: 600;
            color: #4b5563;
            margin-bottom: 10px;
        }

        /* 性别比例条 */
        .gender-bar-container {
            height: 36px;
            background: #f3f4f6;
            border-radius: 18px;
            overflow: hidden;
            display: flex;
            position: relative;
        }

        .gender-bar-male {
            background: #3b82f6;
            height: 100%;
            display: flex;
            align-items: center;
            padding-left: 20px;
            color: white;
            font-weight: 600;
            font-size: 14px;
        }

        .gender-bar-female {
            background: #ec4899;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 20px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            flex: 1;
        }

        .gender-ratio-text {
            text-align: center;
            margin-top: 8px;
            font-size: 13px;
            color: #6b7280;
        }

        /* 年级卡片 */
        .year-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
        }

        .year-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 15px 10px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }

        .year-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
        }

        .year-count {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
        }

        .year-ratio {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 4px;
        }

        /* 双栏布局 */
        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        /* 排行榜列表 */
        .rank-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .rank-item {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            background: #f9fafb;
            border-radius: 10px;
        }

        .rank-num {
            width: 24px;
            height: 24px;
            background: #e5e7eb;
            color: #6b7280;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            margin-right: 12px;
        }

        .rank-item:nth-child(1) .rank-num { background: #fee2e2; color: #ef4444; }
        .rank-item:nth-child(2) .rank-num { background: #ffedd5; color: #f97316; }
        .rank-item:nth-child(3) .rank-num { background: #fef9c3; color: #eab308; }

        .rank-name {
            font-weight: 600;
            color: #374151;
            flex: 1;
        }

        .rank-count {
            font-size: 13px;
            color: #6b7280;
            font-weight: 500;
        }

        /* 专业列表 */
        .major-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .major-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .major-rank {
            width: 20px;
            text-align: center;
            font-size: 13px;
            color: #9ca3af;
            font-weight: 600;
        }

        .major-name {
            width: 140px;
            font-size: 14px;
            color: #374151;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .major-bar-container {
            flex: 1;
            height: 8px;
            background: #f3f4f6;
            border-radius: 4px;
            overflow: hidden;
        }

        .major-bar {
            height: 100%;
            background: #3b82f6;
            border-radius: 4px;
        }

        .major-count {
            width: 50px;
            text-align: right;
            font-size: 13px;
            color: #6b7280;
        }

        /* 名字长度分布 */
        .length-stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }

        .length-card {
            background: #f9fafb;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
        }

        .length-card.highlight {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
        }

        .length-val {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
        }

        .length-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 8px;
        }

        .length-bar {
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            overflow: hidden;
        }

        .length-bar div {
            height: 100%;
            background: #3b82f6;
        }

        .longest-names-box {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #bbf7d0;
        }

        /* 性别常用字 */
        .gender-chars-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .gender-char-box {
            padding: 20px;
            border-radius: 16px;
        }

        .gender-char-box.male { background: #eff6ff; }
        .gender-char-box.female { background: #fdf2f8; }

        .gender-char-title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .male .gender-char-title { color: #1d4ed8; }
        .female .gender-char-title { color: #be185d; }

        .char-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .char-tag {
            background: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        }

        .male .char-tag { color: #2563eb; }
        .female .char-tag { color: #db2777; }

        /* 标签云 */
        .tag-cloud {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .tag {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
        }

        .tag.pink { background: #fce7f3; color: #be185d; }
        .tag.gold { background: #fef3c7; color: #b45309; }
        .tag.long { background: #dcfce7; color: #15803d; }

        /* 底部 */
        .footer {
            background: #111827;
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .footer-content {
            position: relative;
            z-index: 2;
        }

        .footer-url {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }

        .footer-desc {
            font-size: 14px;
            color: #9ca3af;
        }

        .footer-date {
            margin-top: 15px;
            font-size: 12px;
            color: #4b5563;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="top-bar"></div>

        <div class="header">
            <h1>${title}</h1>
            <p>${subtitle}</p>
            <div class="total-badge">
                👥 ${stats.total.toLocaleString()} 名学生
            </div>
        </div>

        <div class="content">
            <!-- 核心数据 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" style="color: #3b82f6">${stats.gender.malePercent}%</div>
                    <div class="stat-label">男生占比</div>
                    <div class="stat-sub">${stats.gender.male.toLocaleString()}人</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #ec4899">${stats.gender.femalePercent}%</div>
                    <div class="stat-label">女生占比</div>
                    <div class="stat-sub">${stats.gender.female.toLocaleString()}人</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #10b981">${stats.uniqueNamesPercent}%</div>
                    <div class="stat-label">独特名字</div>
                    <div class="stat-sub">${stats.uniqueNamesCount.toLocaleString()}人无重名</div>
                </div>
            </div>

            <!-- 性别比例条 -->
            <div class="section">
                <div class="gender-bar-container">
                    <div class="gender-bar-male" style="width: ${stats.gender.malePercent}%">
                        ♂ ${stats.gender.malePercent}%
                    </div>
                    <div class="gender-bar-female">
                        ♀ ${stats.gender.femalePercent}%
                    </div>
                </div>
                <div class="gender-ratio-text">男女比例 ${stats.gender.ratio} : 1</div>
            </div>

            ${yearStatsSection}

            ${nameLengthSection}

            ${majorStatsSection}

            <div class="two-col">
                <!-- 姓氏排行 -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-icon">👑</div>
                        <div class="section-title">姓氏排行 TOP 10</div>
                    </div>
                    <div class="rank-list">
                        ${topSurnames
													.map(
														(s, i) => `
                            <div class="rank-item">
                                <div class="rank-num">${i + 1}</div>
                                <div class="rank-name">${s.name}</div>
                                <div class="rank-count">${s.count}人</div>
                            </div>
                        `,
													)
													.join("")}
                    </div>
                </div>

                <!-- 重名排行 -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-icon">👥</div>
                        <div class="section-title">重名排行 TOP 10</div>
                    </div>
                    <div class="rank-list">
                        ${topDuplicates
													.map(
														(s, i) => `
                            <div class="rank-item">
                                <div class="rank-num">${i + 1}</div>
                                <div class="rank-name">${s.name}</div>
                                <div class="rank-count">${s.count}人</div>
                            </div>
                        `,
													)
													.join("")}
                    </div>
                </div>
            </div>

            ${genderCharSection}

            ${interestingSection}

        </div>

        <div class="footer">
            <div class="footer-content">
                <div class="footer-url">he.dogxi.me</div>
                <div class="footer-desc">访问网站查看更多有趣统计 · 仅供娱乐</div>
                <div class="footer-date">数据更新于 ${stats.generatedAt.split("T")[0]}</div>
            </div>
        </div>
    </div>
</body>
</html>
`;
}

// 生成所有图片
async function generateAllImages() {
	const files = [
		{ name: "stats.json", output: "share-all.html", isAll: true },
		{ name: "stats-2025.json", output: "share-2025.html", isAll: false },
		{ name: "stats-2024.json", output: "share-2024.html", isAll: false },
		{ name: "stats-2023.json", output: "share-2023.html", isAll: false },
		{ name: "stats-2022.json", output: "share-2022.html", isAll: false },
		{ name: "stats-2021.json", output: "share-2021.html", isAll: false },
	];

	console.log("🚀 开始生成分享页面...\n");

	for (const file of files) {
		try {
			const statsPath = path.join(dataDir, file.name);
			if (!fs.existsSync(statsPath)) {
				console.warn(`⚠️  文件不存在: ${file.name}，跳过`);
				continue;
			}
			const stats = JSON.parse(fs.readFileSync(statsPath, "utf-8"));
			const html = generateHTML(stats, file.isAll);
			const outputPath = path.join(outputDir, file.output);
			fs.writeFileSync(outputPath, html, "utf-8");
			console.log(`✅ 已生成: ${file.output}`);
		} catch (e) {
			console.error(`❌ 生成 ${file.output} 失败:`, e.message);
		}
	}

	console.log(`\n📁 所有 HTML 文件已保存到: ${outputDir}`);
	console.log("\n📝 生成 PNG 图片的方法:");
	console.log("   方法1: 手动在浏览器中打开 HTML 文件，然后截图");
	console.log(
		"   方法2: 安装 puppeteer 后运行: node scripts/generateShareImage.js --screenshot",
	);

	// 如果有 --screenshot 参数，尝试使用 puppeteer 截图
	if (process.argv.includes("--screenshot")) {
		await generateScreenshots(files);
	}
}

// 使用 puppeteer 生成截图
async function generateScreenshots(files) {
	console.log("\n🖼️  开始生成 PNG 图片...\n");

	let puppeteer;
	try {
		puppeteer = require("puppeteer");
	} catch (e) {
		console.log("⚠️  未安装 puppeteer，跳过自动截图");
		console.log("   请运行: npm install puppeteer");
		return;
	}

	const browser = await puppeteer.launch({
		headless: "new",
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	for (const file of files) {
		try {
			const htmlPath = path.join(outputDir, file.output);
			if (!fs.existsSync(htmlPath)) continue;

			const page = await browser.newPage();
			await page.setViewport({
				width: 880,
				height: 1600,
				deviceScaleFactor: 2,
			});

			await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });

			// 等待内容加载
			await page.waitForSelector(".container");

			// 获取容器元素
			const container = await page.$(".container");
			const boundingBox = await container.boundingBox();

			// 截图
			const pngName = file.output.replace(".html", ".png");
			const pngPath = path.join(outputDir, pngName);

			await page.screenshot({
				path: pngPath,
				clip: {
					x: boundingBox.x,
					y: boundingBox.y,
					width: boundingBox.width,
					height: boundingBox.height,
				},
			});

			console.log(`✅ 已生成图片: ${pngName}`);
			await page.close();
		} catch (e) {
			console.error(`❌ 生成 ${file.output} 的图片失败:`, e.message);
		}
	}

	await browser.close();
	console.log(`\n🎉 所有图片已生成到: ${outputDir}`);
}

// 运行
generateAllImages().catch(console.error);
