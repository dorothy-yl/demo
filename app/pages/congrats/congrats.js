Page({
  data: {
    userName: 'Dkkd',
    date: '2025/09/12',
    caloriesBurned: 128,
    duration: '00:01:36',
    rpm: '11.23',
    avgSpeed: '1.3',
    secondaryCalories: 15,
    distance: '0.7'
  },
  onLoad(options) {
    let exerciseData = null;
    
    // 优先从URL参数获取数据
    if (options.id) {
      exerciseData = {
        id: options.id,
        duration: parseInt(options.duration) || 0,
        speedKmh: parseFloat(options.speedKmh) || 0,
        calories: parseFloat(options.calories) || 0,
        distance: parseFloat(options.distance) || 0,
        rpm: parseFloat(options.rpm) || 0,
        dateCongrats: options.dateCongrats || ''
      };
    } else {
      // 如果没有URL参数，从storage获取最新记录
      const history = ty.getStorageSync('exerciseHistory') || [];
      if (history.length > 0) {
        exerciseData = history[0]; // 最新的记录
      }
    }
    
    if (exerciseData) {
      // 格式化时间：从秒转换为 "HH:MM:SS"
      const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        const s = secs.toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
      };
      
      // 获取用户名（可以从storage获取或使用默认值）
      const userName = ty.getStorageSync('userName') || 'Dkkd';
      
      // 格式化数据
      const durationFormatted = exerciseData.durationFormatted || formatTime(exerciseData.duration);
      const caloriesBurned = Math.round(exerciseData.calories);
      const rpm = exerciseData.rpm ? exerciseData.rpm.toFixed(2) : '0.00';
      const avgSpeed = exerciseData.speedKmh ? exerciseData.speedKmh.toFixed(1) : '0.0';
      const secondaryCalories = Math.round(exerciseData.calories * 0.1); // 可以调整这个计算
      const distance = exerciseData.distance ? exerciseData.distance.toFixed(1) : '0.0';
      const date = exerciseData.dateCongrats || exerciseData.dateFormatted || '2025/09/12';
      
      this.setData({
        userName: userName,
        date: date,
        caloriesBurned: caloriesBurned,
        duration: durationFormatted,
        rpm: rpm,
        avgSpeed: avgSpeed,
        secondaryCalories: secondaryCalories,
        distance: distance
      });
    }
  },
  goBack() {
    ty.navigateBack();
  }
});
