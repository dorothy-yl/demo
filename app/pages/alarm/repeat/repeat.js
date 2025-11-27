Page({
  data: {
    days: [
      { id: 0, name: '每周日', selected: false },
      { id: 1, name: '每周一', selected: false },
      { id: 2, name: '每周二', selected: false },
      { id: 3, name: '每周三', selected: false },
      { id: 4, name: '每周四', selected: false },
      { id: 5, name: '每周五', selected: false },
      { id: 6, name: '每周六', selected: false },
    ]
  },

  onLoad() {
    const currentRepeat = ty.getStorageSync('current_repeat_days') || [];
    const days = this.data.days.map(d => ({
      ...d,
      selected: currentRepeat.includes(d.id)
    }));
    this.setData({ days });
  },

  toggleDay(e) {
    const id = e.currentTarget.dataset.id;
    const days = this.data.days.map(d => {
      if (d.id === id) {
        return { ...d, selected: !d.selected };
      }
      return d;
    });
    this.setData({ days });
  },

  onUnload() {
    const selectedDays = this.data.days
      .filter(d => d.selected)
      .map(d => d.id);
    ty.setStorageSync('temp_repeat_days', selectedDays);
  },

  onBack() {
    ty.navigateBack();
  }
});

