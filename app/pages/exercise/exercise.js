function formatDpState(dpState) {
    return Object.keys(dpState).map(dpCode => ({ code: dpCode, value: dpState[dpCode] }));
}

Page({
  data: {
    isPaused: false,
    elapsedTime: 3126, // 52:06 in seconds for demo match
    speed: 7.3,
    heartRate: 71,
    formattedTime: '00:52:06',
    rpm: 61,
    calories: 128,
    watt: 53,
    load: 1,
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
const dpID = formatDpState(event.dps);  //dpID 数组
dpID.forEach(element => {
  // 时间
  if(element.code == 104) {
    this.setData({
      elapsedTime: element.value
    });
  }
  //速度
  if(element.code == 105) {
    console.log('速度:', element.value);
    this.setData({
    speed: (element.value/1000).toFixed(1)
    });
  }
  //心率
  if(element.code == 108) {
    this.setData({
      heartRate: element.value
    });
  }
  //rpm 踏率
  if(element.code == 110) {
    this.setData({
      rpm: element.value
    });
  }
 // 卡路里
 if(element.code == 107) {
  console.log('卡路里:', element.value);
  this.setData({
    calories: (element.value/1000).toFixed(1)
  });
}
  //功率
  if(element.code == 109) {
    console.log('功率:', element.value);
    this.setData({
      watt: element.value
    });
  }
  //阻力
  if(element.code == 102) {
    console.log('阻力:', element.value);
    this.setData({
      load: element.value
    });
    this.updateGauge(element.value);
  } 
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
        this.setData({
          elapsedTime: newTime,
          formattedTime: this.formatTime(newTime),
        });
      
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
    const { query: { deviceId } } = ty.getLaunchOptionsSync();
    const targetState = !this.data.isPaused;
    // 替换为硬件实际的暂停/继续指令（如硬件用 0 表示暂停，1 表示继续）
    const controlCmd = targetState ? 'PAUSE' : 'START'; 
  
    ty.device.publishDps({
      deviceId,
      dps: { 106: controlCmd }, // 替换为硬件控制暂停/继续的dp点
      mode: 1,
      pipelines: [0, 1, 2, 3, 4, 5, 6],
      success: () => {
        this.setData({ isPaused: targetState });
        // 状态提示（可选）
        const tip = targetState ? '已暂停' : '已继续';
        ty.showToast({ title: tip, icon: 'none' });
      },
      fail: (err) => {
        console.error('硬件指令发送失败:', err);
        ty.showToast({ title: '操作失败', icon: 'none' });
      }
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
  const maxLoad = 32;
  const currentValue = Math.min(value, maxLoad);
  const maxAngle = 270;
  const progressAngle = (currentValue / maxLoad) * maxAngle;
  const startAngle = 225;
  const knobAngle = startAngle + progressAngle;

  // 计算终点坐标（可选）
  const endRadian = (knobAngle * Math.PI) / 180;
  const endX = 110 + 110 * Math.cos(endRadian);
  const endY = 110 + 110 * Math.sin(endRadian);
  
  this.setData({
    load: currentValue,
    gaugeProgressStyle: `
      background: conic-gradient(from ${startAngle}deg, #ADFF2F 0deg, #ADFF2F ${progressAngle}deg, transparent ${progressAngle}deg);
      --end-x: ${endX}px;
      --end-y: ${endY}px;
    `,
    knobAngle: knobAngle
  });
}
})
