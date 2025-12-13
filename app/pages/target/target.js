Page({
  data: {
    activeTab: 'distance',
    selectedValues: {
      distance: 0.5,
      time: 1,
      calories: 100,
    },
    // Slider configuration
    minValue: 0,
    maxValue: 100,
    step: 1,
    currentValue: 0,
    unitText: 'km',
    
    // Picker state
    range: [],
    pickerIndex: [0],
    showEmptyHint: false
  },
  
  onLoad() {
    console.log('Goal Page Load');
    this.updateCurrentValues();
  },

  onReady() {
    // Ready
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;

    if (tab === this.data.activeTab) return;

    this.setData({ activeTab: tab }, () => {
      this.updateCurrentValues();
    });
  },

  updateCurrentValues() {
    const { activeTab, selectedValues } = this.data;
    let selectedValue = selectedValues[activeTab];
    let minValue = 0;
    let maxValue = 100;
    let step = 1;
    let unitText = 'km';
    
    switch(activeTab) {
      case 'distance':
        minValue = 0.5;
        maxValue = 50.0;
        step = 0.5;
        unitText = 'km';
        if (!selectedValue) selectedValue = 0.5;
        break;
      case 'time':
        minValue = 1;
        maxValue = 60;
        step = 1;
        unitText = 'min';
        if (!selectedValue) selectedValue = 1;
        break;
      case 'calories':
        minValue = 100;
        maxValue = 1500;
        step = 100;
        unitText = 'kcal';
        if (!selectedValue) selectedValue = 100;
        break;
      case 'resistance':
        minValue = 1;
        maxValue = 32;
        step = 1;
        unitText = '';
        if (!selectedValue) selectedValue = 1;
        break;
    }
    
    // Generate Range
    const range = this.generateRange(minValue, maxValue, step);
    
    // Find index
    let index = -1;
    const strValue = step < 1 ? selectedValue.toFixed(1) : Math.round(selectedValue).toString();
    index = range.indexOf(strValue);
    if (index === -1) index = 0;

    this.setData({
      minValue,
      maxValue,
      step,
      unitText,
      currentValue: selectedValue,
      range,
      pickerIndex: [index],
      showEmptyHint: false
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
    const { range, activeTab, selectedValues, step } = this.data;
    
    if (val >= 0 && val < range.length) {
      const strValue = range[val];
      const numValue = parseFloat(strValue);
      
      this.setData({
        pickerIndex: [val],
        currentValue: numValue,
        selectedValues: {
          ...selectedValues,
          [activeTab]: numValue
        }
      });
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

  startExercise() {
    const { activeTab, selectedValues } = this.data;
    const goalValue = selectedValues[activeTab];
    const goalType = activeTab;
    
    ty.navigateTo({
      url: `/pages/exercise/exercise?goalType=${goalType}&goalValue=${goalValue}`
    });
  }
});
