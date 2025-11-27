<template>
  <div class="container">
    <div class="header">
      <div class="page-title">目标设置</div>
    </div>

    <div class="content">
      <!-- 目标类型选择 -->
      <div class="goal-type-section">
        <div class="section-label">目标类型</div>
        <div class="goal-type-cards">
          <div 
            class="goal-type-card" 
            :class="{ active: selectedType === 'distance' }"
            @click="selectType('distance')"
          >
            <div class="goal-type-icon">📏</div>
            <div class="goal-type-label">距离</div>
          </div>
          <div 
            class="goal-type-card" 
            :class="{ active: selectedType === 'time' }"
            @click="selectType('time')"
          >
            <div class="goal-type-icon">⏱️</div>
            <div class="goal-type-label">时间</div>
          </div>
          <div 
            class="goal-type-card" 
            :class="{ active: selectedType === 'calories' }"
            @click="selectType('calories')"
          >
            <div class="goal-type-icon">🔥</div>
            <div class="goal-type-label">卡路里</div>
          </div>
        </div>
      </div>

      <!-- 时间选择器 -->
      <div class="time-picker-section">
        <div class="section-label">目标时间</div>
        <div class="time-picker-container">
          <select v-model="selectedTime" class="time-select">
            <option value="今天">今天</option>
            <option value="明天">明天</option>
            <option value="本周">本周</option>
            <option value="本月">本月</option>
          </select>
        </div>
      </div>

      <!-- 目标值设置 -->
      <div class="value-section">
        <div class="section-label">目标值</div>
        <div class="value-input-container">
          <input 
            class="value-input" 
            type="number" 
            v-model="goalValue" 
            :placeholder="`请输入目标值`"
          />
          <span class="value-unit">{{ unit }}</span>
        </div>
      </div>

      <!-- 确认按钮 -->
      <div class="button-section">
        <button class="confirm-button" @click="confirmGoal">确认</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Goal',
  data() {
    return {
      selectedType: 'distance',
      goalValue: '',
      unit: '公里',
      selectedTime: '今天'
    }
  },
  methods: {
    selectType(type) {
      this.selectedType = type;
      if (type === 'time') {
        this.unit = '分钟';
      } else if (type === 'calories') {
        this.unit = '卡路里';
      } else {
        this.unit = '公里';
      }
    },
    confirmGoal() {
      if (!this.goalValue) {
        alert('请输入目标值');
        return;
      }
      alert('目标设置成功');
      this.$router.back();
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
}

.header {
  margin-bottom: 40px;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #FFFFFF;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-label {
  font-size: 16px;
  color: #8E8E93;
  margin-bottom: 16px;
  display: block;
}

.goal-type-section {
  margin-bottom: 24px;
}

.goal-type-cards {
  display: flex;
  gap: 16px;
}

.goal-type-card {
  flex: 1;
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
}

.goal-type-card.active {
  border-color: #4A90E2;
  background: linear-gradient(135deg, #1E3A5F 0%, #2A4A6F 100%);
}

.goal-type-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.goal-type-label {
  font-size: 16px;
  color: #FFFFFF;
}

.time-picker-section {
  margin-bottom: 24px;
}

.time-picker-container {
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.time-select {
  width: 100%;
  font-size: 20px;
  color: #FFFFFF;
  background: transparent;
  border: none;
  outline: none;
}

.value-section {
  margin-bottom: 24px;
}

.value-input-container {
  background: linear-gradient(135deg, #1A1D35 0%, #252840 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.value-input {
  flex: 1;
  font-size: 20px;
  color: #FFFFFF;
  background: transparent;
  border: none;
  outline: none;
}

.value-input::placeholder {
  color: #4A4A5A;
}

.value-unit {
  font-size: 16px;
  color: #8E8E93;
  margin-left: 12px;
}

.button-section {
  margin-top: 40px;
}

.confirm-button {
  width: 100%;
  height: 56px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  border-radius: 16px;
  border: none;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.4);
  cursor: pointer;
  transition: opacity 0.2s;
}

.confirm-button:active {
  opacity: 0.8;
}
</style>

