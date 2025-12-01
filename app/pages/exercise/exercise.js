function formatDpState(dpState) {
  return Object.keys(dpState).map(dpCode => ({ code: dpCode, value: dpState[dpCode] }));
}

Page({
  data: {
    isPaused: false,
    elapsedTime: 3126, // 52:06 in seconds for demo match
    speed: 92.5,
    heartRate: 143,
    formattedTime: '00:52:06',
    rpm: 514,
    calories: 128,
    watt: 320,
    load: 85,
    gaugeProgressStyle: '',
    knobAngle: 225 // Start angle
  },
  timer: null,

  
  onLoad() {
    console.log('Exercise Page Load');
    this.startTimer();
    this.updateGauge(this.data.load);

    // 原生调用方式
const { onDpDataChange, registerDeviceListListener } = ty.device;
const { getLaunchOptionsSync } = ty;
// 启动参数中获取设备 id
const {
  query: { deviceId }
} = getLaunchOptionsSync();
 
const _onDpDataChange = (event) => {
  // console.log(formatDpState(event.dps));
console.log('dp点数组:'+ JSON.stringify(formatDpState(event.dps)));

dpID.forEach(element => {
  //速度
  if(element.code === 105) {
    this.setData({
      speed: element.value
    });
  }
  //心率
  if(element.code === 108) {
    this.setData({
      heartRate: element.value
    });
  }
  //rpm 踏率
  if(element.code === 110) {
    this.setData({
      rpm: element.value
    });
  }
  // 卡路里
  if(element.code === 107) {
    this.setData({
      calories: element.value
    });
  }
  //功率
  if(element.code === 109) {
    this.setData({
      watt: element.value
    });
  }
  //阻力
  if(element.code === 102) {
    this.setData({
      load: element.value
    });
  } 
});
 
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

  onUnload() {
    this.stopTimer();
  },

  goBack() {
    ty.navigateBack();
  },

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = secs.toString().padStart(2, '0');
    
    if (hours > 0) {
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`; // Or keep 00:XX:XX format if desired, screenshot shows 00:52:06 so HH:MM:SS preferred
  },

  startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (!this.data.isPaused) {
        const newTime = this.data.elapsedTime + 1;
        
        // Simulate small fluctuations
        const newLoad = Math.min(100, Math.max(0, this.data.load + (Math.random() - 0.5) * 2));
        
        this.setData({
          elapsedTime: newTime,
          formattedTime: this.formatTime(newTime),
          rpm: 510 + Math.floor(Math.random() * 10),
          watt: 315 + Math.floor(Math.random() * 10),
          heartRate: 140 + Math.floor(Math.random() * 6),
          speed: (90 + Math.random() * 5).toFixed(1)
        });
        
        // Update gauge occasionally
        if (newTime % 2 === 0) {
          this.updateGauge(Math.round(newLoad));
        }
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  togglePause() {
 // 启动参数中获取设备 id
const {
  query: { deviceId }
} = ty.getLaunchOptionsSync();
 
ty.device.publishDps({
  deviceId,
  dps: { 106:'START'},
  mode: 1,
  pipelines: [0, 1, 2, 3, 4, 5, 6],
  options: {},
  success: (res) => {
    console.log('publishDps success', res);
  },
  fail: (error) => {
    console.log('publishDps fail', error);
  }
});
    this.setData({
      isPaused: !this.data.isPaused
    });
  },

  stopExercise() {
    ty.showModal({
      title: 'End Workout',
      content: 'Are you sure you want to end this workout?',
      success: (res) => {
        if (res.confirm) {
          this.stopTimer();
          ty.navigateBack();
        }
      }
    });
  },

  updateGauge(value) {
    // Gauge range: 0 to 100
    // Arc range: 270 degrees (from 225deg to 495deg/135deg)
    // 0 -> 0 deg progress, 225 deg knob
    // 100 -> 270 deg progress, 495 deg knob
    
    const maxAngle = 270;
    const progressAngle = (value / 100) * maxAngle;
    const startAngle = 225;
    const knobAngle = startAngle + progressAngle;
    
    this.setData({
      load: value,
      // conic-gradient: start color at 0deg (relative to 'from'), end color at progressAngle
      gaugeProgressStyle: `background: conic-gradient(from ${startAngle}deg, #ADFF2F 0deg, #ADFF2F ${progressAngle}deg, transparent ${progressAngle}deg);`,
      knobAngle: knobAngle
    });
  }
});
