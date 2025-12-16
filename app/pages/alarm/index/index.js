Page({
  data: {
    alarms: [],
    hasAlarms: false,
    // Calendar data
    currentDate: new Date(),
    calendarDays: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    currentMonthText: '',
    daySettings: {},
    selectedDate: null
  },

  onLoad() {
    ty.hideMenuButton({ success: () => {
      console.log('hideMenuButton success');
    }, fail: (error) => {
      console.log('hideMenuButton fail', error);
    } });
    this.loadDaySettings();
    this.generateCalendar();
  },

  onShow() {
    this.loadAlarms();
    this.loadDaySettings();
    this.generateCalendar();
  },

  loadAlarms() {
    const alarms = ty.getStorageSync('alarms') || [];
    this.setData({
      alarms: alarms,
      hasAlarms: alarms.length > 0
    });
  },

  loadDaySettings() {
    const allSettings = ty.getStorageSync('day_settings') || {};
    this.setData({ daySettings: allSettings });
  },

  generateCalendar() {
    const { currentDate, daySettings, selectedDate } = this.data;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthText = `${year}年${month + 1}月`;
    this.setData({ currentMonthText: monthText });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const calendarDays = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const dateStr = this.formatDate(date);
      calendarDays.push({
        day: day,
        date: dateStr,
        isCurrentMonth: false,
        hasSettings: !!daySettings[dateStr],
        isToday: false,
        isSelected: dateStr === selectedDate
      });
    }

    const today = new Date();
    const todayStr = this.formatDate(today);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      calendarDays.push({
        day: day,
        date: dateStr,
        isCurrentMonth: true,
        hasSettings: !!daySettings[dateStr],
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate
      });
    }

    const remainingCells = 42 - calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = this.formatDate(date);
      calendarDays.push({
        day: day,
        date: dateStr,
        isCurrentMonth: false,
        hasSettings: !!daySettings[dateStr],
        isToday: false,
        isSelected: dateStr === selectedDate
      });
    }

    this.setData({ calendarDays });
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  prevMonth() {
    const { currentDate } = this.data;
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    this.setData({ currentDate: newDate });
    this.generateCalendar();
  },

  nextMonth() {
    const { currentDate } = this.data;
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    this.setData({ currentDate: newDate });
    this.generateCalendar();
  },

  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
    this.generateCalendar();
  },

  onBack() {
    ty.navigateBack();
  },

  // onAdd() {
  //   ty.navigateTo({
  //     url: '/pages/target/target'
  //   });
  // },

  onToggleAlarm(e) {
    const id = e.currentTarget.dataset.id;
    const alarms = this.data.alarms;
    const index = alarms.findIndex(a => a.id === id);
    if (index > -1) {
      alarms[index].enabled = !alarms[index].enabled;
      this.setData({ alarms });
      ty.setStorageSync('alarms', alarms);
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const alarms = this.data.alarms.filter(a => a.id !== id);
    this.setData({
      alarms: alarms,
      hasAlarms: alarms.length > 0
    });
    ty.setStorageSync('alarms', alarms);
  },
  
  // Helper to format repeat text
  getRepeatText(days) {
    if (!days || days.length === 0) return '永不';
    if (days.length === 7) return '每天';
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days.map(d => dayNames[d]).join(' ');
  }
});
