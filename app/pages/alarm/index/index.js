Page({
  data: {
    // 标签页
    activeTab: 'tips', // 'tips' 或 'schedule'
    
    // Tips 标签页数据
    tipTitle: '',
    selectedDate: null, // Date 对象
    selectedTime: { hour: 15, minute: 0 },
    showDatePicker: false,
    showTimePicker: false,
    editingTipId: null, // 编辑模式下的 ID
    
    // 日期显示文本
    dateDisplayText: '今天',
    timeDisplayText: '15:00',
    
    // 日历相关
    calendarCurrentDate: new Date(),
    calendarDays: [],
    weekdays: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    currentMonthText: '',
    
    // 时间选择器数据
    timePickerHours: [],
    timePickerMinutes: [],
    timePickerIndex: [15, 0], // [hourIndex, minuteIndex]
    
    // 日程列表
    tips: [] // 存储所有提醒事项
  },

  onLoad() {
    ty.hideMenuButton({ 
      success: () => {
        console.log('hideMenuButton success');
      }, 
      fail: (error) => {
        console.log('hideMenuButton fail', error);
      } 
    });
    
    // 初始化时间选择器数据
    this.initTimePicker();
    
    // 初始化当前日期和时间
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    this.setData({
      selectedDate: now,
      selectedTime: {
        hour: hour,
        minute: minute
      },
      timePickerIndex: [hour, minute],
      dateDisplayText: this.getDateDisplayText(now),
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
    
    // 加载已保存的提醒
    this.loadTips();
    
    // 生成日历
    this.generateCalendar();
  },

  onShow() {
    // 每次显示页面时重新加载提醒
    this.loadTips();
  },

  // 初始化时间选择器数据
  initTimePicker() {
    const hours = [];
    const minutes = [];
    
    for (let i = 0; i < 24; i++) {
      hours.push(String(i).padStart(2, '0'));
    }
    
    for (let i = 0; i < 60; i++) {
      minutes.push(String(i).padStart(2, '0'));
    }
    
    this.setData({
      timePickerHours: hours,
      timePickerMinutes: minutes
    });
  },

  // 加载提醒列表
  loadTips() {
    const tips = ty.getStorageSync('tips') || [];
    // 按日期和时间排序（最新的在前）
    tips.sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return dateB - dateA;
    });
    this.setData({ tips });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ 
      activeTab: tab,
      showDatePicker: false,
      showTimePicker: false
    });
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      tipTitle: e.detail.value
    });
  },

  // 显示日期选择器
  showDatePicker() {
    // 如果已选择日期，设置日历显示为该日期所在月份
    if (this.data.selectedDate) {
      const date = new Date(this.data.selectedDate);
      this.setData({
        calendarCurrentDate: new Date(date.getFullYear(), date.getMonth(), 1),
        showDatePicker: true,
        showTimePicker: false // 关闭时间选择器
      });
    } else {
      this.setData({
        showDatePicker: true,
        showTimePicker: false // 关闭时间选择器
      });
    }
    this.generateCalendar();
  },

  // 隐藏日期选择器
  hideDatePicker() {
    this.setData({
      showDatePicker: false
    });
  },

  // 显示时间选择器
  showTimePicker() {
    this.setData({
      showTimePicker: true,
      showDatePicker: false // 关闭日期选择器
    });
  },

  // 隐藏时间选择器
  hideTimePicker() {
    this.setData({
      showTimePicker: false
    });
  },

  // 生成日历
  generateCalendar() {
    const { calendarCurrentDate, selectedDate } = this.data;
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    // 格式化月份文本：October 2022
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthText = `${monthNames[month]} ${year}`;
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
      calendarDays.push({
        day: day,
        date: date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: this.isSameDate(date, selectedDate)
      });
    }

    // 当前月的日期
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarDays.push({
        day: day,
        date: date,
        isCurrentMonth: true,
        isToday: this.isSameDate(date, today),
        isSelected: this.isSameDate(date, selectedDate)
      });
    }

    // 下个月的日期（填满42个格子）
    const remainingCells = 42 - calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      calendarDays.push({
        day: day,
        date: date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: this.isSameDate(date, selectedDate)
      });
    }

    this.setData({ calendarDays });
  },

  // 判断两个日期是否是同一天
  isSameDate(date1, date2) {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
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

  // 从日历选择日期
  selectDateFromCalendar(e) {
    const dateStr = e.currentTarget.dataset.date;
    if (!dateStr) return;
    
    const selectedDate = new Date(dateStr);
    this.setData({
      selectedDate: selectedDate,
      showDatePicker: false,
      dateDisplayText: this.getDateDisplayText(selectedDate)
    });
    this.generateCalendar();
  },

  // 时间选择器滚动事件
  onTimePickerChange(e) {
    const values = e.detail.value;
    const hour = parseInt(values[0]);
    const minute = parseInt(values[1]);
    
    this.setData({
      'selectedTime.hour': hour,
      'selectedTime.minute': minute,
      timePickerIndex: [hour, minute],
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
  },

  // 格式化日期显示
  getDateDisplayText(date) {
    if (!date) return '今天';
    
    const dateObj = new Date(date);
    const today = new Date();
    
    // 判断是否是今天
    if (this.isSameDate(dateObj, today)) {
      return '今天';
    }
    
    // 格式化日期：2025.12.19.星期五
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[dateObj.getDay()];
    
    return `${year}.${month}.${day}.${weekday}`;
  },

  // 保存提醒
  saveTip() {
    const { tipTitle, selectedDate, selectedTime, editingTipId } = this.data;
    
    // 验证标题
    if (!tipTitle || tipTitle.trim() === '') {
      ty.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return;
    }
    
    // 验证日期
    if (!selectedDate) {
      ty.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return;
    }
    
    // 创建日期时间对象
    const dateTime = new Date(selectedDate);
    dateTime.setHours(selectedTime.hour);
    dateTime.setMinutes(selectedTime.minute);
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
    
    const tips = this.data.tips || [];
    
    if (editingTipId) {
      // 编辑模式：更新现有提醒
      const index = tips.findIndex(t => t.id === editingTipId);
      if (index > -1) {
        tips[index] = {
          ...tips[index],
          title: tipTitle.trim(),
          date: selectedDate,
          time: { ...selectedTime },
          dateTime: dateTime
        };
      }
    } else {
      // 新建模式：创建新提醒
      const newTip = {
        id: Date.now().toString(),
        title: tipTitle.trim(),
        date: selectedDate,
        time: { ...selectedTime },
        dateTime: dateTime
      };
      tips.push(newTip);
    }
    
    // 保存到本地存储
    ty.setStorageSync('tips', tips);
    
    // 更新数据
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    this.setData({
      tips: tips,
      tipTitle: '',
      editingTipId: null,
      selectedDate: now,
      selectedTime: {
        hour: hour,
        minute: minute
      },
      timePickerIndex: [hour, minute],
      dateDisplayText: this.getDateDisplayText(now),
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
    
    // 切换到日程列表
    this.setData({ activeTab: 'schedule' });
    
    ty.showToast({
      title: editingTipId ? '更新成功' : '保存成功',
      icon: 'success'
    });
  },

  // 编辑提醒
  editTip(e) {
    const id = e.currentTarget.dataset.id;
    const tip = this.data.tips.find(t => t.id === id);
    
    if (!tip) return;
    
    const date = new Date(tip.date);
    const { hour, minute } = tip.time;
    
    this.setData({
      activeTab: 'tips',
      tipTitle: tip.title,
      selectedDate: date,
      selectedTime: { ...tip.time },
      editingTipId: id,
      timePickerIndex: [hour, minute],
      dateDisplayText: this.getDateDisplayText(date),
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
    
    // 更新日历显示
    this.setData({
      calendarCurrentDate: new Date(date.getFullYear(), date.getMonth(), 1)
    });
    this.generateCalendar();
  },

  // 删除提醒
  deleteTip() {
    const { editingTipId } = this.data;
    
    if (!editingTipId) return;
    
    ty.showModal({
      title: '确认删除',
      content: '确定要删除这个提醒吗？',
      success: (res) => {
        if (res.confirm) {
          const tips = this.data.tips.filter(t => t.id !== editingTipId);
          ty.setStorageSync('tips', tips);
          
          const now = new Date();
          const hour = now.getHours();
          const minute = now.getMinutes();
          this.setData({
            tips: tips,
            tipTitle: '',
            editingTipId: null,
            selectedDate: now,
            selectedTime: {
              hour: hour,
              minute: minute
            },
            timePickerIndex: [hour, minute],
            dateDisplayText: this.getDateDisplayText(now),
            timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
          });
          
          ty.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 格式化日程列表中的日期时间
  formatScheduleDateTime(tip) {
    const date = new Date(tip.dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day}.${weekday} ${hours}:${minutes}`;
  },

  // 返回
  onBack() {
    ty.navigateBack();
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，仅用于阻止事件冒泡
  }
});
