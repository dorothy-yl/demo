function formatDpState(dpState) {
  return Object.keys(dpState).map(dpCode => ({ code: dpCode, value: dpState[dpCode] }));
}

// 导入云端同步工具
const { formatTipsForDp113 } = require('../../../utils/cloudSync.js');
Page({
  data: {
    // 标签页
    activeTab: 'schedule', // 'tips' 或 'schedule'
    
    // Tips 标签页数据
    tipTitle: '',
    selectedDate: null, // Date 对象
    selectedTime: { hour: 15, minute: 0 },
    showDatePicker: false,
    showTimePicker: false,
    editingTipId: null, // 编辑模式下的 ID
    
    // 日期显示文本
    dateDisplayText: '今天',
    timeDisplayText: '15:00',
    
    // 日历相关
    calendarCurrentDate: new Date(),
    calendarDays: [],
    weekdays: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    currentMonthText: '',
    showYearPicker: false,
    yearPickerYears: [],
    yearPickerIndex: [0],
    selectedYear: null,
    
    // 时间选择器数据
    timePickerHours: [],
    timePickerMinutes: [],
    timePickerIndex: [15, 0], // [hourIndex, minuteIndex]
    
    // 日程列表
    tips: [] // 存储所有提醒事项
  },

  onLoad() {
    
    ty.hideMenuButton({ 
      success: () => {
        console.log('hideMenuButton success');
      }, 
      fail: (error) => {
        console.log('hideMenuButton fail', error);
      } 
    });
    
    // 初始化时间选择器数据
    this.initTimePicker();
    
    // 初始化当前日期和时间
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    this.setData({
      selectedDate: now,
      selectedTime: {
        hour: hour,
        minute: minute
      },
      timePickerIndex: [hour, minute],
      dateDisplayText: this.getDateDisplayText(now),
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
    
    this.loadTips();
    
    this.fetchTipsFromCloud();
    
    this.generateCalendar();
    
    this.setupDp113Listener();
  },

  onShow() {
    this.loadTips();
    this.fetchTipsFromCloud();
  },

  // 初始化时间选择器数据
  initTimePicker() {
    const hours = [];
    const minutes = [];
    
    for (let i = 0; i < 24; i++) {
      hours.push(String(i).padStart(2, '0'));
    }
    
    for (let i = 0; i < 60; i++) {
      minutes.push(String(i).padStart(2, '0'));
    }
    
    this.setData({
      timePickerHours: hours,
      timePickerMinutes: minutes
    });
  },

  // 格式化提醒数据用于页面显示（提取为独立方法）
  formatTipsForDisplay(tips) {
    if (!Array.isArray(tips) || tips.length === 0) {
      return [];
    }

    // 按日期和时间排序（最新的在前）
    const sortedTips = [...tips].sort((a, b) => {
      const dateA = new Date(a.dateTime || a.date || 0).getTime();
      const dateB = new Date(b.dateTime || b.date || 0).getTime();
      return dateB - dateA;
    });

    // 格式化每个提醒的日期和时间用于显示
    const formattedTips = sortedTips.map(tip => {
      // 确保 tip 是有效对象
      if (!tip || typeof tip !== 'object') {
        return null;
      }
      
      const date = new Date(tip.dateTime || tip.date);
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for tip:', tip);
        return null;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const weekday = weekdays[date.getDay()];
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return {
        ...tip,
        formattedDate: `${year}.${month}.${day}.${weekday}`,
        formattedTime: `${hours}:${minutes}`
      };
    }).filter(tip => tip !== null); // 过滤掉无效的提醒

    return formattedTips;
  },

  // 加载提醒列表
  loadTips() {
    try {
      // 参照 exercise.js 第762行的逻辑：统一使用字符串key的方式获取存储数据
      let tips = ty.getStorageSync('tips') || [];
      
      // 参照 exercise.js 第765-768行：确保history是数组
      if (!Array.isArray(tips)) {
        console.warn('tips is not an array, resetting to empty array');
        ty.setStorageSync('tips', []);
        tips = [];
      }
      
      // 使用统一的格式化方法
      const formattedTips = this.formatTipsForDisplay(tips);
      
      console.log('加载提醒列表，共', formattedTips.length, '条');
      this.setData({ tips: formattedTips });
    } catch (error) {
      console.error('加载提醒列表失败:', error);
      // 出错时设置为空数组
      this.setData({ tips: [] });
    }
  },

  // 处理云端数据（提取为独立方法，便于复用和调试）
  handleCloudData(cloudData) {
    if (!cloudData) {
      console.warn('云端数据为空，使用本地数据');
      // 如果云端数据为空，加载本地数据
      this.loadTips();
      return;
    }

    console.log('开始处理云端数据，原始数据:', cloudData);
    console.log('数据类型:', typeof cloudData);

    try {
      // 如果已经是对象，直接使用；如果是字符串，先解析
      let tips;
      if (typeof cloudData === 'string') {
        tips = JSON.parse(cloudData);
      } else if (Array.isArray(cloudData)) {
        tips = cloudData;
      } else {
        console.warn('云端数据格式不正确，期望字符串或数组，实际:', typeof cloudData);
        // 数据格式不正确时，使用本地数据
        this.loadTips();
        return;
      }
      
      if (Array.isArray(tips)) {
        console.log('解析成功，共', tips.length, '条提醒');
        console.log('提醒数据详情:', JSON.stringify(tips, null, 2));
        
        // 参照 exercise.js 第774-785行：保存到本地存储，使用setStorage确保UTF-8编码正确处理
        ty.setStorage({
          key: 'tips',
          data: tips,
          success: (res) => {
            console.log('云端提醒数据已保存到本地存储');
            // 重新加载提醒列表
            this.loadTips();
          },
          fail: (err) => {
            console.error('保存云端数据到本地存储失败:', err);
            // 即使保存失败，也尝试使用 setStorageSync 作为降级方案
            try {
              ty.setStorageSync('tips', tips);
              this.loadTips();
            } catch (syncError) {
              console.error('setStorageSync 也失败:', syncError);
              // 如果都失败了，至少加载本地数据
              this.loadTips();
            }
          }
        });
        
        console.log('云端提醒数据已同步到本地，共', tips.length, '条');
      } else {
        console.warn('云端数据格式错误，应为数组，实际:', typeof tips);
        // 数据格式错误时，使用本地数据
        this.loadTips();
      }
    } catch (error) {
      console.error('解析云端提醒数据失败:', error);
      console.error('错误堆栈:', error.stack);
      console.error('原始数据:', cloudData);
      // 解析失败时，使用本地数据
      this.loadTips();
    }
  },

  // 设置 DP 点 113 监听（运动提醒云端同步）
  setupDp113Listener() {
    const { onDpDataChange, registerDeviceListListener } = ty.device;
    const { getLaunchOptionsSync } = ty;
    const { query: { deviceId } } = getLaunchOptionsSync();

    if (!deviceId) {
      console.warn('设备ID不存在，无法监听云端数据');
      return;
    }

    // formatDpState 辅助函数
    const formatDpState = (dpState) => {
      return Object.keys(dpState).map(dpCode => ({ code: dpCode, value: dpState[dpCode] }));
    };

    // 监听 DP 点数据变化
    const _onDpDataChange = (event) => {
      if (!event.dps) {
        console.log('onDpDataChange: event.dps 为空');
        return;
      }

      console.log('onDpDataChange 收到数据:', JSON.stringify(event.dps));
      
      const dpState = event.dps;
      
      // 方法1: 直接访问（保持兼容性）
      if (dpState['113'] !== undefined) {
        const cloudData = dpState['113'];
        console.log('收到云端运动提醒数据（DP113，方法1）:', cloudData);
        this.handleCloudData(cloudData);
        return;
      }
      
      // 方法2: 使用 formatDpState 格式化后查找（更可靠）
      const dpArray = formatDpState(dpState);
      const dp113 = dpArray.find(item => item.code === '113' || item.code === 113);
      
      if (dp113) {
        console.log('收到云端运动提醒数据（DP113，方法2）:', dp113.value);
        this.handleCloudData(dp113.value);
      } else {
        console.log('未找到 DP113 数据，可用的 DP 点:', dpArray.map(item => item.code));
      }
    };

    // 注册设备监听
    registerDeviceListListener({
      deviceIdList: [deviceId],
      success: () => {
        console.log('运动提醒云端监听注册成功（DP113）');
      },
      fail: (error) => {
        console.error('运动提醒云端监听注册失败:', error);
      }
    });

    // 监听 DP 点变化
    onDpDataChange(_onDpDataChange);
  },

  // 上报运动提醒到云端（DP 点 113）
  uploadTipsToCloud(tips) {
    const { getLaunchOptionsSync } = ty;
    const { query: { deviceId } } = getLaunchOptionsSync();

    if (!deviceId) {
      console.warn('设备ID不存在，无法上报数据到云端');
      return;
    }

    try {
      // 格式化为 DP 点 113 需要的 JSON 字符串
      const dp113Value = formatTipsForDp113(tips);
      
      if (!dp113Value || dp113Value === '[]') {
        console.error('提醒数据格式化失败，无法上报');
        return;
      }

      console.log('=== 上报运动提醒到云端（DP113）===');
      console.log('设备ID:', deviceId);
      console.log('提醒数量:', tips.length);
      console.log('DP点113数据:', dp113Value);

      // 通过 publishDps 上报到云端
      ty.device.publishDps({
        deviceId: deviceId,
        dps: {
          113: dp113Value
        },
        mode: 2, // 自动选择最佳通道
        pipelines: [0, 1, 2, 3, 4, 5, 6], // 所有通道
        success: (res) => {
          console.log('✓ 运动提醒已上报到云端（DP113）');
          console.log('响应数据:', JSON.stringify(res));
        },
        fail: (error) => {
          console.error('✗ 运动提醒上报失败:');
          console.error('错误详情:', JSON.stringify(error));
          console.error('错误消息:', error.errorMsg || error.message || error);
        }
      });
    } catch (error) {
      console.error('上报运动提醒到云端失败:', error);
    }
  },

  // 从云端拉取运动提醒（DP 点 113）
  fetchTipsFromCloud() {
    const { getLaunchOptionsSync } = ty;
    const { query: { deviceId } } = getLaunchOptionsSync();

    if (!deviceId) {
      console.warn('设备ID不存在，无法从云端拉取数据');
      // 如果设备ID不存在，仍然从本地加载
      this.loadTips();
      return;
    }

    try {
      console.log('=== 从云端拉取运动提醒（DP113）===');
      console.log('设备ID:', deviceId);

      // 方法1: 尝试从日志接口获取（类似历史运动页面）
      if (ty.getAnalyticsLogsPublishLog) {
        ty.getAnalyticsLogsPublishLog({
          devId: deviceId,
          dpIds: '113', // DP 点 113
          offset: 0,
          limit: 10 // 获取最新的50条日志（增加数量以获取更多数据）
        })
          .then((response) => {
            console.log('✓ 从日志接口获取数据成功');
            console.log('云端返回的原始数据:', response);
            console.log('响应数据类型:', typeof response);
            console.log('响应数据键:', response ? Object.keys(response) : 'null');
            
            // 解析云端日志数据
            const tips = this.parseTipsFromLogs(response);
            
            if (tips && tips.length > 0) {
              console.log('从日志中解析出', tips.length, '条提醒');
              console.log('解析出的提醒数据预览:', tips.slice(0, 3));
              
              // 直接格式化并设置到页面（类似历史运动页面）
              const formattedTips = this.formatTipsForDisplay(tips);
              console.log('格式化后共', formattedTips.length, '条提醒');
              
              // 直接设置到页面
              this.setData({ tips: formattedTips });
              
              // 同时保存到本地存储（用于降级方案）
              ty.setStorage({
                key: 'tips',
                data: tips,
                success: (res) => {
                  console.log('✓ 云端提醒数据已保存到本地存储');
                },
                fail: (err) => {
                  console.warn('保存云端数据到本地存储失败（不影响显示）:', err);
                  // 降级方案：尝试使用 setStorageSync
                  try {
                    ty.setStorageSync('tips', tips);
                  } catch (syncError) {
                    console.warn('setStorageSync 也失败（不影响显示）:', syncError);
                  }
                }
              });
            } else {
              console.log('日志中暂无提醒数据，尝试方法2');
              // 如果日志中没有数据，尝试方法2
              this.fetchTipsFromDeviceState();
            }
          })
          .catch((error) => {
            console.error('从日志接口获取数据失败:', error);
            // 如果日志接口失败，尝试方法2
            this.fetchTipsFromDeviceState();
          });
      } else {
        // 如果日志接口不可用，使用设备状态接口
        console.log('日志接口不可用，使用设备状态接口');
        this.fetchTipsFromDeviceState();
      }
    } catch (error) {
      console.error('从云端拉取运动提醒失败:', error);
      console.error('错误堆栈:', error.stack);
      // 如果出错，从本地加载
      this.loadTips();
    }
  },

  // 方法2: 从设备状态获取（备用方案）
  fetchTipsFromDeviceState() {
    const { getLaunchOptionsSync } = ty;
    const { query: { deviceId } } = getLaunchOptionsSync();

    console.log('尝试从设备状态获取数据...');
    
    // 获取设备当前状态
    ty.device.getDpDataFromDevice({
      deviceId: deviceId,
      success: (res) => {
        console.log('✓ 获取设备状态成功');
        console.log('完整响应数据:', JSON.stringify(res, null, 2));
        
        // 检查是否有 DP 点 113 数据
        if (res.dps && res.dps['113'] !== undefined) {
          const cloudData = res.dps['113'];
          console.log('收到云端运动提醒数据（从 getDpDataFromDevice）:', cloudData);
          console.log('数据类型:', typeof cloudData);
          
          // 处理云端数据
          let tips = [];
          if (typeof cloudData === 'string') {
            try {
              tips = JSON.parse(cloudData);
            } catch (error) {
              console.error('解析云端数据失败:', error);
              this.loadTips();
              return;
            }
          } else if (Array.isArray(cloudData)) {
            tips = cloudData;
          } else {
            console.warn('云端数据格式不正确');
            this.loadTips();
            return;
          }
          
          // 直接格式化并设置到页面
          const formattedTips = this.formatTipsForDisplay(tips);
          console.log('格式化后共', formattedTips.length, '条提醒');
          this.setData({ tips: formattedTips });
          
          // 同时保存到本地存储
          ty.setStorage({
            key: 'tips',
            data: tips,
            success: () => {
              console.log('✓ 云端提醒数据已保存到本地存储');
            },
            fail: (err) => {
              console.warn('保存云端数据到本地存储失败（不影响显示）:', err);
            }
          });
        } else {
          console.log('云端暂无运动提醒数据（DP113）');
          console.log('可用的 DP 点:', res.dps ? Object.keys(res.dps) : '无');
          // 如果云端没有数据，从本地加载
          this.loadTips();
        }
      },
      fail: (error) => {
        console.error('✗ 从设备状态获取数据失败:');
        console.error('错误详情:', JSON.stringify(error));
        console.error('错误消息:', error.errorMsg || error.message || error);
        
        // 如果拉取失败，仍然从本地加载
        this.loadTips();
      }
    });
  },

  // 从日志数据中解析提醒数据
  parseTipsFromLogs(response) {
    const allTips = [];
    
    try {
      if (!response) {
        console.warn('云端返回数据为空');
        return [];
      }

      // 如果 response 是数组，直接遍历
      // 如果 response 有 data 或 list 字段，使用该字段
      let logItems = [];
      if (Array.isArray(response)) {
        logItems = response;
      } else if (response.data && Array.isArray(response.data)) {
        logItems = response.data;
      } else if (response.list && Array.isArray(response.list)) {
        logItems = response.list;
      } else if (response.dps && Array.isArray(response.dps)) {
        logItems = response.dps;
      } else {
        console.warn('云端返回数据格式不正确，无法找到数组字段');
        console.log('响应数据结构:', Object.keys(response || {}));
        return [];
      }

      console.log('找到', logItems.length, '条日志记录');

      logItems.forEach((logItem, index) => {
        try {
          // 从日志中提取 DP 点 113 的值
          // 根据设备日志截图，优先检查"事件详情"字段（中文）
          let tipData = null;
          
          // 优先检查"事件详情"字段（根据截图，这是主要字段）
          if (logItem['事件详情'] !== undefined && logItem['事件详情'] !== null) {
            const eventDetail = logItem['事件详情'];
            if (typeof eventDetail === 'string' && eventDetail.trim()) {
              try {
                tipData = JSON.parse(eventDetail);
                console.log(`解析"事件详情"成功 (记录${index}):`, tipData);
              } catch (parseError) {
                console.warn(`解析"事件详情"JSON失败 (记录${index}):`, parseError);
                console.warn('原始数据:', eventDetail);
              }
            } else {
              tipData = eventDetail;
            }
          } else if (logItem.eventDetail !== undefined && logItem.eventDetail !== null) {
            tipData = typeof logItem.eventDetail === 'string' 
              ? JSON.parse(logItem.eventDetail) 
              : logItem.eventDetail;
          } else if (logItem.value !== undefined && logItem.value !== null) {
            tipData = typeof logItem.value === 'string' 
              ? JSON.parse(logItem.value) 
              : logItem.value;
          } else if (logItem.dpValue !== undefined && logItem.dpValue !== null) {
            tipData = typeof logItem.dpValue === 'string' 
              ? JSON.parse(logItem.dpValue) 
              : logItem.dpValue;
          } else if (logItem.detail !== undefined && logItem.detail !== null) {
            tipData = typeof logItem.detail === 'string' 
              ? JSON.parse(logItem.detail) 
              : logItem.detail;
          }

          // 处理解析出的数据，确保格式正确
          const processTip = (tip) => {
            if (!tip || !tip.id) {
              return null;
            }

            // 确保 dateTime 字段存在且格式正确
            let dateTime = tip.dateTime;
            
            // 如果 dateTime 不存在，尝试根据 date 和 time 字段组合生成
            if (!dateTime) {
              if (tip.date && tip.time) {
                try {
                  const dateObj = new Date(tip.date);
                  if (tip.time.hour !== undefined && tip.time.minute !== undefined) {
                    dateObj.setHours(tip.time.hour);
                    dateObj.setMinutes(tip.time.minute);
                    dateObj.setSeconds(0);
                    dateObj.setMilliseconds(0);
                    dateTime = dateObj.toISOString();
                  } else {
                    dateTime = tip.date;
                  }
                } catch (error) {
                  console.warn('组合 dateTime 失败:', error);
                  dateTime = tip.date || new Date().toISOString();
                }
              } else if (tip.date) {
                dateTime = tip.date;
              } else {
                console.warn('提醒数据缺少日期信息:', tip);
                dateTime = new Date().toISOString();
              }
            }

            // 确保 date 字段存在
            if (!tip.date && dateTime) {
              tip.date = dateTime;
            }

            // 确保 time 字段存在
            if (!tip.time && dateTime) {
              try {
                const dateObj = new Date(dateTime);
                tip.time = {
                  hour: dateObj.getHours(),
                  minute: dateObj.getMinutes()
                };
              } catch (error) {
                console.warn('解析 time 字段失败:', error);
                tip.time = { hour: 0, minute: 0 };
              }
            }

            // 返回格式化的提醒对象
            return {
              id: tip.id,
              title: tip.title || '',
              date: tip.date || dateTime,
              time: tip.time || { hour: 0, minute: 0 },
              dateTime: dateTime
            };
          };

          // 如果 tipData 是数组，展开为多条记录
          if (Array.isArray(tipData)) {
            tipData.forEach(tip => {
              const processedTip = processTip(tip);
              if (processedTip) {
                allTips.push(processedTip);
              }
            });
          } else if (tipData && typeof tipData === 'object' && tipData.id) {
            // 单条记录
            const processedTip = processTip(tipData);
            if (processedTip) {
              allTips.push(processedTip);
            }
          }
        } catch (error) {
          console.warn(`解析第 ${index} 条日志记录失败:`, error, logItem);
        }
      });

      // 去重（根据 id），保留最新的记录
      const uniqueTips = [];
      const tipIds = new Set();
      allTips.forEach(tip => {
        if (!tipIds.has(tip.id)) {
          tipIds.add(tip.id);
          uniqueTips.push(tip);
        }
      });

      // 按日期时间排序（最新的在前）
      uniqueTips.sort((a, b) => {
        const dateA = new Date(a.dateTime || a.date || 0).getTime();
        const dateB = new Date(b.dateTime || b.date || 0).getTime();
        return dateB - dateA;
      });

      console.log(`成功解析 ${uniqueTips.length} 条云端提醒记录`);
      console.log('解析后的提醒数据预览:', uniqueTips.slice(0, 3));
      return uniqueTips;
    } catch (error) {
      console.error('解析云端日志数据失败:', error);
      console.error('错误堆栈:', error.stack);
      return [];
    }
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ 
      activeTab: tab,
      showDatePicker: false,
      showTimePicker: false
    });
    
    // 如果切换到"我的日程"，从云端拉取最新数据
    if (tab === 'schedule') {
      this.fetchTipsFromCloud();
    }
  },

  // 跳转到创建提醒页面
  goToCreateTip() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    this.setData({
      activeTab: 'tips',
      tipTitle: '',
      editingTipId: null,
      selectedDate: now,
      selectedTime: {
        hour: hour,
        minute: minute
      },
      timePickerIndex: [hour, minute],
      dateDisplayText: this.getDateDisplayText(now),
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      showDatePicker: false,
      showTimePicker: false
    });
    
    // 更新日历显示
    this.setData({
      calendarCurrentDate: new Date(now.getFullYear(), now.getMonth(), 1)
    });
    this.generateCalendar();
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      tipTitle: e.detail.value
    });
  },

  // 关闭所有选择器（点击外部区域）
  closeAllPickers() {
    if (this.data.showDatePicker || this.data.showTimePicker) {
      this.setData({
        showDatePicker: false,
        showTimePicker: false
      });
    }
  },

  // 切换日期选择器
  toggleDatePicker() {
    const newShowState = !this.data.showDatePicker;
    
    if (newShowState && this.data.selectedDate) {
      const date = new Date(this.data.selectedDate);
      this.setData({
        calendarCurrentDate: new Date(date.getFullYear(), date.getMonth(), 1),
        showDatePicker: true,
        showTimePicker: false,
        dateDisplayText: this.getDateDisplayText(date)
      });
      this.generateCalendar();
    } else {
      this.setData({
        showDatePicker: newShowState,
        showTimePicker: false
      });
      if (newShowState) {
        this.generateCalendar();
      }
    }
  },

  // 显示日期选择器（保留此方法以兼容其他可能的调用）
  showDatePicker() {
    // 如果已选择日期，设置日历显示为该日期所在月份，并更新日期显示文本
    if (this.data.selectedDate) {
      const date = new Date(this.data.selectedDate);
      this.setData({
        calendarCurrentDate: new Date(date.getFullYear(), date.getMonth(), 1),
        showDatePicker: true,
        showTimePicker: false, // 关闭时间选择器
        dateDisplayText: this.getDateDisplayText(date) // 确保显示完整日期格式
      });
    } else {
      this.setData({
        showDatePicker: true,
        showTimePicker: false // 关闭时间选择器
      });
    }
    this.generateCalendar();
  },

  // 隐藏日期选择器
  hideDatePicker() {
    this.setData({
      showDatePicker: false
    });
  },

  // 切换时间选择器
  toggleTimePicker() {
    this.setData({
      showTimePicker: !this.data.showTimePicker,
      showDatePicker: false
    });
  },

  // 显示时间选择器（保留此方法以兼容其他可能的调用）
  showTimePicker() {
    this.setData({
      showTimePicker: true,
      showDatePicker: false // 关闭日期选择器
    });
  },

  // 隐藏时间选择器
  hideTimePicker() {
    this.setData({
      showTimePicker: false
    });
  },

  // 生成日历
  generateCalendar() {
    const { calendarCurrentDate, selectedDate } = this.data;
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    // 格式化月份文本：October 2022
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthText = `${monthNames[month]} ${year}`;
    this.setData({ currentMonthText: monthText });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const calendarDays = [];
    const today = new Date();

    // 只生成当前月的日期，但需要空位来对齐星期
    // 在当月第一天之前添加空位
    for (let i = 0; i < startWeekday; i++) {
      calendarDays.push({
        day: '',
        date: null,
        isEmpty: true
      });
    }

    // 当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarDays.push({
        day: day,
        date: date,
        isToday: this.isSameDate(date, today),
        isSelected: this.isSameDate(date, selectedDate)
      });
    }

    this.setData({ calendarDays });
  },

  // 判断两个日期是否是同一天
  isSameDate(date1, date2) {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  },

  // 日历月份切换
  prevMonth() {
    const { calendarCurrentDate } = this.data;
    const newDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() - 1, 1);
    this.setData({ calendarCurrentDate: newDate });
    this.generateCalendar();
  },

  nextMonth() {
    const { calendarCurrentDate } = this.data;
    const newDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, 1);
    this.setData({ calendarCurrentDate: newDate });
    this.generateCalendar();
  },

  // 显示年份选择器
  showYearPicker() {
    const { calendarCurrentDate } = this.data;
    const currentYear = calendarCurrentDate.getFullYear();
    const years = [];
    const startYear = currentYear - 50;
    const endYear = currentYear + 50;
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    
    const selectedIndex = years.indexOf(currentYear);
    
    this.setData({
      yearPickerYears: years,
      yearPickerIndex: [selectedIndex],
      selectedYear: currentYear,
      showYearPicker: true
    });
  },

  // 隐藏年份选择器
  hideYearPicker() {
    this.setData({
      showYearPicker: false
    });
  },

  // 年份选择器滚动事件
  onYearPickerChange(e) {
    const values = e.detail.value;
    const yearIndex = values[0];
    const { yearPickerYears } = this.data;
    const selectedYear = yearPickerYears[yearIndex];
    
    this.setData({
      yearPickerIndex: [yearIndex],
      selectedYear: selectedYear
    });
  },

  // 确认年份选择
  confirmYear() {
    const { selectedYear, calendarCurrentDate } = this.data;
    if (selectedYear) {
      const newDate = new Date(selectedYear, calendarCurrentDate.getMonth(), 1);
      this.setData({ 
        calendarCurrentDate: newDate,
        showYearPicker: false
      });
      this.generateCalendar();
    }
  },

  // 从日历选择日期
  selectDateFromCalendar(e) {
    const isEmpty = e.currentTarget.dataset.isEmpty;
    if (isEmpty) return;
    
    const dateStr = e.currentTarget.dataset.date;
    if (!dateStr) return;
    
    const selectedDate = new Date(dateStr);
    this.setData({
      selectedDate: selectedDate,
      showDatePicker: false,
      dateDisplayText: this.getDateDisplayText(selectedDate)
    });
    this.generateCalendar();
  },

  // 时间选择器滚动事件
  onTimePickerChange(e) {
    const values = e.detail.value;
    const hour = parseInt(values[0]);
    const minute = parseInt(values[1]);
    
    this.setData({
      'selectedTime.hour': hour,
      'selectedTime.minute': minute,
      timePickerIndex: [hour, minute],
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
  },

  // 格式化日期显示
  getDateDisplayText(date) {
    if (!date) return '今天';
    
    const dateObj = new Date(date);
    const today = new Date();
    
    // 判断是否是今天
    if (this.isSameDate(dateObj, today)) {
      return '今天';
    }
    
    // 格式化日期：2025.12.19.星期五
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[dateObj.getDay()];
    
    return `${year}.${month}.${day}.${weekday}`;
  },

  // 保存提醒
  saveTip() {
    const { tipTitle, selectedDate, selectedTime, editingTipId } = this.data;
    
    // 验证标题
    if (!tipTitle || tipTitle.trim() === '') {
      ty.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return;
    }
    
    // 验证日期
    if (!selectedDate) {
      ty.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return;
    }
    
    // 创建日期时间对象
    const dateTime = new Date(selectedDate);
    dateTime.setHours(selectedTime.hour);
    dateTime.setMinutes(selectedTime.minute);
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
    
    // 参照 exercise.js 第762行：统一使用字符串key的方式获取存储数据
    let rawTips = ty.getStorageSync('tips') || [];
    
    // 参照 exercise.js 第765-768行：确保history是数组
    if (!Array.isArray(rawTips)) {
      console.warn('tips is not an array, resetting to empty array');
      rawTips = [];
    }
    
    if (editingTipId) {
      // 编辑模式：更新现有提醒
      const index = rawTips.findIndex(t => t.id === editingTipId);
      if (index > -1) {
        rawTips[index] = {
          ...rawTips[index],
          title: tipTitle.trim(),
          date: selectedDate.toISOString ? selectedDate.toISOString() : selectedDate,
          time: { ...selectedTime },
          dateTime: dateTime.toISOString()
        };
      }
    } else {
      // 新建模式：创建新提醒
      const newTip = {
        id: Date.now().toString(),
        title: tipTitle.trim(),
        date: selectedDate.toISOString ? selectedDate.toISOString() : selectedDate,
        time: { ...selectedTime },
        dateTime: dateTime.toISOString()
      };
      rawTips.push(newTip);
    }
    
    // 重置表单并跳转的辅助函数
    const resetFormAndNavigate = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      this.setData({
        tipTitle: '',
        editingTipId: null,
        selectedDate: now,
        selectedTime: {
          hour: hour,
          minute: minute
        },
        timePickerIndex: [hour, minute],
        dateDisplayText: this.getDateDisplayText(now),
        timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        activeTab: 'schedule' // 跳转到我的日程页面
      });
      
      // 显示保存成功提示
      ty.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000
      });
    };
    
    // 参照 exercise.js 第774-785行：保存到storage，使用setStorage确保UTF-8编码正确处理
    try {
      ty.setStorage({
        key: 'tips',
        data: rawTips,
        success: (res) => {
          console.log('提醒保存到本地存储成功');
          // 上报到云端（DP 点 113）
          this.uploadTipsToCloud(rawTips);
          // 保存到本地存储后重新加载（会自动格式化日期和时间）
          this.loadTips();
          // 重置表单并跳转到我的日程页面（确保在数据加载后执行）
          resetFormAndNavigate();
        },
        fail: (err) => {
          console.error('提醒保存到本地存储失败:', err);
          // 降级方案：使用 setStorageSync
          try {
            ty.setStorageSync('tips', rawTips);
            // 上报到云端（DP 点 113）
            this.uploadTipsToCloud(rawTips);
            // 保存到本地存储后重新加载（会自动格式化日期和时间）
            this.loadTips();
            // 重置表单并跳转到我的日程页面（确保在数据加载后执行）
            resetFormAndNavigate();
          } catch (syncError) {
            console.error('setStorageSync 也失败:', syncError);
            ty.showToast({
              title: '数据保存失败',
              icon: 'none'
            });
            return;
          }
        }
      });
    } catch (error) {
      console.error('保存提醒到本地存储失败:', error);
      ty.showToast({
        title: '数据保存失败',
        icon: 'none'
      });
      return;
    }
  },

  // 编辑提醒
  editTip(e) {
    const id = e.currentTarget.dataset.id;
    const tip = this.data.tips.find(t => t.id === id);
    
    if (!tip) return;
    
    const date = new Date(tip.date);
    const { hour, minute } = tip.time;
    
    this.setData({
      activeTab: 'tips',
      tipTitle: tip.title,
      selectedDate: date,
      selectedTime: { ...tip.time },
      editingTipId: id,
      timePickerIndex: [hour, minute],
      dateDisplayText: this.getDateDisplayText(date),
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
    
    // 更新日历显示
    this.setData({
      calendarCurrentDate: new Date(date.getFullYear(), date.getMonth(), 1)
    });
    this.generateCalendar();
  },

  // 删除提醒
  deleteTip() {
    const { editingTipId } = this.data;
    
    if (!editingTipId) return;
    
    ty.showModal({
      title: '确认删除',
      content: '确定要删除这个提醒吗？',
      success: (res) => {
        if (res.confirm) {
          // 参照 exercise.js 第762行：统一使用字符串key的方式获取存储数据
          let rawTips = ty.getStorageSync('tips') || [];
          
          // 参照 exercise.js 第765-768行：确保history是数组
          if (!Array.isArray(rawTips)) {
            console.warn('tips is not an array, resetting to empty array');
            rawTips = [];
          }
          
          const updatedTips = rawTips.filter(t => t.id !== editingTipId);
          
          // 重置表单并跳转的辅助函数
          const resetAndNavigate = () => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            this.setData({
              tipTitle: '',
              editingTipId: null,
              selectedDate: now,
              selectedTime: {
                hour: hour,
                minute: minute
              },
              timePickerIndex: [hour, minute],
              dateDisplayText: this.getDateDisplayText(now),
              timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
              activeTab: 'schedule' // 删除后跳转到我的日程页面
            });
            
            ty.showToast({
              title: '删除成功',
              icon: 'success'
            });
          };
          
          // 参照 exercise.js 第774-785行：保存到storage，使用setStorage确保UTF-8编码正确处理
          try {
            ty.setStorage({
              key: 'tips',
              data: updatedTips,
              success: (res) => {
                console.log('删除后保存到本地存储成功');
                // 上报到云端（DP 点 113）
                this.uploadTipsToCloud(updatedTips);
                // 重新加载提醒列表
                this.loadTips();
                // 重置表单并跳转到我的日程页面（确保在数据加载后执行）
                resetAndNavigate();
              },
              fail: (err) => {
                console.error('删除后保存到本地存储失败:', err);
                // 降级方案：使用 setStorageSync
                try {
                  ty.setStorageSync('tips', updatedTips);
                  // 上报到云端（DP 点 113）
                  this.uploadTipsToCloud(updatedTips);
                  // 重新加载提醒列表
                  this.loadTips();
                  // 重置表单并跳转到我的日程页面（确保在数据加载后执行）
                  resetAndNavigate();
                } catch (syncError) {
                  console.error('setStorageSync 也失败:', syncError);
                  ty.showToast({
                    title: '删除失败',
                    icon: 'none'
                  });
                }
              }
            });
          } catch (error) {
            console.error('删除提醒后保存失败:', error);
            ty.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },


  // 返回
  onBack() {
    const { activeTab } = this.data;
    
    // 如果在 Tips 标签页（创建/编辑页面），先切换到日程列表
    if (activeTab === 'tips') {
      this.setData({ 
        activeTab: 'schedule',
        showDatePicker: false,
        showTimePicker: false
      });
    } else {
      // 如果在日程列表页，才真正返回
      ty.navigateBack();
    }
  },

  // 阻止事件冒泡
  stopPropagation(e) {
    // catchtap 本身已经阻止了冒泡，这个方法只需要是空函数
    // 不需要调用 e.stopPropagation()，因为在涂鸦小程序框架中这不是一个有效的方法
  }
});
