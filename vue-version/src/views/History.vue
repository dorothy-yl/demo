<template>
  <div class="container">
    <div class="header">
      <div class="page-title">历史记录</div>
    </div>

    <!-- 统计图表区域 -->
    <div class="chart-section">
      <div class="chart-card">
        <div class="chart-title">本周运动统计</div>
        <div class="chart-container">
          <div class="chart-bars">
            <div class="chart-bar-item" v-for="item in weekData" :key="item.day">
              <div class="bar-wrapper">
                <div class="bar" :style="{ height: item.height + '%' }"></div>
              </div>
              <div class="bar-label">{{ item.day }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录列表 -->
    <div class="list-section">
      <div class="list-header">
        <div class="list-title">运动记录</div>
        <div class="list-count">共 {{ recordList.length }} 条</div>
      </div>
      <div class="record-list">
        <div 
          class="record-item" 
          v-for="item in recordList" 
          :key="item.id"
          @click="viewDetail(item.id)"
        >
          <div class="record-left">
            <div class="record-icon">🚴</div>
            <div class="record-info">
              <div class="record-date">{{ item.date }}</div>
              <div class="record-time">{{ item.time }}</div>
            </div>
          </div>
          <div class="record-right">
            <div class="record-stats">
              <div class="record-stat-item">{{ item.distance }} 公里</div>
              <div class="record-stat-item">{{ item.duration }} 分钟</div>
              <div class="record-stat-item">{{ item.calories }} 卡</div>
            </div>
            <div class="record-arrow">›</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'History',
  data() {
    return {
      weekData: [
        { day: '周一', height: 60 },
        { day: '周二', height: 80 },
        { day: '周三', height: 45 },
        { day: '周四', height: 90 },
        { day: '周五', height: 70 },
        { day: '周六', height: 100 },
        { day: '周日', height: 55 }
      ],
      recordList: [
        {
          id: 1,
          date: '2024-11-26',
          time: '14:30 - 15:15',
          distance: 12.5,
          duration: 45,
          calories: 320
        },
        {
          id: 2,
          date: '2024-11-25',
          time: '09:00 - 09:50',
          distance: 15.2,
          duration: 50,
          calories: 380
        },
        {
          id: 3,
          date: '2024-11-24',
          time: '18:20 - 19:05',
          distance: 10.8,
          duration: 45,
          calories: 270
        },
        {
          id: 4,
          date: '2024-11-23',
          time: '16:00 - 16:55',
          distance: 18.3,
          duration: 55,
          calories: 460
        },
        {
          id: 5,
          date: '2024-11-22',
          time: '07:30 - 08:20',
          distance: 13.7,
          duration: 50,
          calories: 340
        },
        {
          id: 6,
          date: '2024-11-21',
          time: '19:10 - 20:00',
          distance: 14.9,
          duration: 50,
          calories: 370
        }
      ]
    }
  },
  methods: {
    viewDetail(id) {
      console.log('View detail for record:', id);
    }
  }
}
</script>

<style scoped>
.container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #0A0E27 0%, #1A1D35 100%);
  padding: 40px 20px 100px;
}

.header {
  margin-bottom: 40px;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #FFFFFF;
}

.chart-section {
  margin-bottom: 40px;
}

.chart-card {
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 24px;
  display: block;
}

.chart-container {
  width: 100%;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
}

.chart-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 8px;
}

.bar {
  width: 80%;
  background: linear-gradient(180deg, #4A90E2 0%, #357ABD 100%);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: all 0.3s;
}

.bar-label {
  font-size: 12px;
  color: #8E8E93;
}

.list-section {
  margin-bottom: 40px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-title {
  font-size: 20px;
  font-weight: bold;
  color: #FFFFFF;
}

.list-count {
  font-size: 14px;
  color: #8E8E93;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s;
}

.record-item:active {
  transform: scale(0.98);
}

.record-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.record-icon {
  font-size: 32px;
  margin-right: 16px;
}

.record-info {
  display: flex;
  flex-direction: column;
}

.record-date {
  font-size: 16px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 4px;
}

.record-time {
  font-size: 14px;
  color: #8E8E93;
}

.record-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.record-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.record-stat-item {
  font-size: 14px;
  color: #4A90E2;
}

.record-arrow {
  font-size: 24px;
  color: #8E8E93;
}
</style>

