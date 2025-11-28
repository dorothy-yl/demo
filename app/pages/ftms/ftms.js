Page({
  data: {
    ftmsEnabled: true,
    resistance: 20,
    deviceId: ''
  },

  onLoad: function (options) {
    // Get deviceId from launch options or page parameters
    const launchOptions = ty.getLaunchOptionsSync();
    const deviceId = options.deviceId || launchOptions.query?.deviceId || launchOptions.query?.devId;
    
    if (deviceId) {
      this.setData({ deviceId: deviceId });
    } else {
      console.warn('DeviceId not found, DP commands will not work');
      ty.showToast({
        title: '设备ID未找到',
        icon: 'none'
      });
    }

    // Initialize state if needed
    const savedState = ty.getStorageSync('ftmsEnabled');
    if (savedState !== '') {
      this.setData({ ftmsEnabled: savedState });
    }
  },

  /**
   * Send DP command to device
   * @param {Object} dps - Data points object, e.g. { 1: true, 2: 20 }
   */
  publishDps: function(dps) {
    const { deviceId } = this.data;
    
    if (!deviceId) {
      ty.showToast({
        title: '设备未连接',
        icon: 'none'
      });
      return;
    }

    const { publishDps } = ty.device;
    
    publishDps({
      deviceId: deviceId,
      dps: dps,
      mode: 2, // 0: LAN, 1: Network, 2: Auto
      pipelines: [0, 1, 2, 3, 4, 5, 6], // Priority: LAN, MQTT, HTTP, BLE, SIGMesh, BLEMesh, BLEBeacon
      options: {},
      success: (res) => {
        console.log('publishDps success', res);
      },
      fail: (error) => {
        console.error('publishDps fail', error);
        ty.showToast({
          title: '发送失败: ' + (error.errorMsg || '未知错误'),
          icon: 'none'
        });
      }
    });
  },

  toggleFTMS: function (e) {
    const enabled = e.detail.value;
    this.setData({
      ftmsEnabled: enabled
    });
    ty.setStorageSync('ftmsEnabled', enabled);
    
    // Send FTMS enable/disable DP command
    // Note: Adjust DP ID (1) based on your product configuration
    // Common DP IDs: 1 for switch, 101 for FTMS enable, etc.
    this.publishDps({
      1: enabled // Change this DP ID to match your product's FTMS enable DP
    });
  },

  changeResistance: function (e) {
    const resistance = e.detail.value;
    this.setData({
      resistance: resistance
    });
    
    // Send resistance value DP command
    // Note: Adjust DP ID (2) based on your product configuration
    // Common DP IDs: 2 for resistance, 102 for resistance value, etc.
    this.publishDps({
      2: resistance // Change this DP ID to match your product's resistance DP
    });
  }
});


