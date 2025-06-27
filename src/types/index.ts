// 学生信息类型定义
export interface Student {
    XH: string;      // 学号
    DM: string;      // 代码
    BJMC: string;    // 班级名称
    XB: string;      // 性别
    XM: string;      // 姓名
}

// 数据文件结构
export interface StudentData {
    sEcho: number;
    iDisplayStart: number;
    iDisplayLength: number;
    iSortColList: number[];
    sSortDirList: string[];
    iTotalRecords: number;
    iTotalDisplayRecords: number;
    aaData: Student[];
}

// 拼音表类型
export interface PinyinTable {
    [key: string]: string;
}

// 查询结果类型
export interface SearchResult {
    results: Student[];
    total: number;
    searchTerm: string;
    searchType: 'xh' | 'xm' | 'initials';
}

// 工具站点类型
export interface ToolSite {
    id: string;
    name: string;
    description: string;
    url: string;
    icon: string;
    category: string;
}

// 年级选项
export type Grade = '21' | '22' | '23' | '24';
