Page({
  data: {
    record: null
  },

  // 格式化时长为 "HH:MM:SS" 格式
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = secs.toString().padStart(2, '0');
    
    return `${h}:${m}:${s}`;
  },
  
  onLoad(options) {
    const id = options.id;
    
    // 从本地存储或历史记录中获取详情
    const history = ty.getStorageSync('exerciseHistory') || [];
    let record = null;
    
    if (id) {
      record = history.find(item => item.id === parseInt(id));
    }
    
    // 如果没有找到，使用默认数据（从历史列表页传递的数据）
    if (!record) {
      // 从历史列表页的数据结构构建记录
      const distance = parseFloat(options.distance) || 0.7;
      const durationSeconds = parseInt(options.duration) || 0;
      record = {
        id: parseInt(id) || 1,
        duration: this.formatTime(durationSeconds),
        date: options.date || '12月11日 12:01:03',
        Load: options.Load || '18',
        calories: options.calories || '52',
        distance: distance.toFixed(2),
        rpm: options.rpm || '52',
        watt: options.watt || '50.1',
        maxResistance: options.maxResistance || '19',
        minResistance: options.minResistance || '1.3',
        heartRate: options.heartRate || '60'
      };
    } else {
      // 确保距离格式正确
      if (record.distance && typeof record.distance === 'number') {
        record.distance = record.distance.toFixed(1);
      }
      // 格式化时长（duration 是秒数）
      if (record.duration !== undefined) {
        const durationSeconds = typeof record.duration === 'number' ? record.duration : parseInt(record.duration) || 0;
        record.duration = this.formatTime(durationSeconds);
      }
      // 设置 Load 字段（从 load 或 avgResistance 获取）
      if (!record.Load) {
        record.Load = record.load ? record.load.toString() : (record.avgResistance ? Math.round(record.avgResistance).toString() : '0');
      }
    }
    
    this.setData({
      record: record
    });
  },
  
  goBack() {
    try {
      ty.navigateBack({
        delta: 1,
        success: () => {
          console.log('返回成功');
        },
        fail: (err) => {
          console.error('返回失败:', err);
          // 如果返回失败，尝试跳转到历史记录页
          ty.navigateTo({
            url: '/pages/history/history'
          });
        }
      });
    } catch (error) {
      console.error('返回异常:', error);
      // 如果出现异常，尝试跳转到历史记录页
      ty.navigateTo({
        url: '/pages/history/history'
      });
    }
  }
});

