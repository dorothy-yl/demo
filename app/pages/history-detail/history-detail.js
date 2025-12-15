// 格式化dp点状态数据
function formatDpState(dpState) {
  return Object.keys(dpState).map(dpCode => ({ code: dpCode, value: dpState[dpCode] }));
}

// 导入云端同步工具
const { getHistoryFromCloud, findHistoryRecordFromCloud, saveHistoryToCloud } = require('../../utils/cloudSync.js');

Page({
  data: {
    record: null,
    deviceId: null,
    dpDataReceived: true // 标记是否已从dp点获取到数据
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
    
    return {
      id: parseInt(logData.id) || Date.now(),
      duration: this.formatTime(durationSeconds),
      date: logData.date || logData.dateCongrats || logData.cloudTimeStr || this.formatDate(new Date()),
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

  // 解析dp点112的数据并映射到record（支持单条记录和数组格式）
  parseDp112Data(dpValue, targetId = null) {
    try {
      // dp点112是字符型，尝试解析JSON字符串
      let logData = null;
      if (typeof dpValue === 'string') {
        // 尝试解析JSON字符串
        try {
          logData = JSON.parse(dpValue);
        } catch (e) {
          // 如果不是JSON，可能是其他格式的字符串
          console.warn('dp点112数据不是有效的JSON:', dpValue);
          return null;
        }
      } else if (typeof dpValue === 'object') {
        logData = dpValue;
      } else {
        console.warn('dp点112数据格式不正确:', dpValue);
        return null;
      }

      console.log('解析dp点112数据:', logData);

      // 如果解析出的是数组（多条记录）
      if (Array.isArray(logData)) {
        console.log('检测到多条记录，数量:', logData.length);
        
        // 如果指定了目标ID，查找匹配的记录
        if (targetId !== null) {
          const targetIdNum = typeof targetId === 'string' ? parseInt(targetId) : targetId;
          const matchedRecord = logData.find(item => {
            const id = typeof item.id === 'string' ? parseInt(item.id) : item.id;
            return id === targetIdNum;
          });
          
          if (matchedRecord) {
            console.log('找到匹配的记录:', matchedRecord);
            return this.parseSingleRecord(matchedRecord);
          } else {
            console.warn('未找到匹配的记录，使用第一条记录');
            // 如果没找到匹配的，返回第一条记录
            if (logData.length > 0) {
              return this.parseSingleRecord(logData[0]);
            }
          }
        } else {
          // 没有指定目标ID，返回第一条记录
          if (logData.length > 0) {
            return this.parseSingleRecord(logData[0]);
          }
        }
        return null;
      } else {
        // 单条记录
        return this.parseSingleRecord(logData);
      }
    } catch (error) {
      console.error('解析dp点112数据失败:', error, '原始数据:', dpValue);
      return null;
    }
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

  // 主动查询dp点112的数据
  queryDp112(deviceId) {
    try {
      console.log('开始查询dp点112数据，deviceId:', deviceId);
      
      const { publishDps } = ty.device;
      if (publishDps) {
        // 核心：下发查询指令（空值/特定指令触发设备上报112号DP，需和设备端协议匹配）
        publishDps({
          deviceId: deviceId,
          dps: {
            // 注意：这里的key要和设备端约定一致，112是DP编码，值按设备协议填（通常是空字符串/query）
            112: "" // 或 "query"，需和设备固件约定的查询指令匹配
          },
          success: () => {
            console.log('下发112号DP查询指令成功，等待设备上报');
          },
          fail: (err) => {
            console.error('下发112号DP查询指令失败:', err);
          }
        });
      }
      
    } catch (error) {
      console.error('查询dp点112失败:', error);
    }
  },
  // 自动上报当前记录到云端
  autoSyncToCloud(record, deviceId) {
    if (!record || !deviceId) {
      console.log('自动上报跳过：记录或设备ID为空', { record: !!record, deviceId: !!deviceId });
      return;
    }

    // 验证记录基本字段
    if (!record.id) {
      console.warn('自动上报跳过：记录ID为空', record);
      return;
    }

    // 从本地存储获取原始记录（未格式化的），确保数据格式正确
    let originalRecord = null;
    try {
      const history = ty.getStorageSync({ key: 'exerciseHistory' }) || [];
      if (Array.isArray(history) && record.id) {
        originalRecord = history.find(item => {
          const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
          const recordId = typeof record.id === 'string' ? parseInt(record.id) : record.id;
          return itemId === recordId;
        });
      }
    } catch (error) {
      console.warn('获取本地原始记录失败:', error);
    }

    // 如果找到原始记录，使用原始记录；否则使用当前记录（formatHistoryForDp112 会处理格式转换）
    const recordToSync = originalRecord || record;

    console.log('=== 开始自动上报历史记录到云端 ===');
    console.log('记录ID:', record.id);
    console.log('设备ID:', deviceId);
    console.log('使用原始记录:', !!originalRecord);
    console.log('记录数据类型:', Array.isArray(recordToSync) ? '数组' : '对象');
    console.log('要上报的记录数据:', JSON.stringify(recordToSync, null, 2));
    console.log('--- 上报流程说明 ---');
    console.log('1. 小程序端将数据格式化为JSON字符串');
    console.log('2. 通过publishDps下发到设备端');
    console.log('3. 设备端接收数据后应主动上报到云端');
    console.log('4. 请在设备日志页面查看上报结果');
    
    saveHistoryToCloud(deviceId, recordToSync)
      .then(() => {
        console.log('✓ 历史记录自动上报成功，记录ID:', record.id);
        console.log('✓ 数据已成功下发到设备端');
        console.log('--- 下一步操作 ---');
        console.log('1. 检查设备端是否接收到数据');
        console.log('2. 检查设备端是否正确上报到云端');
        console.log('3. 在涂鸦开发者平台的设备日志页面查看DP点112的上报记录');
        console.log('4. 如果设备日志中看不到上报数据，请检查设备端固件实现');
      })
      .catch(error => {
        console.error('✗ 历史记录自动上报失败:');
        console.error('错误类型:', error.constructor.name);
        console.error('错误详情:', error);
        console.error('错误消息:', error.errorMsg || error.message || error);
        console.error('错误堆栈:', error.stack);
        console.warn('上报失败不影响页面正常显示');
        // 上报失败不影响页面正常显示
      });
  },

  // 从本地存储或URL参数获取数据（回退方案）
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
    
    return record;
  },
  
  onLoad(options) {
    const id = options.id;
    
    // 先加载回退数据，确保页面有内容显示
    const fallbackRecord = this.loadRecordFromFallback(options);
    this.setData({
      record: fallbackRecord
    });
    
    // 获取设备ID
    const { getLaunchOptionsSync } = ty;
    const {
      query: { deviceId }
    } = getLaunchOptionsSync();
    this.queryDp112(deviceId);
    
    if (deviceId) {
      this.setData({ deviceId: deviceId });
      
      // 自动上报当前记录到云端
      this.autoSyncToCloud(fallbackRecord, deviceId);
      
      // 注册dp点监听
      const { onDpDataChange, registerDeviceListListener } = ty.device;
      
      const _onDpDataChange = (event) => {
        console.log('历史详情页收到dp点数据，原始数据:', event.dps);
        const dpID = formatDpState(event.dps);
        console.log('历史详情页收到dp点数据，格式化后:', JSON.stringify(dpID));
        
        // 检查是否包含dp点112
        const hasDp112 = dpID.some(element => {
          const dpCode = element.code;
          return dpCode == 112 || dpCode == '112' || parseInt(dpCode) === 112;
        });
        
        if (!hasDp112) {
          console.log('本次上报的dp点中不包含112，包含的dp点:', dpID.map(e => e.code).join(', '));
        }
        
        dpID.forEach(element => {
          // 监听dp点112（log_transfer）
          // 注意：dp点代码可能是字符串或数字，需要兼容处理
          const dpCode = element.code;
          const dpCodeNum = parseInt(dpCode);
          
          if (dpCode == 112 || dpCode == '112' || dpCodeNum === 112) {
            console.log('✓ 找到dp点112！code:', dpCode, 'value:', element.value, 'value type:', typeof element.value);
            const record = this.parseDp112Data(element.value, id);
            
            if (record) {
              console.log('✓ dp点112数据解析成功:', record);
              this.setData({
                record: record,
                dpDataReceived: true
              });
              // 自动上报从DP点获取的记录
              const deviceId = this.data.deviceId;
              if (deviceId) {
                this.autoSyncToCloud(record, deviceId);
              }
            } else {
              console.warn('✗ dp点112数据解析失败，保持使用回退数据');
            }
          }
        });
      };

      // 注册设备监听器
      registerDeviceListListener({
        deviceIdList: [deviceId],
        onDpDataChange: _onDpDataChange,
        success: () => {
          console.log('历史详情页设备监听器注册成功，主动查询dp点112数据');
          // 主动查询dp点112的值（通过下发空值或查询命令触发设备上报）
          // 由于dp点112是可下发可上报，可以通过查询设备信息或下发查询命令来获取
          this.queryDp112(deviceId);
          
          // 同时尝试从云端获取历史记录
          if (id) {
            console.log('尝试从云端获取历史记录，ID:', id);
            findHistoryRecordFromCloud(deviceId, id)
              .then(cloudRecord => {
                if (cloudRecord) {
                  console.log('从云端获取到历史记录:', cloudRecord);
                  const parsedRecord = this.parseSingleRecord(cloudRecord);
                  if (parsedRecord) {
                    this.setData({
                      record: parsedRecord,
                      dpDataReceived: true
                    });
                    console.log('✓ 云端数据已更新到页面');
                    // 自动上报从云端获取的记录
                    this.autoSyncToCloud(parsedRecord, deviceId);
                  }
                } else {
                  console.log('云端未找到匹配的记录，继续使用本地数据');
                }
              })
              .catch(error => {
                console.warn('从云端获取历史记录失败（不影响页面显示）:', error);
                // 云端获取失败不影响页面显示，继续使用本地数据
              });
          }
        },
        
        fail: (err) => {
          console.error('历史详情页设备监听器注册失败:', err);
          // 注册失败时继续使用已加载的回退数据
          // 即使注册失败，也尝试从云端获取数据
          if (id && deviceId) {
            findHistoryRecordFromCloud(deviceId, id)
              .then(cloudRecord => {
                if (cloudRecord) {
                  const parsedRecord = this.parseSingleRecord(cloudRecord);
                  if (parsedRecord) {
                    this.setData({
                      record: parsedRecord,
                      dpDataReceived: true
                    });
                    // 自动上报从云端获取的记录
                    this.autoSyncToCloud(parsedRecord, deviceId);
                  }
                }
              })
              .catch(error => {
                console.warn('从云端获取历史记录失败:', error);
              });
          }
        }
      });
    } else {
      console.warn('未找到设备ID，使用回退方案加载数据');
    }
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

