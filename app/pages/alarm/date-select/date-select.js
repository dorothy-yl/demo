Page({
  data: {
    currentDate: new Date(),
    calendarDays: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    currentMonthText: '',
    daySettings: {}, // Store settings for each day
    selectedDate: null // Track currently selected date
  },

  onLoad() {
    this.loadDaySettings();
    this.generateCalendar();
  },

  onShow() {
    // Reload settings when returning from day-settings page
    this.loadDaySettings();
    this.generateCalendar();
    // Clear selected date when returning
    this.setData({ selectedDate: null });
  },

  loadDaySettings() {
    // Load all day settings from storage
    const allSettings = ty.getStorageSync('day_settings') || {};
    this.setData({ daySettings: allSettings });
  },

  generateCalendar() {
    const { currentDate, daySettings, selectedDate } = this.data;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Set month text
    const monthText = `${year}年${month + 1}月`;
    this.setData({ currentMonthText: monthText });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay(); // 0 = Sunday

    // Get previous month's last days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const calendarDays = [];

    // Add previous month's trailing days
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

    // Add current month's days
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

    // Add next month's leading days to fill the grid (42 cells = 6 weeks)
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
    // Set selected date and update calendar to show green border
    this.setData({ selectedDate: date });
    this.generateCalendar();
    
    // Navigate to day-settings page
    ty.setStorageSync('selected_date', date);
    ty.navigateTo({
      url: '/pages/alarm/day-settings/day-settings'
    });
  },

  onBack() {
    ty.navigateBack();
  }
});

