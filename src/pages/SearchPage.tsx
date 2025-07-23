import React, { useState, useEffect, useMemo } from "react";
import { Search, User, Hash } from "lucide-react";
import { Student, StudentData, PinyinTable, Grade } from "../types";

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType] = useState<"auto" | "xh" | "xm">("auto");
  const [selectedGrade, setSelectedGrade] = useState<Grade | "all">("all");
  const [results, setResults] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studentsData, setStudentsData] = useState<{
    [key: string]: Student[];
  }>({});
  const [pinyinTable, setPinyinTable] = useState<PinyinTable>({});

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载拼音表
        const pinyinResponse = await fetch("/example/pinyinTable.json");
        const pinyinData = await pinyinResponse.json();
        setPinyinTable(pinyinData);

        // 加载学生数据
        const years = ["2021", "2022", "2023", "2024"];
        const data: { [key: string]: Student[] } = {};

        for (const year of years) {
          try {
            // const response = await fetch(`/example/${year}.json`);
            // 改为 jsdelvr cdn 请求访问
            const response = await fetch(
              `https://fastly.jsdelivr.net/gh/dogxii/zzuli-he@main/public/example/${year}.json`
            );
            const yearData: StudentData = await response.json();
            data[year] = yearData.aaData || [];
          } catch (error) {
            console.error(`加载 ${year} 数据失败:`, error);
            data[year] = [];
          }
        }

        setStudentsData(data);
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    };

    loadData();
  }, []);

  // 获取拼音首字母
  const getInitials = (str: string): string => {
    let initials = "";
    for (let char of str) {
      initials += pinyinTable[char] || "";
    }
    return initials.toLowerCase();
  };

  // 判断是否为中文
  const isChinese = (str: string): boolean => {
    return /^[\u4e00-\u9fa5]+$/.test(str);
  };

  // 判断是否为完整学号格式
  const isStudentNumber = (str: string): boolean => {
    return /^542[1-4]\d{8}$/.test(str);
  };

  // 判断是否为部分学号（4位及以上数字）
  const isPartialStudentNumber = (str: string): boolean => {
    return /^\d{4,}$/.test(str);
  };

  // 搜索功能
  const performSearch = useMemo(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const term = searchTerm.trim();
    let searchResults: Student[] = [];

    // 确定搜索范围
    const yearsToSearch =
      selectedGrade === "all"
        ? ["2021", "2022", "2023", "2024"]
        : [`20${selectedGrade}`];

    for (const year of yearsToSearch) {
      const yearData = studentsData[year] || [];

      // 根据搜索类型进行搜索
      if (
        searchType === "xh" ||
        (searchType === "auto" &&
          (isStudentNumber(term) || isPartialStudentNumber(term)))
      ) {
        // 学号搜索（支持模糊匹配）
        if (isStudentNumber(term)) {
          // 完整学号精确匹配
          const result = yearData.find((student) => student.XH === term);
          if (result) {
            searchResults.push(result);
          }
        } else {
          // 部分学号模糊匹配
          const partialResults = yearData.filter((student) =>
            student.XH.includes(term)
          );
          searchResults.push(...partialResults);
        }
      } else if (
        searchType === "xm" ||
        (searchType === "auto" && isChinese(term))
      ) {
        // 姓名搜索（模糊匹配）
        const nameResults = yearData.filter((student) =>
          student.XM.includes(term)
        );
        searchResults.push(...nameResults);
      } else if (
        searchType === "auto" &&
        !isChinese(term) &&
        !isPartialStudentNumber(term)
      ) {
        // 拼音首字母搜索（排除数字输入）
        const pinyinResults = yearData.filter((student) => {
          const initials = getInitials(student.XM);
          return initials.includes(term.toLowerCase());
        });
        searchResults.push(...pinyinResults);
      } else {
        // 全文搜索（简单实现）
        const fullTextResults = yearData.filter(
          (student) =>
            student.XM.includes(term) ||
            student.XH.includes(term) ||
            student.BJMC.includes(term)
        );
        searchResults.push(...fullTextResults);
      }
    }

    // 去重并限制结果数量
    const uniqueResults = searchResults
      .filter(
        (student, index, self) =>
          index === self.findIndex((s) => s.XH === student.XH)
      )
      .slice(0, 30); // 最多显示30条

    setResults(uniqueResults);
    setIsLoading(false);
  }, [searchTerm, searchType, selectedGrade, studentsData, pinyinTable]);

  // 触发搜索
  useEffect(() => {
    performSearch;
  }, [performSearch]);

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

      {/* 搜索框 */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="输入查询内容..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <select
            value={selectedGrade}
            onChange={(e) =>
              setSelectedGrade(e.target.value as typeof selectedGrade)
            }
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">全部年级</option>
            <option value="24">2024级</option>
            <option value="23">2023级</option>
            <option value="22">2022级</option>
            <option value="21">2021级</option>
          </select>
        </div>
      </div>

      {/* 搜索结果 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-blue-200 dark:border-blue-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">搜索中...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 overflow-hidden shadow-lg">
          <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-200/50 dark:border-gray-600/50">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              找到 {results.length} 条记录
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
      ) : searchTerm && !isLoading ? (
        <div className="text-center py-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20">
          <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-300">未找到相关记录</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default SearchPage;
