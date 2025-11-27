Page({
  data: {
    hours: [],
    minutes: [],
    value: [0, 0], // index of selected hour/minute
    selectedTime: '00:00',
    repeatDays: [], // [0,1,2,3,4,5,6] = Sun-Sat
    repeatText: '永不'
  },

  onLoad(options) {
    // Initialize picker data
    const hours = [];
    const minutes = [];
    for (let i = 0; i < 24; i++) hours.push(String(i).padStart(2, '0'));
    for (let i = 0; i < 60; i++) minutes.push(String(i).padStart(2, '0'));

    // Set current time as default
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    this.setData({
      hours,
      minutes,
      value: [currentHour, currentMinute],
      selectedTime: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    });
    
    // Check for return data from repeat page
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel) {
       // This part depends on how Tuya/MiniApp handles back navigation data. 
       // Usually we use global data or local storage for simple passing, or onShow check.
    }
  },

  onShow() {
    // Check if repeat settings were updated
    const tempRepeat = ty.getStorageSync('temp_repeat_days');
    if (tempRepeat !== undefined && tempRepeat !== null) {
      this.setData({ 
        repeatDays: tempRepeat,
        repeatText: this.formatRepeat(tempRepeat)
      });
      ty.removeStorageSync('temp_repeat_days');
    }
  },

  bindChange(e) {
    const val = e.detail.value;
    const hour = this.data.hours[val[0]];
    const minute = this.data.minutes[val[1]];
    this.setData({
      value: val,
      selectedTime: `${hour}:${minute}`
    });
  },

  goToRepeat() {
    // Save current selection to temp storage or pass via url
    ty.setStorageSync('current_repeat_days', this.data.repeatDays);
    ty.navigateTo({
      url: '/pages/alarm/repeat/repeat'
    });
  },

  onCancel() {
    ty.navigateBack();
  },

  onSave() {
    const alarms = ty.getStorageSync('alarms') || [];
    const newAlarm = {
      id: Date.now().toString(),
      timeStr: this.data.selectedTime,
      repeat: this.data.repeatDays,
      repeatStr: this.data.repeatText,
      enabled: true,
      tag: '闹钟'
    };
    
    alarms.push(newAlarm);
    ty.setStorageSync('alarms', alarms);
    
    ty.navigateBack();
  },

  formatRepeat(days) {
    if (!days || days.length === 0) return '永不';
    if (days.length === 7) return '每天';
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    // Sort days to ensure order
    days.sort((a,b) => a - b);
    return days.map(d => dayNames[d]).join(' ');
  }
});

