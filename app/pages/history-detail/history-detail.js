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

  // 解析单条记录数据并映射到record格式
  parseSingleRecord(logData) {
    // 映射数据字段 - 支持多种字段名格式
    // 时长：支持 duration, elapsedTime, ridetime_once (秒)
    const durationSeconds = parseInt(logData.duration) || 
                            parseInt(logData.elapsedTime) || 
                            parseInt(logData.ridetime_once) || 0;
    
    // 距离：支持 distance, mileage_once (可能是米，需要转换为公里)
    let distanceValue = 0;
    if (logData.distance !== undefined) {
      distanceValue = parseFloat(logData.distance);
    } else if (logData.mileage_once !== undefined) {
      // mileage_once可能是米，转换为公里
      distanceValue = parseFloat(logData.mileage_once) / 1000;
    }
    
    // 卡路里：支持 calories, cal
    const caloriesValue = parseInt(logData.calories) || parseInt(logData.cal) || 0;
    
    // 处理Load字段：优先使用Load，其次load，最后avgResistance
    let loadValue = '0';
    if (logData.Load !== undefined) {
      loadValue = logData.Load.toString();
    } else if (logData.load !== undefined) {
      loadValue = logData.load.toString();
    } else if (logData.avgResistance !== undefined) {
      loadValue = Math.round(logData.avgResistance).toString();
    }
    
    // 处理日期字段，格式化 ISO 格式的时间字符串
    const rawDate = logData.date || logData.dateCongrats || logData.cloudTimeStr || this.formatDate(new Date());
    const formattedDate = this.formatDateString(rawDate);
    
    return {
      id: parseInt(logData.id) || Date.now(),
      duration: this.formatTime(durationSeconds),
      date: formattedDate,
      Load: loadValue,
      calories: caloriesValue.toString(),
      distance: distanceValue.toFixed(2),
      rpm: logData.rpm ? logData.rpm.toString() : '0',
      watt: logData.watt ? logData.watt.toString() : '0.0',
      maxResistance: logData.maxResistance ? logData.maxResistance.toString() : '0',
      minResistance: logData.minResistance ? logData.minResistance.toString() : '0',
      heartRate: logData.heartRate ? logData.heartRate.toString() : '0'
    };
  },

  // 格式化日期为 "MM月DD日 HH:mm:ss" 格式
  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}:${seconds}`;
  },

  // 将 ISO 格式字符串转换为友好的显示格式
  formatDateString(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return dateString;
    }
    
    // 检测是否为 ISO 格式（包含 'T' 和 'Z' 或时区信息）
    const isISOFormat = dateString.includes('T') && (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/));
    
    if (isISOFormat) {
      try {
        // 解析 ISO 格式字符串并转换为本地时间
        const date = new Date(dateString);
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return dateString; // 如果解析失败，返回原字符串
        }
        return this.formatDate(date);
      } catch (error) {
        console.warn('formatDateString: 解析日期失败', error, dateString);
        return dateString; // 如果解析失败，返回原字符串
      }
    }
    
    // 如果不是 ISO 格式，直接返回原字符串
    return dateString;
  },

  // 从本地存储或URL参数获取数据
  loadRecordFromFallback(options) {
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
      const rawDate = options.date || '12月11日 12:01:03';
      const formattedDate = this.formatDateString(rawDate);
      
      record = {
        id: parseInt(id) || 1,
        duration: this.formatTime(durationSeconds),
        date: formattedDate,
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
      // 格式化日期字段（处理 ISO 格式）
      if (record.date) {
        record.date = this.formatDateString(record.date);
      }
      // 设置 Load 字段（从 load 或 avgResistance 获取）
      if (!record.Load) {
        record.Load = record.load ? record.load.toString() : (record.avgResistance ? Math.round(record.avgResistance).toString() : '0');
      }
    }
    
    return record;
  },
  
  onLoad(options) {
    ty.hideMenuButton({ success: () => {
      console.log('hideMenuButton success');
    }, fail: (error) => {
      console.log('hideMenuButton fail', error);
    } });
    
    // 从本地存储加载数据
    const record = this.loadRecordFromFallback(options);
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

