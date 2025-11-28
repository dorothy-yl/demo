Page({
  data: {
    record: null
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
      record = {
        id: parseInt(id) || 1,
        duration: options.duration || '17',
        date: options.date || '12月11日 12:01:03',
        speed: options.speed || '107.29',
        calories: options.calories || '52',
        distance: distance.toFixed(1),
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
    }
    
    this.setData({
      record: record
    });
  },
  
  goBack() {
    ty.navigateBack({
      delta: 1
    });
  }
});

