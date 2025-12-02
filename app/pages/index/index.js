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

    const _onDpDataChange = (event) => {
      console.log('dp点数组:' + JSON.stringify(formatDpState(event.dps)));
      const dpID = formatDpState(event.dps); //dpID 数组
      dpID.forEach(element => {
        // 时间
        if (element.code == 104) {
          this.setData({
            exerciseTime: this.formatTime(element.value)
          });
        }
        if (element.code == 103) {
          this.setData({
            distance: (element.value/1000).toFixed(2)
          });
        }
        // 距离 (Assuming DP 105 might be speed, checking if there is a distance DP or if we need to calculate it. 
        // For now, let's see if we can find a distance DP or just leave it static/calculated elsewhere.
        // Based on exercise.js, there isn't a direct distance DP shown in the snippet (speed, heartRate, rpm, calories, watt, load).
        // If distance is not a direct DP, we might need to calculate it or it might be another DP not yet identified.
        // For now, I will only map what I am sure of or what was requested.
        // The user specifically asked to "connect page with dp points".
        
        // If there is a distance DP, it might be 106? No, 106 is controlCmd in exercise.js.
        // Let's just map time for now as per plan.)
      });
    }

    registerDeviceListListener({
      deviceIdList: [deviceId],
      success: () => {
        console.log('registerDeviceListListener success');
      },
      fail: (error) => {
        console.log('registerDeviceListListener fail', error);
      }
    });
    onDpDataChange(_onDpDataChange);
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
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = secs.toString().padStart(2, '0');
    
    // Matching the format '05:04' from the initial data
    return `${m}:${s}`;
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
