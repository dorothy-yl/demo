Page({
  data: {
    // 标签页
    activeTab: 'tips', // 'tips' 或 'schedule'
    
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
    
    // 加载已保存的提醒
    this.loadTips();
    
    // 生成日历
    this.generateCalendar();
    
    // 设置 DP 点 113 监听（运动提醒云端同步）
    this.setupDp113Listener();
  },

  onShow() {
    // 每次显示页面时重新加载提醒
    this.loadTips();
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

  // 加载提醒列表
  loadTips() {
    const tips = ty.getStorageSync('tips') || [];
    // 按日期和时间排序（最新的在前）
    tips.sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return dateB - dateA;
    });
    
    // 格式化每个提醒的日期和时间用于显示
    const formattedTips = tips.map(tip => {
      const date = new Date(tip.dateTime);
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
    });
    
    this.setData({ tips: formattedTips });
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

    // 监听 DP 点数据变化
    const _onDpDataChange = (event) => {
      if (!event.dps) return;

      const dpState = event.dps;
      // 检查是否有 DP 点 113（运动提醒）
      if (dpState['113'] !== undefined) {
        const cloudData = dpState['113'];
        console.log('收到云端运动提醒数据（DP113）:', cloudData);

        try {
          // 解析 JSON 字符串
          const tips = JSON.parse(cloudData);
          
          if (Array.isArray(tips)) {
            // 保存到本地存储
            ty.setStorageSync('tips', tips);
            
            // 重新加载提醒列表
            this.loadTips();
            
            console.log('云端提醒数据已同步到本地，共', tips.length, '条');
          } else {
            console.warn('云端数据格式错误，应为数组');
          }
        } catch (error) {
          console.error('解析云端提醒数据失败:', error);
        }
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
      // 将提醒数组转换为 JSON 字符串
      const tipsJson = JSON.stringify(tips);
      
      console.log('=== 上报运动提醒到云端（DP113）===');
      console.log('设备ID:', deviceId);
      console.log('提醒数量:', tips.length);
      console.log('数据内容:', tipsJson);

      // 通过 publishDps 上报到云端
      ty.device.publishDps({
        deviceId: deviceId,
        dps: {
          113: tipsJson
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
      return;
    }

    try {
      console.log('=== 从云端拉取运动提醒（DP113）===');
      console.log('设备ID:', deviceId);

      // 获取设备当前状态，触发云端数据下发
      ty.device.getDpDataFromDevice({
        deviceId: deviceId,
        success: (res) => {
          console.log('✓ 获取设备状态成功');
          console.log('设备状态:', JSON.stringify(res));
          
          // 检查是否有 DP 点 113 数据
          if (res.dps && res.dps['113']) {
            const cloudData = res.dps['113'];
            console.log('收到云端运动提醒数据:', cloudData);
            
            try {
              const tips = JSON.parse(cloudData);
              
              if (Array.isArray(tips)) {
                // 保存到本地存储
                ty.setStorageSync('tips', tips);
                
                // 重新加载提醒列表
                this.loadTips();
                
                console.log('云端提醒数据已同步到本地，共', tips.length, '条');
              } else {
                console.warn('云端数据格式错误，应为数组');
              }
            } catch (error) {
              console.error('解析云端提醒数据失败:', error);
            }
          } else {
            console.log('云端暂无运动提醒数据（DP113）');
          }
        },
        fail: (error) => {
          console.error('✗ 从云端拉取提醒失败:');
          console.error('错误详情:', JSON.stringify(error));
          console.error('错误消息:', error.errorMsg || error.message || error);
          
          // 如果拉取失败，仍然从本地加载
          this.loadTips();
        }
      });
    } catch (error) {
      console.error('从云端拉取运动提醒失败:', error);
      // 如果出错，从本地加载
      this.loadTips();
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
    
    // 获取原始tips数组（不含格式化字段）
    const rawTips = ty.getStorageSync('tips') || [];
    
    if (editingTipId) {
      // 编辑模式：更新现有提醒
      const index = rawTips.findIndex(t => t.id === editingTipId);
      if (index > -1) {
        rawTips[index] = {
          ...rawTips[index],
          title: tipTitle.trim(),
          date: selectedDate,
          time: { ...selectedTime },
          dateTime: dateTime
        };
      }
    } else {
      // 新建模式：创建新提醒
      const newTip = {
        id: Date.now().toString(),
        title: tipTitle.trim(),
        date: selectedDate,
        time: { ...selectedTime },
        dateTime: dateTime
      };
      rawTips.push(newTip);
    }
    
    // 保存到本地存储
    ty.setStorageSync('tips', rawTips);
    
    // 上报到云端（DP 点 113）
    this.uploadTipsToCloud(rawTips);
    
    // 保存到本地存储后重新加载（会自动格式化日期和时间）
    this.loadTips();
    
    // 重置表单
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
      timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
    
    // 切换到日程列表
    this.setData({ activeTab: 'schedule' });
    
    ty.showToast({
      title: editingTipId ? '更新成功' : '保存成功',
      icon: 'success'
    });
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
          // 获取原始tips数组（不含格式化字段）
          const rawTips = ty.getStorageSync('tips') || [];
          const updatedTips = rawTips.filter(t => t.id !== editingTipId);
          
          // 保存到本地存储
          ty.setStorageSync('tips', updatedTips);
          
          // 上报到云端（DP 点 113）
          this.uploadTipsToCloud(updatedTips);
          
          // 重新加载提醒列表
          this.loadTips();
          
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
            timeDisplayText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
          });
          
          ty.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },


  // 返回
  onBack() {
    const { activeTab } = this.data;
    
    // 如果在 Tips 标签页，先切换到日程列表
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
