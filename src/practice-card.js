const axios = require("axios");
const {
    Card,
    renderError,
    renderChart,
    renderNameTitle,
} = require("./common.js");

/**
 * 
 * @param {number} id 用户id
 * @returns {Object} 获取的用户数据 {name, color, ccfLevel, passed, hideInfo}
 */
async function fetchStats(id) {
    const res = await axios.get(`https://www.luogu.com.cn/user/${id}?_contentOnly`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });

    const stats = {
        name: "NULL",
        color: "Gray",
        ccfLevel: 0,
        passed: [0,0,0,0,0,0,0,0],
        unpassed: 0,
        hideInfo: false,
        tag: ""
    }
    
    if(res.data.code !== 200) {
        return stats;
    }

    const user = res.data.currentData.user;
    const passedProblems = res.data.currentData.passedProblems || [];
    const submittedProblems = res.data.currentData.submittedProblems || [];

    // 处理用户名
    try {
        stats.name = user.name ? user.name : "Luogu User";
    } catch (e) {
        stats.name = "Luogu User";
    }
    
    // 处理徽章标签
    try {
        stats.tag = user.badge ? user.badge : "";
    } catch (e) {
        stats.tag = "";
    }

    stats.color = user.color || "Gray";
    stats.ccfLevel = user.ccfLevel || 0;
    
    // 检查用户是否隐藏信息
    if(!passedProblems || passedProblems.length === 0) {
        stats.hideInfo = true;
        return stats;
    }

    // 计算各难度通过数量 - 修复：使用正确的字段名 "difficulty"
    for(let problem of passedProblems) {
        const diff = problem.difficulty; // 注意这里是 "difficulty" 不是 "difficulty"
        if (diff >= 0 && diff <= 7) {
            stats.passed[diff]++;
        }
    }

    // 计算未通过题目数（总提交数 - 通过数） - passedProblems.length
    stats.unpassed = submittedProblems.length;
    if (stats.unpassed < 0) stats.unpassed = 0;

    return stats;
} 

const renderSVG = (stats, options) => {
    const {
        name,
        color,
        ccfLevel,
        passed,
        unpassed,
        hideInfo,
        tag
    } = stats;

    const { 
        hideTitle, 
        darkMode,
        cardWidth = 500, 
    } = options || {};

    if(hideInfo) {
        return renderError("用户开启了「完全隐私保护」，获取数据失败", {width: 360});
    }
    
    const paddingX = 25;
    const labelWidth = 90;
    const progressWidth = cardWidth - 2*paddingX - labelWidth - 60;

    const datas = [
        {label: "未评定", color:"#bfbfbf", data: passed[0]},
        {label: "入门", color:"#fe4c61", data: passed[1]},
        {label: "普及-", color:"#f39c11", data: passed[2]},
        {label: "普及/提高-", color:"#ffc116", data: passed[3]},
        {label: "普及+/提高", color:"#52c41a", data: passed[4]},
        {label: "提高+/省选-", color:"#3498db", data: passed[5]},
        {label: "省选/NOI-", color:"#9d3dcf", data: passed[6]},
        {label: "NOI/NOI+/CTSC", color:"#0e1d69", data: passed[7]},
        {label: "尝试过的题目", color:"#0101DF", data: unpassed}
    ]
    
    // 计算总通过题目数
    const passedSum = passed.reduce((a, b) => a + b, 0);
    const body = renderChart(datas, labelWidth, progressWidth, "题");

    const title = renderNameTitle(name, color, ccfLevel, "的练习情况", cardWidth, `已通过: ${passedSum}题`, tag);

    return new Card({
        width: cardWidth - 2*paddingX,
        height: datas.length*30 + 10,
        hideTitle,
        darkMode,
        title,
        body,
    }).render();
}

module.exports = { fetchStats, renderSVG }
