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
  tempLoad: null, // 临时存储滑动过程中的load值
  throttleTimer: null, // 节流定时器
  throttledUpdateVisual: null, // 节流后的视觉更新函数
  maxResistance: null, // 最大阻力值
  minResistance: null, // 最小阻力值
  resistanceSum: 0, // 阻力总和
  resistanceCount: 0 ,// 阻力计数

  
  onLoad() {
    console.log('Exercise Page Load');
    this.startTimer();
    this.updateGauge(this.data.load);
    
    // 初始化阻力跟踪
    this.maxResistance = this.data.load;
    this.minResistance = this.data.load;
    this.resistanceSum = this.data.load;
    this.resistanceCount = 1;
    
    // 初始化节流函数
    this.throttledUpdateVisual = this.throttle((value) => {
      this.updateGaugeVisual(value);
    }, 100);

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
    const loadValue = element.value;
    this.setData({
      load: loadValue
    });
    this.updateGauge(loadValue);
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
    try {
      ty.navigateBack({
        delta: 1,
        success: () => {
          console.log('返回成功');
        },
        fail: (err) => {
          console.error('返回失败:', err);
          // 如果返回失败，尝试跳转到首页
          ty.navigateTo({
            url: '/pages/index/index'
          });
        }
      });
    } catch (error) {
      console.error('返回异常:', error);
      // 如果出现异常，尝试跳转到首页
      ty.navigateTo({
        url: '/pages/index/index'
      });
    }
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
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      success: (res) => {
        if (res.confirm) {
          // 停止计时器
          this.stopTimer();
          
          // 收集所有运动数据
          const now = new Date();
          const timestamp = now.getTime();
          const elapsedSeconds = this.data.elapsedTime;
          
          // 计算平均阻力
          const avgResistance = this.resistanceCount > 0 
            ? (this.resistanceSum / this.resistanceCount).toFixed(1) 
            : this.data.load;
          
          // 单位转换：速度从 mi/h 转为 km/h
          const speedKmh = (parseFloat(this.data.speed) * 1.609).toFixed(1);
          
          // 计算距离：distance = speed (km/h) × time (hours)
          const timeInHours = elapsedSeconds / 3600;
          const distance = (parseFloat(speedKmh) * timeInHours).toFixed(1);
          
          // 格式化时间
          const durationFormatted = this.formatTime(elapsedSeconds);
          
          // 格式化日期 - congrats格式: "2025/09/12"
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const dateCongrats = `${year}/${month}/${day}`;
          
          // 格式化日期 - history格式: "12月11日 12:01:03"
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          const dateFormatted = `${month}月${day}日 ${hours}:${minutes}:${seconds}`;
          
          // 构建运动记录对象
          const exerciseRecord = {
            id: timestamp,
            duration: elapsedSeconds,
            durationFormatted: durationFormatted,
            date: now.toISOString(),
            dateFormatted: dateFormatted,
            dateCongrats: dateCongrats,
            speed: parseFloat(this.data.speed) || 0,
            speedKmh: parseFloat(speedKmh) || 0,
            calories: parseFloat(this.data.calories) || 0,
            distance: parseFloat(distance) || 0,
            rpm: this.data.rpm || 0,
            watt: this.data.watt || 0,
            heartRate: this.data.heartRate || 0,
            maxResistance: this.maxResistance || 0,
            minResistance: this.minResistance || 0,
            avgResistance: parseFloat(avgResistance) || 0
          };
          
          // 验证数据完整性
          let saveSuccess = true;
          if (!exerciseRecord.id || exerciseRecord.duration < 0) {
            console.error('Invalid exercise record data');
            ty.showToast({
              title: '数据保存失败：数据不完整',
              icon: 'none'
            });
            saveSuccess = false;
          } else {
            // 保存到storage
            try {
              const history = ty.getStorageSync({key: 'exerciseHistory'}) || [];
              
              // 确保history是数组
              if (!Array.isArray(history)) {
                console.warn('exerciseHistory is not an array, resetting to empty array');
                ty.setStorageSync('exerciseHistory', []);
              }
              
              // 添加到数组开头（最新的在前）
              const updatedHistory = [exerciseRecord, ...history];
              
              // 保存到storage
             // ty.setStorageSync('exerciseHistory', updatedHistory);
              // 存储字符串
ty.setStorage({
  key: 'exerciseHistory',
  data: updatedHistory,
  success: (res) => {
    console.log(res.data);
  },
  fail: (err) => {
    console.log(err);
  }
});
              console.log('Exercise record saved successfully:', exerciseRecord.id);
            } catch (error) {
              console.error('Error saving exercise record to storage:', error);
              ty.showToast({
                title: '数据保存失败',
                icon: 'none'
              });
              saveSuccess = false;
            }
          }
          
          // 即使保存失败，也继续跳转到congrats页面（数据已通过URL参数传递）
          
          // 跳转到congrats页面，通过URL参数传递数据
          const params = new URLSearchParams({
            id: timestamp.toString(),
            duration: elapsedSeconds.toString(),
            speed: this.data.speed,
            speedKmh: speedKmh,
            calories: this.data.calories,
            distance: distance,
            rpm: this.data.rpm.toString(),
            watt: this.data.watt.toString(),
            heartRate: this.data.heartRate.toString(),
            maxResistance: this.maxResistance.toString(),
            minResistance: this.minResistance.toString(),
            avgResistance: avgResistance,
            dateCongrats: dateCongrats
          });
          
          ty.navigateTo({
            url: `/pages/congrats/congrats?${params.toString()}`
          });
        }
      }
    });
  },

  onReady() {
    const query = ty.createSelectorQuery();
    query.select('.gauge-wrapper').boundingClientRect((rect) => {
      if (rect) {
        this.gaugeRect = rect;
        this.gaugeCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }
    }).exec();
  },

  // 节流函数
  throttle(func, delay) {
    return (...args) => {
      if (this.throttleTimer) {
        clearTimeout(this.throttleTimer);
      }
      this.throttleTimer = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  },

  // 仅更新视觉位置（不更新load数据和发送命令）
  updateGaugeVisual(value) {
    const maxLoad = 32;
    const currentValue = Math.min(Math.max(value, 0), maxLoad);
    const maxAngle = 270;
    const progressAngle = (currentValue / maxLoad) * maxAngle;
    const startAngle = 225;
    const knobAngle = startAngle + progressAngle;

    this.setData({
      gaugeProgressStyle: `
        background: conic-gradient(from ${startAngle}deg, #ADFF2F 0deg, #ADFF2F ${progressAngle}deg, transparent ${progressAngle}deg);
      `,
      knobAngle: knobAngle
    });
  },

  handleTouchMove(e) {
    if (!this.gaugeCenter) return;

    const touch = e.touches[0];
    const dx = touch.clientX - this.gaugeCenter.x;
    const dy = touch.clientY - this.gaugeCenter.y;

    // Calculate angle in degrees
    // Math.atan2(dy, dx) returns angle from X-axis (3 o'clock).
    // We want 0 to be Y-axis (12 o'clock) for consistency with CSS rotate.
    // So we add 90 degrees.
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    // Our gauge starts at 225deg (bottom-left) and goes 270deg to 135deg (bottom-right)
    // 225 -> 0 (start)
    // 360/0 -> transition
    // 135 -> end
    
    // Normalize angle relative to start (225)
    // If angle is between 0 and 135, add 360 to make it continuous with 225-360
    // Range becomes 225 (start) to 495 (end)
    
    let adjustedAngle = angle;
    if (angle >= 0 && angle <= 135) {
      adjustedAngle = angle + 360;
    }

    // Clamping
    const startAngle = 225;
    const maxSweep = 270;
    const endAngle = startAngle + maxSweep; // 495

    if (adjustedAngle < startAngle) adjustedAngle = startAngle;
    if (adjustedAngle > endAngle) adjustedAngle = endAngle;

    // Calculate progress (0 to 1)
    const progress = (adjustedAngle - startAngle) / maxSweep;
    
    // Map to Load (0-32)
    const maxLoad = 32;
    const newLoad = Math.round(progress * maxLoad);

    // 存储临时值
    this.tempLoad = newLoad;

    // 使用节流更新视觉位置（不更新load数据和发送命令）
    if (this.throttledUpdateVisual) {
      this.throttledUpdateVisual(newLoad);
    }
  },

  handleTouchEnd(e) {
    // 清除节流定时器，避免延迟更新
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
    
    // 手指放开时，提交最终值
    if (this.tempLoad !== null && this.tempLoad !== this.data.load) {
      const finalLoad = this.tempLoad;
      
      // 更新完整显示（包括load数据）
      this.updateGauge(finalLoad);
      
      // 发送设备命令
      const { query: { deviceId } } = ty.getLaunchOptionsSync();
      if (deviceId) {
        ty.device.publishDps({
          deviceId,
          dps: { 102: finalLoad },
          mode: 1,
          pipelines: [0, 1, 2, 3, 4, 5, 6],
          success: () => {
            console.log('Load updated to:', finalLoad);
          },
          fail: (err) => {
            console.error('Failed to update load:', err);
          }
        });
      }
    }
    
    // 清除临时值
    this.tempLoad = null;
  },

  updateGauge(value) {
    const maxLoad = 32;
    const currentValue = Math.min(Math.max(value, 0), maxLoad); // Ensure bounds
    const maxAngle = 270;
    const progressAngle = (currentValue / maxLoad) * maxAngle;
    const startAngle = 225;
    const knobAngle = startAngle + progressAngle;

    // 更新阻力跟踪
    if (this.maxResistance === null || currentValue > this.maxResistance) {
      this.maxResistance = currentValue;
    }
    if (this.minResistance === null || currentValue < this.minResistance) {
      this.minResistance = currentValue;
    }
    this.resistanceSum += currentValue;
    this.resistanceCount += 1;

    // Calculate knob position
    // Radius is 110px (half of 220px width)
    // Center is (110, 110) relative to wrapper
    // Angle needs to be in radians. 
    // Math.cos/sin take radians where 0 is 3 o'clock.
    // Our knobAngle is in CSS degrees (0 is 12 o'clock usually? No, standard CSS rotation is from 12 o'clock? 
    // Wait, let's check the CSS. 
    // .gauge-knob-container is rotated by knobAngle.
    // Inside it, .gauge-knob is at top: 10px, left: 50%.
    // So 0deg rotation puts knob at 12 o'clock.
    // 225deg rotation puts it at bottom-left.
    // My calculation in handleTouchMove assumed 0 is 3 o'clock (Math.atan2 standard).
    // So I need to align these coordinate systems.
    
    // Math.atan2(dy, dx): 0 is +x (3 o'clock). +90 is +y (6 o'clock in screen coords).
    // CSS rotate: 0 is usually 12 o'clock? 
    // Actually, if I use standard rotation, 0 is 12 o'clock?
    // Let's re-verify CSS.
    // .gauge-knob-container { width: 100%; height: 100%; ... }
    // .gauge-knob { left: 50%; top: 10px; ... } -> This is at 12 o'clock position relative to container.
    // So yes, 0deg rotation = 12 o'clock.
    
    // Math.atan2 returns angle from X axis (3 o'clock).
    // 3 o'clock is 90 degrees clockwise from 12 o'clock.
    // So CSS Angle = Math Angle + 90.
    // Example: 
    // Point at 12 o'clock (0, -y): atan2(-y, 0) = -90 deg. +90 = 0 deg. Correct.
    // Point at 3 o'clock (x, 0): atan2(0, x) = 0 deg. +90 = 90 deg. Correct.
    // Point at 6 o'clock (0, y): atan2(y, 0) = 90 deg. +90 = 180 deg. Correct.
    // Point at 9 o'clock (-x, 0): atan2(0, -x) = 180 deg. +90 = 270 deg. Correct.
    
    // So in handleTouchMove, I should convert Math angle to CSS angle by adding 90.
    
    this.setData({
      load: currentValue,
      gaugeProgressStyle: `
        background: conic-gradient(from ${startAngle}deg, #ADFF2F 0deg, #ADFF2F ${progressAngle}deg, transparent ${progressAngle}deg);
      `,
      knobAngle: knobAngle
    });
  }
})
