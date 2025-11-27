import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Goal from '../views/Goal.vue'
import Exercise from '../views/Exercise.vue'
import History from '../views/History.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/goal',
    name: 'Goal',
    component: Goal
  },
  {
    path: '/exercise',
    name: 'Exercise',
    component: Exercise
  },
  {
    path: '/history',
    name: 'History',
    component: History
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

