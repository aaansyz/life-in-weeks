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
        
        // Live color preview
        const pastColorInput = document.getElementById('pastColor');
        pastColorInput.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--past-color', e.target.value);
        });

        // Download button (mobile shows hint)
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', () => this.handleDownload());
    }

    setDefaultDate() {
        // Default birthdate to 25 years before today
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
            alert('Please fill in your birthdate and expected lifespan.');
            return;
        }

        if (lifespan < 1 || lifespan > 150) {
            alert('Expected lifespan must be between 1 and 150.');
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

        // Scroll to results
        document.getElementById('weeksSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    async handleDownload() {
        // Mobile: show hint only
        if (isMobileDevice()) {
            showToast('For the best quality, please export on a desktop browser.');
            return;
        }

        const target = document.getElementById('weeksContainer');
        if (!target || target.children.length === 0) {
            showToast('Please generate your life calendar first.');
            return;
        }

        // user feedback
        showToast('Preparing a high-resolution image, please wait…');

        // Ensure html-to-image is available; dynamically load if missing with multi-CDN fallback
        if (typeof window.htmlToImage === 'undefined') {
            const cdnCandidates = [
                'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js',
                'https://unpkg.com/html-to-image@1.11.11/dist/html-to-image.min.js',
                'https://esm.sh/html-to-image@1.11.11/dist/html-to-image.min.js'
            ];
            let loaded = false;
            for (const src of cdnCandidates) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await loadScript(src);
                    if (typeof window.htmlToImage !== 'undefined') {
                        loaded = true;
                        break;
                    }
                } catch (e) {
                    // Continue to next CDN; also log for diagnostics
                    // eslint-disable-next-line no-console
                    console.warn('[html-to-image] load failed from', src, e);
                }
            }
            if (!loaded) {
                showToast('Renderer not loaded. Please allow CDN scripts or try again.');
                return;
            }
        }

        // Temporarily adjust styles for clean export
        const weeksSectionEl = document.querySelector('.weeks-section');
        const originalShadow = weeksSectionEl ? weeksSectionEl.style.boxShadow : '';
        if (weeksSectionEl) weeksSectionEl.style.boxShadow = 'none';

        const scale = 2; // retina-friendly
        try {
            // Create a wrapper with padding for top/right whitespace
            const wrapper = document.createElement('div');
            wrapper.style.background = '#ffffff';
            wrapper.style.paddingTop = '24px';   // top whitespace
            wrapper.style.paddingRight = '24px'; // right whitespace
            wrapper.style.display = 'inline-block';
            wrapper.style.position = 'fixed';
            wrapper.style.left = '-10000px'; // keep off-screen while rendering
            wrapper.appendChild(target.cloneNode(true));
            document.body.appendChild(wrapper);

            // Use toPng on wrapper to include padding
            const dataUrl = await window.htmlToImage.toPng(wrapper, {
                pixelRatio: scale,
                backgroundColor: '#ffffff',
                style: { filter: 'none' }
            });
            const link = document.createElement('a');
            const lifespan = document.getElementById('lifespan').value || 'life';
            link.download = `life-in-weeks_${lifespan}y.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // cleanup
            document.body.removeChild(wrapper);
        } catch (err) {
            showToast('Export failed. Try reducing size or use desktop Chrome.');
        } finally {
            if (weeksSectionEl) weeksSectionEl.style.boxShadow = originalShadow;
        }
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
                    // Weeks before birth within the first year row
                    weekCircle.classList.add('before-birth');
                    status = 'Before birth';
                    description = `${currentYear} • Week ${week} (before birth)`;
                } else {
                    // 用户生命中的周数
                    const lifeWeekNumber = currentLifeWeek; // 保存当前周数
                    
                    if (currentLifeWeek <= weeksLived) {
                        // 已经度过的周数
                        weekCircle.classList.add('past');
                        status = 'Lived';
                        description = `Life week ${lifeWeekNumber} (lived)`;
                    } else {
                        // 未来的周数
                        weekCircle.classList.add('future');
                        status = 'Future';
                        description = `Life week ${lifeWeekNumber} (future)`;
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
                <div class="tooltip-title">Life week ${weekNumber}</div>
                <div class="tooltip-details">
                    <div>${year} • Week ${weekOfYear}</div>
                    <div class="tooltip-status ${status === 'Before birth' ? 'before-birth' : status === 'Lived' ? 'past' : 'future'}">${status}</div>
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

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new LifeInWeeks();
});

// Enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Submit on Enter
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('generateBtn').click();
            }
        });
    });

    // Validation hint
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

// Helpers outside class
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.transition = 'opacity 300ms ease';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
            toast.style.transition = '';
        }, 300);
    }, duration);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}
