Page({
  data: {
    alarms: [],
    hasAlarms: false
  },

  onShow() {
    this.loadAlarms();
  },

  loadAlarms() {
    const alarms = ty.getStorageSync('alarms') || [];
    this.setData({
      alarms: alarms,
      hasAlarms: alarms.length > 0
    });
  },

  onBack() {
    ty.navigateBack();
  },

  onAdd() {
    ty.navigateTo({
      url: '/pages/alarm/add/add'
    });
  },

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
