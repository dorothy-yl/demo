Page({
  data: {
    showPicker: false,
    hours: [],
    minutes: [],
    seconds: [],
    timeValue: [1, 31, 5], // Default matches screenshot 01:31:05
    hoursStr: '01',
    minutesStr: '31',
    secondsStr: '05',
    statusBarHeight: 20 // Default fallback
  },

  onLoad() {
    // Get system info for status bar height
    try {
      const sysInfo = ty.getSystemInfoSync();
      if (sysInfo.statusBarHeight) {
        this.setData({ statusBarHeight: sysInfo.statusBarHeight });
      }
    } catch (e) {
      console.error('Failed to get system info', e);
    }

    const hours = [];
    const minutes = [];
    const seconds = [];

    for (let i = 0; i < 24; i++) {
      hours.push(i < 10 ? '0' + i : '' + i);
    }
    for (let i = 0; i < 60; i++) {
      minutes.push(i < 10 ? '0' + i : '' + i);
      seconds.push(i < 10 ? '0' + i : '' + i);
    }

    this.setData({
      hours,
      minutes,
      seconds
    });
  },

  goBack() {
    if (this.data.showPicker) {
      this.setData({ showPicker: false });
    } else {
      ty.navigateBack();
    }
  },

  showTimePicker() {
    this.setData({ showPicker: true });
  },

  showCaloriesPicker() {
     // To be implemented
     ty.showToast({ title: 'Calories settings coming soon', icon: 'none' });
  },

  showDistancePicker() {
     // To be implemented
     ty.showToast({ title: 'Distance settings coming soon', icon: 'none' });
  },

  onTimeChange(e) {
    const val = e.detail.value;
    this.setData({
      timeValue: val,
      hoursStr: this.data.hours[val[0]],
      minutesStr: this.data.minutes[val[1]],
      secondsStr: this.data.seconds[val[2]]
    });
  },

  confirmTime() {
    const { hoursStr, minutesStr, secondsStr } = this.data;
    // Save logic here
    console.log(`Set time to ${hoursStr}:${minutesStr}:${secondsStr}`);
    
    ty.showToast({
      title: 'Goal Set!',
      icon: 'success'
    });
    
    setTimeout(() => {
      // Go back to selection or home? 
      // Usually confirms selection and closes picker
      this.setData({ showPicker: false });
    }, 1500);
  }
});
