Page({
  data: {
    ftmsEnabled: true,
    resistance: 20
  },

  onLoad: function (options) {
    // Initialize state if needed
    const savedState = ty.getStorageSync('ftmsEnabled');
    if (savedState !== '') {
      this.setData({ ftmsEnabled: savedState });
    }
  },

  toggleFTMS: function (e) {
    const enabled = e.detail.value;
    this.setData({
      ftmsEnabled: enabled
    });
    ty.setStorageSync('ftmsEnabled', enabled);
    // Logic to connect/disconnect Bluetooth would go here
  },

  changeResistance: function (e) {
    this.setData({
      resistance: e.detail.value
    });
    // Logic to send resistance command would go here
  }
});


