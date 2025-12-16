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
    currentMonthText: '',
    cloudRecords: [], // 存储从云端获取的所有记录
    isLoading: false // 加载状态
  },

  onLoad() {
    ty.hideMenuButton({ success: () => {
      console.log('hideMenuButton success');
    }, fail: (error) => {
      console.log('hideMenuButton fail', error);
    } });
    
    const { query: { deviceId } } = ty.getLaunchOptionsSync();
    this.deviceId = deviceId;
    
    console.log('History Page Load');
    // 初始化当前日期为今天
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.setData({
      currentDateObj: today.getTime(),
      selectedDateStr: this.formatDateString(today)
    });
    this.updateDateDisplay(today);
    this.generateCalendar();
    
    // 从云端加载数据
    this.loadRecordsFromCloud();
  },

  onShow() {
    // 每次显示页面时重新从云端加载数据
    if (this.deviceId) {
      this.loadRecordsFromCloud();
    } else {
      const selectedDate = new Date(this.data.currentDateObj);
      this.loadRecordsForDate(selectedDate);
    }
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

  // 从云端加载所有历史记录
  loadRecordsFromCloud() {
    if (!this.deviceId) {
      console.error('设备ID不存在');
      // 降级到本地存储
      const selectedDate = new Date(this.data.currentDateObj);
      this.loadRecordsForDateFromLocal(selectedDate);
      return;
    }

    this.setData({ isLoading: true });

    // 获取更多数据，可以根据需要调整 limit
    ty.getAnalyticsLogsPublishLog({
      devId: this.deviceId,
      dpIds: '112',
      offset: 0,
      limit: 10, // 可以根据需要调整，最大4000
    })
      .then((response) => {
        console.log('云端返回的原始数据:', response);
        
        // 解析云端数据
        const allRecords = this.parseCloudData(response);
        
        this.setData({
          cloudRecords: allRecords,
          isLoading: false
        });
        
        // 加载当前日期的记录
        const selectedDate = new Date(this.data.currentDateObj);
        this.loadRecordsForDate(selectedDate);
      })
      .catch((error) => {
        console.error('从云端获取数据失败:', error);
        this.setData({
          isLoading: false
        });
        // 如果云端获取失败，降级到本地存储
        const selectedDate = new Date(this.data.currentDateObj);
        this.loadRecordsForDateFromLocal(selectedDate);
      });
  },

  // 解析云端返回的数据
  parseCloudData(response) {
    const allRecords = [];
    
    try {
      // 根据截图，response 应该是一个包含日志记录的数组
      // 每个记录有：时间、设备事件、事件名称、事件详情、来源、来源详情等字段
      if (!response) {
        console.warn('云端返回数据为空');
        return [];
      }

      // 如果 response 是数组，直接遍历
      // 如果 response 有 data 或 list 字段，使用该字段
      let logItems = [];
      if (Array.isArray(response)) {
        logItems = response;
      } else if (response.data && Array.isArray(response.data)) {
        logItems = response.data;
      } else if (response.list && Array.isArray(response.list)) {
        logItems = response.list;
      } else if (response.dps && Array.isArray(response.dps)) {
        logItems = response.dps;
      } else {
        console.warn('云端返回数据格式不正确，无法找到数组字段');
        return [];
      }

      logItems.forEach((logItem, index) => {
        try {
          // 从"事件详情"字段中提取 JSON 数据
          // 根据截图，事件详情字段包含历史记录的 JSON 对象
          let eventDetail = null;
          
          // 尝试不同的字段名
          if (logItem.eventDetail) {
            eventDetail = typeof logItem.eventDetail === 'string' 
              ? JSON.parse(logItem.eventDetail) 
              : logItem.eventDetail;
          } else if (logItem['事件详情']) {
            eventDetail = typeof logItem['事件详情'] === 'string' 
              ? JSON.parse(logItem['事件详情']) 
              : logItem['事件详情'];
          } else if (logItem.detail) {
            eventDetail = typeof logItem.detail === 'string' 
              ? JSON.parse(logItem.detail) 
              : logItem.detail;
          } else if (logItem.value) {
            // 如果直接是 value 字段（字符串格式的 JSON）
            eventDetail = typeof logItem.value === 'string' 
              ? JSON.parse(logItem.value) 
              : logItem.value;
          } else if (logItem.dpValue) {
            eventDetail = typeof logItem.dpValue === 'string' 
              ? JSON.parse(logItem.dpValue) 
              : logItem.dpValue;
          }

          // 如果 eventDetail 是数组，展开为多条记录
          if (Array.isArray(eventDetail)) {
            eventDetail.forEach(record => {
              if (record && record.id) {
                // 使用云端时间或记录中的时间
                const cloudTime = logItem.time || logItem['时间(GMT+8)'] || logItem.timeStr || logItem.timestamp;
                allRecords.push({
                  ...record,
                  cloudTime: cloudTime
                });
              }
            });
          } else if (eventDetail && typeof eventDetail === 'object' && eventDetail.id) {
            // 单条记录
            const cloudTime = logItem.time || logItem['时间(GMT+8)'] || logItem.timeStr || logItem.timestamp;
            allRecords.push({
              ...eventDetail,
              cloudTime: cloudTime
            });
          }
        } catch (error) {
          console.warn(`解析第 ${index} 条云端记录失败:`, error, logItem);
        }
      });

      console.log(`成功解析 ${allRecords.length} 条云端历史记录`);
      return allRecords;
    } catch (error) {
      console.error('解析云端数据失败:', error);
      return [];
    }
  },

  // 根据日期加载记录（从云端数据中筛选）
  loadRecordsForDate(date) {
    try {
      const cloudRecords = this.data.cloudRecords || [];
      const targetDateStr = this.formatDateString(date);
      
      // 筛选出当天的记录
      const dayRecords = cloudRecords.filter(record => {
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
          calories: Math.round(record.calories || 0).toString(),
          distance: record.distance ? record.distance.toFixed(2) : '0.0',
          Load: record.load ? record.load.toString() : (record.avgResistance ? Math.round(record.avgResistance).toString() : '0'),
          resistance: record.avgResistance ? record.avgResistance.toFixed(1) : (record.maxResistance ? record.maxResistance.toFixed(1) : '0.0'),
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

  // 从本地存储加载记录（作为降级方案）
  loadRecordsForDateFromLocal(date) {
    try {
      const history = ty.getStorageSync('exerciseHistory') || [];
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
          distance: record.distance ? record.distance.toFixed(2) : '0.0',
          Load: record.load ? record.load.toString() : (record.avgResistance ? Math.round(record.avgResistance).toString() : '0'),
          resistance: record.avgResistance ? record.avgResistance.toFixed(1) : (record.maxResistance ? record.maxResistance.toFixed(1) : '0.0'),
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
      console.error('Error loading records from local:', error);
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
        distance: fullRecord.distance ? fullRecord.distance.toFixed(2) : '0.00',
        rpm: fullRecord.rpm ? fullRecord.rpm.toString() : '0',
        watt: fullRecord.watt ? fullRecord.watt.toString() : '0',
        Load: fullRecord.load ? fullRecord.load.toString() : (fullRecord.avgResistance ? Math.round(fullRecord.avgResistance).toString() : '0'),
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
