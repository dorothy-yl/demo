<template>
  <div class="container">
    <!-- 顶部信息 -->
    <div class="top-info">
      <div class="exercise-title">骑行中</div>
      <div class="exercise-time">{{ formattedTime }}</div>
    </div>

    <!-- 仪表盘 -->
    <div class="dashboard">
      <!-- 速度仪表盘 -->
      <div class="speed-gauge">
        <div class="gauge-circle">
          <div class="gauge-value">{{ speed }}</div>
          <div class="gauge-unit">km/h</div>
        </div>
        <div class="gauge-label">速度</div>
      </div>

      <!-- 数据卡片 -->
      <div class="data-grid">
        <div class="data-item">
          <div class="data-value">{{ distance }}</div>
          <div class="data-unit">公里</div>
          <div class="data-label">距离</div>
        </div>
        <div class="data-item">
          <div class="data-value">{{ calories }}</div>
          <div class="data-unit">卡路里</div>
          <div class="data-label">消耗</div>
        </div>
        <div class="data-item">
          <div class="data-value">{{ heartRate }}</div>
          <div class="data-unit">bpm</div>
          <div class="data-label">心率</div>
        </div>
        <div class="data-item">
          <div class="data-value">{{ avgSpeed }}</div>
          <div class="data-unit">km/h</div>
          <div class="data-label">平均速度</div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <button 
        class="control-button pause-button" 
        :class="{ resume: isPaused }"
        @click="togglePause"
      >
        {{ isPaused ? '继续' : '暂停' }}
      </button>
      <button class="control-button stop-button" @click="stopExercise">结束</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Exercise',
  data() {
    return {
      isPaused: false,
      elapsedTime: 0,
      speed: 18.5,
      distance: 0,
      calories: 0,
      heartRate: 120,
      avgSpeed: 0
    }
  },
  computed: {
    formattedTime() {
      return this.formatTime(this.elapsedTime);
    }
  },
  mounted() {
    this.startTimer();
  },
  beforeUnmount() {
    this.stopTimer();
  },
  methods: {
    formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    startTimer() {
      this.timer = setInterval(() => {
        if (!this.isPaused) {
          this.elapsedTime += 1;
          this.distance = ((this.elapsedTime / 60) * (this.speed / 60)).toFixed(2);
          this.calories = Math.floor(this.distance * 25);
          this.avgSpeed = this.distance > 0 ? (this.distance / (this.elapsedTime / 60)).toFixed(1) : 0;
          this.speed = (18 + Math.random() * 2).toFixed(1);
        }
      }, 1000);
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    togglePause() {
      this.isPaused = !this.isPaused;
    },
    stopExercise() {
      if (confirm('确定要结束本次运动吗？')) {
        this.stopTimer();
        this.$router.back();
      }
    }
  }
}
</script>

<style scoped>
.container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #0A0E27 0%, #1A1D35 100%);
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.top-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.exercise-title {
  font-size: 24px;
  color: #FFFFFF;
  margin-bottom: 8px;
}

.exercise-time {
  font-size: 48px;
  font-weight: bold;
  color: #4A90E2;
  font-variant-numeric: tabular-nums;
}

.dashboard {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.speed-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60px;
}

.gauge-circle {
  width: 200px;
  height: 200px;
  border-radius: 100px;
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border: 8px solid #4A90E2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(74, 144, 226, 0.3);
  margin-bottom: 16px;
}

.gauge-value {
  font-size: 48px;
  font-weight: bold;
  color: #4A90E2;
  font-variant-numeric: tabular-nums;
}

.gauge-unit {
  font-size: 16px;
  color: #8E8E93;
  margin-top: 4px;
}

.gauge-label {
  font-size: 18px;
  color: #FFFFFF;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
}

.data-item {
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.data-value {
  font-size: 32px;
  font-weight: bold;
  color: #4A90E2;
  font-variant-numeric: tabular-nums;
}

.data-unit {
  font-size: 14px;
  color: #8E8E93;
  margin-top: 4px;
}

.data-label {
  font-size: 14px;
  color: #8E8E93;
  margin-top: 8px;
}

.controls {
  width: 100%;
  display: flex;
  gap: 16px;
  margin-top: 40px;
  padding-bottom: 40px;
}

.control-button {
  flex: 1;
  height: 56px;
  border-radius: 16px;
  border: none;
  font-size: 18px;
  font-weight: bold;
  color: #FFFFFF;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pause-button {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.4);
}

.pause-button.resume {
  background: linear-gradient(135deg, #52C41A 0%, #389E0D 100%);
  box-shadow: 0 4px 16px rgba(82, 196, 26, 0.4);
}

.stop-button {
  background: linear-gradient(135deg, #FF4D4F 0%, #CF1322 100%);
  box-shadow: 0 4px 16px rgba(255, 77, 79, 0.4);
}

.control-button:active {
  opacity: 0.8;
}
</style>

