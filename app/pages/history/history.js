Page({
  data: {
    currentDate: '12月24日',
    currentDateObj: new Date(new Date().getFullYear(), 11, 24).getTime(), // Dec 24
    records: [
      {
        id: 1,
        duration: '17',
        date: '12月11日 12:01:03',
        speed: '107.29',
        calories: '52',
        distance: '50.1'
      },
      {
        id: 2,
        duration: '17',
        date: '12月11日 12:01:03',
        speed: '107.29',
        calories: '52',
        distance: '50.1'
      }
    ]
  },

  onLoad() {
    console.log('History Page Load');
  },

  prevDate() {
    const newTime = this.data.currentDateObj - 24 * 60 * 60 * 1000;
    this.updateDate(newTime);
  },

  nextDate() {
    const newTime = this.data.currentDateObj + 24 * 60 * 60 * 1000;
    this.updateDate(newTime);
  },

  updateDate(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    this.setData({
      currentDateObj: timestamp,
      currentDate: `${month}月${day}日`
    });
    // Here you would typically fetch data for the new date
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
  }
});
