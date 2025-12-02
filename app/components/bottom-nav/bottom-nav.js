Component({
  properties: {
    activeTab: {
      type: String,
      value: 'home'
    }
  },
  methods: {
    onSwitchTab(e) {
      const { path, tab } = e.currentTarget.dataset;
      if (tab === this.data.activeTab) return;
      
      ty.redirectTo({
        url: path,
        fail: (err) => {
          console.log('Nav failed', err);
        }
      });
    }
  }
});
