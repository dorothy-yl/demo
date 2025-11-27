Page({
  data: {
    // 运动提醒
    reminderEnabled: true,
    reminderTime: '08:00',
    
    // 闹钟设置
    alarms: [
      {
        id: 1,
        enabled: true,
        time: '07:00',
        repeat: [1, 2, 3, 4, 5], // 周一到周五
        label: '工作日闹钟'
      },
      {
        id: 2,
        enabled: false,
        time: '09:00',
        repeat: [6, 0], // 周六周日
        label: '周末闹钟'
      }
    ],
    
    // FTMS蓝牙连接
    ftmsEnabled: false,
    ftmsDeviceName: '',
    ftmsConnected: false
  },
  
  onLoad() {
    // 从本地存储加载设置
    this.loadSettings();
  },
  
  loadSettings() {
    const reminderTime = ty.getStorageSync('reminderTime') || '08:00';
    const reminderEnabled = ty.getStorageSync('reminderEnabled') !== false;
    const alarms = ty.getStorageSync('alarms') || this.data.alarms;
    const ftmsEnabled = ty.getStorageSync('ftmsEnabled') || false;
    
    this.setData({
      reminderTime,
      reminderEnabled,
      alarms,
      ftmsEnabled
    });
  },
  
  // 运动提醒开关
  toggleReminder(e) {
    const enabled = e.detail.value;
    this.setData({
      reminderEnabled: enabled
    });
    ty.setStorageSync('reminderEnabled', enabled);
    
    if (enabled) {
      this.setReminder();
    } else {
      this.cancelReminder();
    }
  },
  
  // 设置提醒时间
  onReminderTimeChange(e) {
    const time = e.detail.value;
    this.setData({
      reminderTime: time
    });
    ty.setStorageSync('reminderTime', time);
    
    if (this.data.reminderEnabled) {
      this.setReminder();
    }
  },
  
  setReminder() {
    // 这里应该使用小程序的定时提醒API
    ty.showToast({
      title: '提醒已设置',
      icon: 'success'
    });
  },
  
  cancelReminder() {
    ty.showToast({
      title: '提醒已取消',
      icon: 'none'
    });
  },
  
  // 闹钟开关
  toggleAlarm(e) {
    const id = e.currentTarget.dataset.id;
    const alarms = this.data.alarms.map(alarm => {
      if (alarm.id === id) {
        return { ...alarm, enabled: !alarm.enabled };
      }
      return alarm;
    });
    
    this.setData({ alarms });
    ty.setStorageSync('alarms', alarms);
  },
  
  // 编辑闹钟
  editAlarm(e) {
    const id = e.currentTarget.dataset.id;
    ty.navigateTo({
      url: `/pages/alarm-edit/alarm-edit?id=${id}`
    });
  },
  
  // 添加闹钟
  addAlarm() {
    ty.navigateTo({
      url: '/pages/alarm-edit/alarm-edit'
    });
  },
  
  // FTMS蓝牙开关
  toggleFTMS(e) {
    const enabled = e.detail.value;
    this.setData({
      ftmsEnabled: enabled
    });
    ty.setStorageSync('ftmsEnabled', enabled);
    
    if (enabled) {
      this.scanFTMSDevices();
    } else {
      this.disconnectFTMS();
    }
  },
  
  // 扫描FTMS设备
  scanFTMSDevices() {
    ty.showLoading({
      title: '扫描设备中...'
    });
    
    // 模拟蓝牙扫描
    setTimeout(() => {
      ty.hideLoading();
      ty.showModal({
        title: '设备扫描',
        content: '请选择要连接的FTMS设备',
        showCancel: true,
        confirmText: '连接',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.connectFTMSDevice();
          }
        }
      });
    }, 2000);
  },
  
  // 连接FTMS设备
  connectFTMSDevice() {
    ty.showLoading({
      title: '连接中...'
    });
    
    // 模拟连接过程
    setTimeout(() => {
      ty.hideLoading();
      this.setData({
        ftmsConnected: true,
        ftmsDeviceName: 'FTMS设备-001'
      });
      ty.showToast({
        title: '连接成功',
        icon: 'success'
      });
    }, 1500);
  },
  
  // 断开FTMS连接
  disconnectFTMS() {
    this.setData({
      ftmsConnected: false,
      ftmsDeviceName: ''
    });
    ty.showToast({
      title: '已断开连接',
      icon: 'none'
    });
  }
});

