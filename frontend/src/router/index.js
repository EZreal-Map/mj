import { createRouter, createWebHistory } from 'vue-router'
import MenuView from '../views/MenuView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Menu',
      component: MenuView,
      children: [
        // 0.首页
        {
          path: '',
          redirect: '/show', // 访问 / 会自动跳转到 /show
        },
        {
          path: 'show',
          name: 'Show',
          component: () => import('../views/home-page/CesiumCalculateShow.vue'),
        },
        // 1.系统管理
        {
          path: 'evaporation',
          name: 'Evaporation',
          component: () => import('../views/system-manage/EvaporationView.vue'),
        },
        {
          path: '/flow/daily-average',
          name: 'DailyAverageFlow',
          component: () => import('@/views/system-manage/DailyAverageFlow.vue'),
        },
        {
          path: '/flow/monthly-average',
          name: 'MonthlyAverageFlow',
          component: () => import('@/views/system-manage/MonthlyAverageFlow.vue'),
        },
        {
          path: '/flow/ten-day-average',
          name: 'TenDayAverageFlow',
          component: () => import('@/views/system-manage/TenDayAverageFlow.vue'),
        },
        // 2.水务计算

        // 7.方案管理
        {
          path: '/swmm-edit',
          name: 'SwmmEdit',
          component: () => import('@/views/plan-manage/SwmmEditView.vue'),
        },
      ],
    },
  ],
})

export default router
