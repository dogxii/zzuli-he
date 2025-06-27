import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Settings, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: "查询", href: "/search", icon: Search },
    { name: "更多", href: "/tools", icon: Settings },
  ];

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path === "/search" && location.pathname === "/")
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Vision Pro 风格左侧导航 - 桌面端 */}
      <div className="hidden lg:block fixed left-6 top-1/2 transform -translate-y-1/2 z-50">
        <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-2xl p-2 shadow-2xl">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                    isActive(item.href)
                      ? "bg-white dark:bg-gray-700 shadow-lg scale-110"
                      : "hover:bg-white/50 dark:hover:bg-gray-700/50 hover:scale-105"
                  }`}
                  title={item.name}
                >
                  <Icon
                    className={`h-6 w-6 transition-colors ${
                      isActive(item.href)
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100"
                    }`}
                  />

                  {/* 悬浮标签 */}
                  <div className="absolute left-16 bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.name}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                  </div>
                </Link>
              );
            })}

            {/* 主题切换按钮 */}
            <button
              onClick={toggleTheme}
              className="group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:scale-105"
              title={theme === "light" ? "切换到黑夜模式" : "切换到日间模式"}
            >
              {theme === "light" ? (
                <Moon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-colors" />
              ) : (
                <Sun className="h-6 w-6 text-gray-300 group-hover:text-gray-100 transition-colors" />
              )}

              {/* 悬浮标签 */}
              <div className="absolute left-16 bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {theme === "light" ? "黑夜模式" : "日间模式"}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* 移动端顶部栏 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 transition-colors duration-300">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              📦 我超 盒 (zzuli)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单遮罩 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 移动端菜单 */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl transform ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        } lg:hidden transition-transform duration-300 ease-out`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              导航
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <nav className="flex-1 px-6 py-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center p-4 rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-blue-500 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="lg:pl-20 pt-16 lg:pt-0">
        <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
