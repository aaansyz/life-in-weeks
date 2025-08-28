class LifeInWeeks {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setDefaultDate();
    }

    bindEvents() {
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.addEventListener('click', () => this.generateLifeWeeks());
        
        // 实时更新颜色预览
        const pastColorInput = document.getElementById('pastColor');
        pastColorInput.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--past-color', e.target.value);
        });
    }

    setDefaultDate() {
        // 设置默认出生日期为距离当前时间25岁
        const today = new Date();
        const defaultBirthYear = today.getFullYear() - 25;
        const defaultBirthDate = new Date(defaultBirthYear, today.getMonth(), today.getDate());
        const birthdateInput = document.getElementById('birthdate');
        birthdateInput.value = defaultBirthDate.toISOString().split('T')[0];
    }

    generateLifeWeeks() {
        const birthdate = document.getElementById('birthdate').value;
        const lifespan = parseInt(document.getElementById('lifespan').value);
        const pastColor = document.getElementById('pastColor').value;

        if (!birthdate || !lifespan) {
            alert('请填写完整的出生日期和预期寿命');
            return;
        }

        if (lifespan < 1 || lifespan > 150) {
            alert('预期寿命必须在1-150年之间');
            return;
        }

        // 计算各种数据
        const totalWeeks = lifespan * 52;
        const weeksLived = this.calculateWeeksLived(birthdate);
        const weeksRemaining = Math.max(0, totalWeeks - weeksLived);
        const currentAge = this.calculateAge(birthdate);

        // 更新统计信息
        this.updateStats(totalWeeks, weeksLived, weeksRemaining, currentAge);

        // 生成生命时间圆圈
        this.generateWeeksVisualization(birthdate, lifespan, weeksLived, pastColor);

        // 显示结果区域
        document.getElementById('statsSection').style.display = 'block';
        document.getElementById('weeksSection').style.display = 'block';

        // 滚动到结果区域
        document.getElementById('weeksSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    calculateWeeksLived(birthdate) {
        const birth = new Date(birthdate);
        const now = new Date();
        const diffTime = Math.abs(now - birth);
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        return diffWeeks;
    }

    calculateAge(birthdate) {
        const birth = new Date(birthdate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    updateStats(totalWeeks, weeksLived, weeksRemaining, age) {
        document.getElementById('totalWeeks').textContent = totalWeeks.toLocaleString();
        document.getElementById('weeksLived').textContent = weeksLived.toLocaleString();
        document.getElementById('weeksRemaining').textContent = weeksRemaining.toLocaleString();
        document.getElementById('age').textContent = age;
    }

    generateWeeksVisualization(birthdate, lifespan, weeksLived, pastColor) {
        const container = document.getElementById('weeksContainer');
        container.innerHTML = '';

        const birth = new Date(birthdate);
        const birthYear = birth.getFullYear();
        
        // 计算用户生命开始的第一周（从出生日期开始）
        let currentLifeWeek = 1; // 用户生命中的当前周数

        for (let year = 0; year < lifespan; year++) {
            const currentYear = birthYear + year;
            const yearRow = document.createElement('div');
            yearRow.className = 'year-row';

            // 添加年份标签，只显示5的整数倍年份
            if (year % 5 === 0) {
                const yearLabel = document.createElement('div');
                yearLabel.className = 'year-label';
                yearLabel.textContent = currentYear;
                yearRow.appendChild(yearLabel);
            } else {
                // 不显示年份标签时，添加占位符保持对齐
                const yearSpacer = document.createElement('div');
                yearSpacer.className = 'year-spacer';
                yearRow.appendChild(yearSpacer);
            }

            // 生成52个周圆圈
            for (let week = 1; week <= 52; week++) {
                const weekCircle = document.createElement('div');
                weekCircle.className = 'week-circle';
                weekCircle.style.setProperty('--past-color', pastColor);

                let status, description;
                
                if (year === 0 && week < this.getWeekOfYear(birth)) {
                    // 第一年，出生前的周数
                    weekCircle.classList.add('before-birth');
                    status = '出生前';
                    description = `${currentYear}年 第${week}周 (出生前)`;
                } else {
                    // 用户生命中的周数
                    const lifeWeekNumber = currentLifeWeek; // 保存当前周数
                    
                    if (currentLifeWeek <= weeksLived) {
                        // 已经度过的周数
                        weekCircle.classList.add('past');
                        status = '已度过';
                        description = `生命第${lifeWeekNumber}周 (已度过)`;
                    } else {
                        // 未来的周数
                        weekCircle.classList.add('future');
                        status = '未来';
                        description = `生命第${lifeWeekNumber}周 (未来)`;
                    }
                    
                    // 添加点击事件
                    weekCircle.addEventListener('click', (e) => {
                        this.showWeekInfo(e, lifeWeekNumber, currentYear, week, status, description);
                    });
                    
                    currentLifeWeek++; // 递增用户生命中的周数
                }

                yearRow.appendChild(weekCircle);
            }

            container.appendChild(yearRow);
        }
    }

    getWeekOfYear(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    showWeekInfo(event, weekNumber, year, weekOfYear, status, description) {
        // 移除已存在的提示框
        const existingTooltip = document.querySelector('.week-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        // 创建提示框
        const tooltip = document.createElement('div');
        tooltip.className = 'week-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <div class="tooltip-title">生命中的第${weekNumber}周</div>
                <div class="tooltip-details">
                    <div>${year}年 第${weekOfYear}周</div>
                    <div class="tooltip-status ${status === '出生前' ? 'before-birth' : status === '已度过' ? 'past' : 'future'}">${status}</div>
                </div>
            </div>
        `;

        // 设置提示框位置
        const rect = event.target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        tooltip.style.position = 'absolute';
        tooltip.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top + scrollTop - 60) + 'px';

        // 添加到页面
        document.body.appendChild(tooltip);

        // 5秒后自动移除
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 5000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new LifeInWeeks();
});

// 添加一些交互增强功能
document.addEventListener('DOMContentLoaded', () => {
    // 为输入框添加回车键支持
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('generateBtn').click();
            }
        });
    });

    // 添加输入验证提示
    const lifespanInput = document.getElementById('lifespan');
    lifespanInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value < 1 || value > 150) {
            e.target.style.borderColor = '#ef4444';
        } else {
            e.target.style.borderColor = '#e5e7eb';
        }
    });
});
