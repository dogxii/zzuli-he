import React from "react";
import { ExternalLink, Code, Github, Sheet, Book, Dog } from "lucide-react";

const ToolsPage: React.FC = () => {
  const tools = [
    {
      name: "假条生成",
      url: "https://jt.dogxi.me",
      icon: Sheet,
      desc: "zzuli 假条生成器 jt.dogxi.me",
    },
    {
      name: "课程平台",
      url: "https://wk.dogxi.top",
      icon: Book,
      desc: "低价刷课下单平台 wk.dogxi.top",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        关于
      </h1>
      {/* 关于区域 */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 p-8">
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              📦 我超 盒
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              方便快捷查询学生信息的网页，以检验是否为本校(zzuli)学生。<br></br>
              请勿用于非法用途。<br></br>
              (文件采用 jsdelivr cdn 代理，无法搜索请刷新)<br></br> by Dogxi
            </p>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"></p>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"></p>
          </div>

          <div className="flex justify-center space-x-6">
            <a
              href="https://github.com/dogxii"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </a>
            <a
              href="https://dogxi.me/"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Dog className="h-5 w-5" />
              <span>主页</span>
            </a>
            <a
              href="https://blog.dogxi.me/"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Code className="h-5 w-5" />
              <span>博客</span>
            </a>
          </div>
        </div>
      </div>

      {/* 工具区域 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          其他工具
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <Icon className="h-8 w-8 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {tool.desc}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-auto" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
        <p>Built on Vercel</p>
      </div>
    </div>
  );
};

export default ToolsPage;
