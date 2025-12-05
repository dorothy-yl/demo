Page({
  data: {
    activeTab: 'distance',
    selectedValues: {
      distance: 0.5,
      time: 1,
      calories: 100,
      resistance: 1
    },
    // Slider configuration
    minValue: 0,
    maxValue: 100,
    step: 1,
    currentValue: 0,
    unitText: 'km',
    
    // Slider state
    sliderPercentage: 0,
    isDragging: false,
    showEmptyHint: false,
    
    // Track dimensions (cached)
    trackWidth: 0,
    trackLeft: 0
  },
  
  onLoad() {
    console.log('Goal Page Load');
    this.updateCurrentValues();
    // Delay to ensure layout is ready
    setTimeout(() => {
      this.getTrackDimensions();
    }, 200);
  },

  onReady() {
    this.getTrackDimensions();
  },

  getTrackDimensions() {
    const query = ty.createSelectorQuery();
    query.select('#slider-track').boundingClientRect((rect) => {
      if (rect) {
        this.setData({
          trackWidth: rect.width,
          trackLeft: rect.left
        });
      }
    }).exec();
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
        unitText = 'cal';
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
    
    // Calculate percentage
    const percentage = ((selectedValue - minValue) / (maxValue - minValue)) * 100;
    
    // Check empty state (if value is at minimum)
    const showEmptyHint = selectedValue === minValue;
    
    this.setData({
      minValue,
      maxValue,
      step,
      unitText,
      currentValue: selectedValue,
      sliderPercentage: Math.max(0, Math.min(100, percentage)),
      showEmptyHint
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    
    this.setData({
      activeTab: tab
    });
    
    this.updateCurrentValues();
  },

  // Slider Interactions
  onSliderStart(e) {
    this.setData({ isDragging: true });
    this.handleTouchMove(e);
  },

  onSliderMove(e) {
    if (!this.data.isDragging) return;
    this.handleTouchMove(e);
  },

  onSliderEnd(e) {
    this.setData({ isDragging: false });
    this.handleTouchEnd(e);
  },
  
  onSliderTap(e) {
    this.handleTouchEnd(e);
  },

  handleTouchMove(e) {
    const { trackWidth, trackLeft, minValue, maxValue } = this.data;
    if (!trackWidth) {
        this.getTrackDimensions(); // Try to get dimensions again if missing
        return;
    }
    
    const touchX = e.touches[0] ? e.touches[0].clientX : e.changedTouches[0].clientX;
    
    // Calculate percentage based on touch position (visual feedback only)
    let percentage = ((touchX - trackLeft) / trackWidth) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Only update visual position during dragging
    this.setData({
      sliderPercentage: percentage
    });
  },

  handleTouchEnd(e) {
    const { trackWidth, trackLeft, minValue, maxValue, step, activeTab, selectedValues } = this.data;
    if (!trackWidth) {
        this.getTrackDimensions(); // Try to get dimensions again if missing
        return;
    }
    
    const touchX = e.touches[0] ? e.touches[0].clientX : e.changedTouches[0].clientX;
    
    // Calculate percentage based on touch position
    let percentage = ((touchX - trackLeft) / trackWidth) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Calculate raw value
    let rawValue = minValue + (percentage / 100) * (maxValue - minValue);
    
    // Snap to step
    let steppedValue = Math.round(rawValue / step) * step;
    
    // Clamp value
    steppedValue = Math.max(minValue, Math.min(maxValue, steppedValue));
    
    // Handle floating point precision issues
    if (step < 1) {
        steppedValue = parseFloat(steppedValue.toFixed(1));
    } else {
        steppedValue = Math.round(steppedValue);
    }

    // Recalculate percentage for visual snap
    const finalPercentage = ((steppedValue - minValue) / (maxValue - minValue)) * 100;
    
    const showEmptyHint = steppedValue === minValue;

    // Update data only when finger is released
    this.setData({
      sliderPercentage: finalPercentage,
      currentValue: steppedValue,
      showEmptyHint,
      selectedValues: {
        ...selectedValues,
        [activeTab]: steppedValue
      }
    });
  },

  goBack() {
    ty.navigateBack();
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
