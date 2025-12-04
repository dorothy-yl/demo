Page({
  data: {
    selectedDate: null,
    selectedDateText: '',
    
    // Day settings pickers
    resistanceLevels: [],
    resistanceValue: [0], // Default to level 1
    exerciseHours: [],
    exerciseMinutes: [],
    exerciseSeconds: [],
    exerciseTimeValue: [0, 0, 0], // Default to 00:00:00
    distanceOptions: [],
    distanceValue: [0], // Default to 0.5 km
  },

  onLoad(options) {
    this.initializePickers();
    this.loadSelectedDate();
  },

  onShow() {
    // Reload date in case it changed
    this.loadSelectedDate();
  },

  initializePickers() {
    // Initialize resistance levels (1-32)
    const resistanceLevels = [];
    for (let i = 1; i <= 32; i++) {
      resistanceLevels.push(String(i));
    }

    // Initialize exercise time pickers (hour:minute:second)
    const exerciseHours = [];
    const exerciseMinutes = [];
    const exerciseSeconds = [];
    for (let i = 0; i < 24; i++) {
      exerciseHours.push(i < 10 ? '0' + i : '' + i);
    }
    for (let i = 0; i < 60; i++) {
      exerciseMinutes.push(i < 10 ? '0' + i : '' + i);
      exerciseSeconds.push(i < 10 ? '0' + i : '' + i);
    }

    // Initialize distance options (0.5 to 50 km, step 0.5)
    const distanceOptions = [];
    for (let i = 0.5; i <= 50; i += 0.5) {
      distanceOptions.push(i.toFixed(1));
    }

    this.setData({
      resistanceLevels,
      exerciseHours,
      exerciseMinutes,
      exerciseSeconds,
      distanceOptions
    });
  },

  loadSelectedDate() {
    // Get selected date from storage
    const selectedDate = ty.getStorageSync('selected_date');
    if (selectedDate) {
      this.setData({ 
        selectedDate: selectedDate,
        selectedDateText: this.formatDateText(selectedDate)
      });
      
      // Load existing settings for this date
      this.loadDaySettings(selectedDate);
    }
  },

  formatDateText(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  loadDaySettings(dateStr) {
    const allSettings = ty.getStorageSync('day_settings') || {};
    const daySettings = allSettings[dateStr];
    
    if (daySettings) {
      // Set resistance value
      const resistanceIndex = daySettings.resistance ? daySettings.resistance - 1 : 0;
      
      // Set exercise time value
      const hourIndex = daySettings.time?.hour || 0;
      const minuteIndex = daySettings.time?.minute || 0;
      const secondIndex = daySettings.time?.second || 0;
      
      // Set distance value
      let distanceIndex = daySettings.distance 
        ? this.data.distanceOptions.findIndex(d => parseFloat(d) === daySettings.distance)
        : 0;
      if (distanceIndex === -1) {
        distanceIndex = 0;
      }
      
      this.setData({
        resistanceValue: [resistanceIndex],
        exerciseTimeValue: [hourIndex, minuteIndex, secondIndex],
        distanceValue: [distanceIndex]
      });
    }
  },

  onResistanceChange(e) {
    const val = e.detail.value;
    this.setData({
      resistanceValue: val
    });
    this.saveDaySettings();
  },

  onExerciseTimeChange(e) {
    const val = e.detail.value;
    this.setData({
      exerciseTimeValue: val
    });
    this.saveDaySettings();
  },

  onDistanceChange(e) {
    const val = e.detail.value;
    this.setData({
      distanceValue: val
    });
    this.saveDaySettings();
  },

  saveDaySettings() {
    if (!this.data.selectedDate) return;
    
    const allSettings = ty.getStorageSync('day_settings') || {};
    const resistance = parseInt(this.data.resistanceLevels[this.data.resistanceValue[0]]);
    const hour = parseInt(this.data.exerciseHours[this.data.exerciseTimeValue[0]]);
    const minute = parseInt(this.data.exerciseMinutes[this.data.exerciseTimeValue[1]]);
    const second = parseInt(this.data.exerciseSeconds[this.data.exerciseTimeValue[2]]);
    const distance = parseFloat(this.data.distanceOptions[this.data.distanceValue[0]]);
    
    allSettings[this.data.selectedDate] = {
      resistance: resistance,
      time: {
        hour: hour,
        minute: minute,
        second: second
      },
      distance: distance
    };
    
    ty.setStorageSync('day_settings', allSettings);
  },

  onBack() {
    ty.navigateBack();
  }
});

