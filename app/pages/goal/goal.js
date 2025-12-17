Page({
  data: {
    activeButton: null, // 'time' | 'calories' | 'distance'
    showModal: false,
    statusBarHeight: 20, // Default fallback
    
    // Picker data
    range: [],
    pickerIndex: [0],
    unitText: '',
    currentValue: 0,
    titleText: '', // Title text for the blue box
    
    // Selected values
    selectedValues: {
      time: 1,
      calories: 100,
      distance: 0.5
    }
  },

  onLoad() {
    // Get system info for status bar height
    try {
      const sysInfo = ty.getSystemInfoSync();
      if (sysInfo.statusBarHeight) {
        this.setData({ statusBarHeight: sysInfo.statusBarHeight });
      }
    } catch (e) {
      console.error('Failed to get system info', e);
    }
  },

  goBack() {
    if (this.data.showModal) {
      this.closeModal();
    } else {
      ty.navigateBack();
    }
  },

  showTimePicker() {
    this.setData({ 
      activeButton: 'time',
      showModal: true
    });
    this.updatePickerData('time');
  },

  showCaloriesPicker() {
    this.setData({ 
      activeButton: 'calories',
      showModal: true
    });
    this.updatePickerData('calories');
  },

  showDistancePicker() {
    this.setData({ 
      activeButton: 'distance',
      showModal: true
    });
    this.updatePickerData('distance');
  },
  updatePickerData(type) {
    const { selectedValues } = this.data;
    let selectedValue = selectedValues[type];
    let minValue = 0;
    let maxValue = 100;
    let step = 1;
    let unitText = '';
    let titleText = '';
    
    switch(type) {
      case 'time':
        minValue = 1;
        maxValue = 60;
        step = 1;
        unitText = 'min';
        titleText = 'Time';
        if (!selectedValue) selectedValue = 1;
        break;
      case 'calories':
        minValue = 100;
        maxValue = 1500;
        step = 100;
        unitText = 'kcal';
        titleText = 'Calories';
        if (!selectedValue) selectedValue = 100;
        break;
      case 'distance':
        minValue = 0.5;
        maxValue = 50.0;
        step = 0.5;
        unitText = 'km';
        titleText = 'Distance';
        if (!selectedValue) selectedValue = 0.5;
        break;
    }
    
    // 1. 生成完整range（保留1~60完整可滚动范围）
    const range = this.generateRange(minValue, maxValue, step);
    
    // 2. 找到选中值在完整range中的索引
    let originalIndex = -1;
    const strValue = step < 1 ? selectedValue.toFixed(1) : Math.round(selectedValue).toString();
    originalIndex = range.indexOf(strValue);
    if (originalIndex === -1) originalIndex = 0;
  
    // 3. 关键：设置pickerIndex为选中项索引（选择器会自动滚动到该位置，且只显示5行）
    // 选择器的显示行数由UI层控制（比如picker组件设置`visible-item-count="5"`）
    this.setData({
      minValue,
      maxValue,
      step,
      unitText,
      titleText,
      currentValue: selectedValue,
      range, // 保留完整range，确保可滚动1~60
      pickerIndex: [originalIndex], // 选中项索引
      fullRange: range // 保留完整range备用（如果后续需要）
    });
  },

  generateRange(min, max, step) {
    let range = [];
    const count = Math.floor((max - min) / step) + 1;
    for (let i = 0; i < count; i++) {
      let val = min + i * step;
      if (step < 1) {
        range.push(val.toFixed(1));
      } else {
        range.push(Math.round(val).toString());
      }
    }
    return range;
  },

  onPickerChange(e) {
    const val = e.detail.value[0];
    const { range, activeButton, selectedValues, step } = this.data;
    
    if (val >= 0 && val < range.length) {
      const strValue = range[val];
      const numValue = parseFloat(strValue);
      
      this.setData({
        pickerIndex: [val],
        currentValue: numValue,
        selectedValues: {
          ...selectedValues,
          [activeButton]: numValue
        }
      });
    }
  },

  confirmGoal() {
    const { activeButton, currentValue } = this.data;
    console.log(`Set ${activeButton} goal to ${currentValue}`);
    
    ty.showToast({
      title: 'Goal Set!',
      icon: 'success'
    });
    
    setTimeout(() => {
      this.closeModal();
    }, 1500);
  },

  closeModal() {
    this.setData({ 
      showModal: false,
      activeButton: null
    });
  },

  stopPropagation() {
    // Prevent event bubbling to close modal when clicking on modal content
  }
});
