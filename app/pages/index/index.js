function formatDpState(dpState) {
  return Object.keys(dpState).map(dpCode => ({ code: dpCode, value: dpState[dpCode] }));
}

Page({
  data: {
    exerciseTime: '05:04',
    distance: '23',
    currentTime: '9:42'
  },
  onLoad() {
    console.log('Home Page Load');
    // this.loadTodayData();
    this.updateTime();

    const { onDpDataChange, registerDeviceListListener } = ty.device;
const { getLaunchOptionsSync } = ty;
// 启动参数中获取设备 id
const {
  query: { deviceId }
} = getLaunchOptionsSync();


  },
  onShow() {
    console.log('Home Page Show');
    // this.loadTodayData();
    this.updateTime();
  },
  updateTime() {
    // Display static time as per screenshot, or enable dynamic time
    // const now = new Date();
    // const hours = String(now.getHours()).padStart(2, '0');
    // const minutes = String(now.getMinutes()).padStart(2, '0');
    // this.setData({ currentTime: `${hours}:${minutes}` });
  },
  loadTodayData() {
    // Keep this function for future real data integration
    // For now we want to match the screenshot exactly
    /*
    const today = new Date().toISOString().split('T')[0];
    const history = ty.getStorageSync('exerciseHistory') || [];
    const todayRecords = history.filter(record => {
      const recordDate = record.date ? new Date(record.date).toISOString().split('T')[0] : '';
      return recordDate === today;
    });
    
    let totalDistance = 0;
    let totalDuration = 0; 
    
    todayRecords.forEach(record => {
      totalDistance += record.distance || 0;
      totalDuration += record.duration || 0; 
    });
    
    const minutes = Math.floor(totalDuration / 60);
    const seconds = totalDuration % 60;
    const exerciseTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    if (todayRecords.length > 0) {
      this.setData({
        exerciseTime: exerciseTime,
        distance: totalDistance.toFixed(0)
      });
    }
    */
  },
  goToHome() {
    // Already on home
  },
  goToExercise() {
    ty.navigateTo({
      url: '/pages/exercise/exercise'
    });
  },
  goToGoal() {
    ty.navigateTo({
      url: '/pages/goal/goal'
    });
  },
  goToHistory() {
    ty.navigateTo({
      url: '/pages/history/history'
    });
  },
  goToSettings() {
    ty.navigateTo({
      url: '/pages/congrats/congrats'
    });
  },
  goToFTMS() {
    ty.navigateTo({
      url: '/pages/ftms/ftms'
    });
  },
  goToTirp() {
    ty.navigateTo({
      url: '/pages/alarm/index/index'
    });
  }
});
