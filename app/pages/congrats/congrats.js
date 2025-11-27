Page({
  data: {
    userName: 'Dkkd',
    date: '2025/09/12',
    caloriesBurned: 128,
    duration: '00:01:36',
    rpm: '11.23',
    avgSpeed: '1.3',
    secondaryCalories: 15,
    distance: '0.7'
  },
  onLoad() {
    // No dynamic data loading needed for this static demo
  },
  goBack() {
    ty.navigateBack();
  }
});
