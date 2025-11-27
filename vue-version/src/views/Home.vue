<template>
  <div class="container">
    <!-- 顶部状态栏 -->
    <div class="header">
      <div class="header-content">
        <div class="greeting">你好</div>
        <div class="username">用户</div>
      </div>
      <div class="avatar-container">
        <img class="avatar" src="/src/image/image_001.png" alt="avatar" />
      </div>
    </div>

    <!-- 今日数据卡片 -->
    <div class="data-section">
      <div class="section-title">今日数据</div>
      <div class="data-cards">
        <div class="data-card">
          <div class="card-icon">🚴</div>
          <div class="card-content">
            <span class="card-value">12.5</span>
            <span class="card-unit">公里</span>
          </div>
          <div class="card-label">总里程</div>
        </div>
        <div class="data-card">
          <div class="card-icon">⏱️</div>
          <div class="card-content">
            <span class="card-value">45</span>
            <span class="card-unit">分钟</span>
          </div>
          <div class="card-label">运动时长</div>
        </div>
        <div class="data-card">
          <div class="card-icon">🔥</div>
          <div class="card-content">
            <span class="card-value">320</span>
            <span class="card-unit">卡路里</span>
          </div>
          <div class="card-label">消耗热量</div>
        </div>
      </div>
    </div>

    <!-- 功能模块 -->
    <div class="function-section">
      <div class="section-title">功能</div>
      <div class="function-grid">
        <div class="function-item" @click="goToGoal">
          <div class="function-icon-wrapper">
            <span class="function-icon">🎯</span>
          </div>
          <div class="function-label">目标设置</div>
        </div>
        <div class="function-item" @click="goToExercise">
          <div class="function-icon-wrapper">
            <span class="function-icon">🚴</span>
          </div>
          <div class="function-label">开始运动</div>
        </div>
        <div class="function-item" @click="goToHistory">
          <div class="function-icon-wrapper">
            <span class="function-icon">📊</span>
          </div>
          <div class="function-label">历史记录</div>
        </div>
        <div class="function-item">
          <div class="function-icon-wrapper">
            <span class="function-icon">⚙️</span>
          </div>
          <div class="function-label">设置</div>
        </div>
      </div>
    </div>

    <!-- 本周统计 -->
    <div class="stats-section">
      <div class="section-title">本周统计</div>
      <div class="stats-card">
        <div class="stats-item">
          <span class="stats-label">总里程</span>
          <span class="stats-value">87.5 公里</span>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <span class="stats-label">运动天数</span>
          <span class="stats-value">5 天</span>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <span class="stats-label">平均速度</span>
          <span class="stats-value">18.5 km/h</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  methods: {
    goToGoal() {
      this.$router.push('/goal')
    },
    goToExercise() {
      this.$router.push('/exercise')
    },
    goToHistory() {
      this.$router.push('/history')
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header-content {
  display: flex;
  flex-direction: column;
}

.greeting {
  font-size: 16px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.username {
  font-size: 24px;
  font-weight: bold;
  color: #FFFFFF;
}

.avatar-container {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  overflow: hidden;
  border: 2px solid #4A90E2;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.data-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 20px;
}

.data-cards {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.data-card {
  flex: 1;
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.card-content {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #4A90E2;
}

.card-unit {
  font-size: 14px;
  color: #8E8E93;
  margin-left: 4px;
}

.card-label {
  font-size: 14px;
  color: #8E8E93;
}

.function-section {
  margin-bottom: 40px;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px;
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s;
}

.function-item:active {
  transform: scale(0.95);
}

.function-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.function-icon {
  font-size: 24px;
}

.function-label {
  font-size: 14px;
  color: #FFFFFF;
  text-align: center;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-card {
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.stats-label {
  font-size: 16px;
  color: #8E8E93;
}

.stats-value {
  font-size: 18px;
  font-weight: bold;
  color: #4A90E2;
}

.stats-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #2A2D45 50%, transparent 100%);
  margin: 8px 0;
}
</style>

