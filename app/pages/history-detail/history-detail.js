Page({
  data: {
    record: null,
    formattedTime: '00:00'
  },
  
  onLoad(options) {
    const id = options.id;
    const date = options.date;
    
    // 从本地存储或历史记录中获取详情
    const history = ty.getStorageSync('exerciseHistory') || [];
    let record = null;
    
    if (id) {
      record = history.find(item => item.id === parseInt(id));
    } else if (date) {
      record = history.find(item => {
        const recordDate = new Date(item.date).toISOString().split('T')[0];
        return recordDate === date;
      });
    }
    
    if (record) {
      this.setData({
        record: record,
        formattedTime: this.formatTime(record.duration || 0)
      });
    } else {
      // 如果没有找到，使用传入的参数构建记录
      const duration = parseInt(options.duration) || 0;
      const distance = parseFloat(options.distance) || 0;
      const calories = parseInt(options.calories) || 0;
      const heartRate = parseInt(options.heartRate) || 120;
      const avgSpeed = parseFloat(options.avgSpeed) || 18.5;
      const resistance = parseInt(options.resistance) || 5;
      
      this.setData({
        record: {
          date: date || new Date().toISOString().split('T')[0],
          duration,
          distance,
          calories,
          heartRate,
          avgSpeed,
          resistance,
          maxSpeed: avgSpeed
        },
        formattedTime: this.formatTime(duration)
      });
    }
  },
  
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
});

