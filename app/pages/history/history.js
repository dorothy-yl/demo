Page({
  data: {
    currentDate: '',
    currentDateObj: null,
    selectedDateStr: '', // YYYY-MM-DD format for filtering
    records: [],
    showCalendar: false,
    // Calendar data
    calendarCurrentDate: new Date(),
    calendarDays: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    currentMonthText: ''
  },

  onLoad() {
    console.log('History Page Load');
    // 初始化当前日期为今天
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.setData({
      currentDateObj: today.getTime(),
      selectedDateStr: this.formatDateString(today)
    });
    this.updateDateDisplay(today);
    this.loadRecordsForDate(today);
    this.generateCalendar();
  },

  onShow() {
    // 每次显示页面时重新加载当前日期的记录
    const selectedDate = new Date(this.data.currentDateObj);
    this.loadRecordsForDate(selectedDate);
  },

  // 格式化日期为 YYYY-MM-DD 字符串
  formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期为显示格式 "12月24日"
  formatDateDisplay(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 格式化时长为 "HH:MM:SS" 格式
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = secs.toString().padStart(2, '0');
    
    return `${h}:${m}:${s}`;
  },

  // 从 ISO 字符串或 Date 对象中提取日期字符串
  getDateStringFromRecord(record) {
    if (!record || !record.date) return '';
    
    const dateValue = record.date;
    
    // 如果已经是 YYYY-MM-DD 格式的字符串，直接返回
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // 如果是 ISO 字符串（如 "2025-12-05T15:23:00.000Z"），直接提取前10个字符（YYYY-MM-DD）
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      const datePart = dateValue.substring(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
    
    // 如果是 Date 对象或其他格式，尝试解析并使用 UTC 方法避免时区问题
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      
      // 使用 UTC 方法提取日期，避免时区转换问题
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return '';
    }
  },

  // 更新日期显示
  updateDateDisplay(date) {
    this.setData({
      currentDate: this.formatDateDisplay(date),
      currentDateObj: date.getTime(),
      selectedDateStr: this.formatDateString(date)
    });
  },

  // 根据日期加载记录
  loadRecordsForDate(date) {
    try {
      const history = ty.getStorageSync({key: 'exerciseHistory'}) || [];
      const targetDateStr = this.formatDateString(date);
      
      // 筛选出当天的记录
      const dayRecords = history.filter(record => {
        const recordDateStr = this.getDateStringFromRecord(record);
        return recordDateStr === targetDateStr;
      });
      
      // 格式化记录以匹配页面显示需求
      const formattedRecords = dayRecords.map(record => {
        // 将duration从秒转换为 "HH:MM:SS" 格式
        const durationFormatted = this.formatTime(record.duration || 0);
        
        return {
          id: record.id,
          duration: durationFormatted,
          date: record.dateFormatted || record.date,
          speed: record.speedKmh ? record.speedKmh.toFixed(2) : (record.speed ? record.speed.toFixed(2) : '0.00'),
          calories: Math.round(record.calories).toString(),
          distance: record.distance ? record.distance.toFixed(1) : '0.0',
          // 保存完整数据用于详情页
          fullRecord: record
        };
      });
      
      // 按时间排序（最新的在前）
      formattedRecords.sort((a, b) => {
        const dateA = new Date(a.fullRecord.date || 0).getTime();
        const dateB = new Date(b.fullRecord.date || 0).getTime();
        return dateB - dateA;
      });
      
      this.setData({
        records: formattedRecords
      });
    } catch (error) {
      console.error('Error loading records:', error);
      this.setData({
        records: []
      });
    }
  },

  prevDate() {
    const currentDate = new Date(this.data.currentDateObj);
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    prevDate.setHours(0, 0, 0, 0);
    this.updateDateDisplay(prevDate);
    this.loadRecordsForDate(prevDate);
  },

  nextDate() {
    const currentDate = new Date(this.data.currentDateObj);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);
    this.updateDateDisplay(nextDate);
    this.loadRecordsForDate(nextDate);
  },

  // 显示日历弹窗
  showCalendar() {
    // 设置日历显示为当前选择的日期所在月份
    const selectedDate = new Date(this.data.currentDateObj);
    this.setData({
      showCalendar: true,
      calendarCurrentDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    });
    this.generateCalendar();
  },

  // 隐藏日历弹窗
  hideCalendar() {
    this.setData({
      showCalendar: false
    });
  },

  // 从日历选择日期
  selectDateFromCalendar(e) {
    const dateStr = e.currentTarget.dataset.date;
    if (!dateStr) return;
    
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    
    this.updateDateDisplay(selectedDate);
    this.loadRecordsForDate(selectedDate);
    this.hideCalendar();
  },

  // 生成日历
  generateCalendar() {
    const { calendarCurrentDate, selectedDateStr } = this.data;
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    const monthText = `${year}年${month + 1}月`;
    this.setData({ currentMonthText: monthText });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const calendarDays = [];

    // 上个月的日期
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const dateStr = this.formatDateString(date);
      calendarDays.push({
        day: day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        isSelected: dateStr === selectedDateStr
      });
    }

    // 当前月的日期
    const today = new Date();
    const todayStr = this.formatDateString(today);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDateString(date);
      calendarDays.push({
        day: day,
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr
      });
    }

    // 下个月的日期（填满42个格子）
    const remainingCells = 42 - calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = this.formatDateString(date);
      calendarDays.push({
        day: day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        isSelected: dateStr === selectedDateStr
      });
    }

    this.setData({ calendarDays });
  },

  // 日历月份切换
  prevMonth() {
    const { calendarCurrentDate } = this.data;
    const newDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() - 1, 1);
    this.setData({ calendarCurrentDate: newDate });
    this.generateCalendar();
  },

  nextMonth() {
    const { calendarCurrentDate } = this.data;
    const newDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, 1);
    this.setData({ calendarCurrentDate: newDate });
    this.generateCalendar();
  },

  goToHome() {
    ty.navigateBack({
      delta: 1
    });
  },

  goToHistory() {
    // Already here
  },

  goToSettings() {
    ty.navigateTo({
      url: '/pages/congrats/congrats'
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const record = this.data.records.find(item => item.id === id);
    
    if (record && record.fullRecord) {
      const fullRecord = record.fullRecord;
      const params = new URLSearchParams({
        id: id.toString(),
        duration: fullRecord.duration ? fullRecord.duration.toString() : '0',
        date: fullRecord.dateFormatted || fullRecord.date || '',
        speed: fullRecord.speedKmh ? fullRecord.speedKmh.toString() : (fullRecord.speed ? fullRecord.speed.toString() : '0'),
        calories: fullRecord.calories ? fullRecord.calories.toString() : '0',
        distance: fullRecord.distance ? fullRecord.distance.toString() : '0',
        rpm: fullRecord.rpm ? fullRecord.rpm.toString() : '0',
        watt: fullRecord.watt ? fullRecord.watt.toString() : '0',
        maxResistance: fullRecord.maxResistance ? fullRecord.maxResistance.toString() : '0',
        minResistance: fullRecord.minResistance ? fullRecord.minResistance.toString() : '0',
        heartRate: fullRecord.heartRate ? fullRecord.heartRate.toString() : '0'
      });
      
      ty.navigateTo({
        url: `/pages/history-detail/history-detail?${params.toString()}`
      });
    }
  },

  goBack() {
    try {
      ty.navigateBack({
        delta: 1,
        success: () => {
          console.log('返回成功');
        },
        fail: (err) => {
          console.error('返回失败:', err);
          // 如果返回失败，尝试跳转到首页
          ty.navigateTo({
            url: '/pages/index/index'
          });
        }
      });
    } catch (error) {
      console.error('返回异常:', error);
      // 如果出现异常，尝试跳转到首页
      ty.navigateTo({
        url: '/pages/index/index'
      });
    }
  },

  // 阻止事件冒泡（用于日历弹窗内容区域）
  stopPropagation() {
    // 空函数，仅用于阻止事件冒泡
  }
});
