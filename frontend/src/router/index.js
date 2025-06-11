import { createRouter, createWebHistory } from 'vue-router'
import MenuView from '../views/MenuView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/LoginView.vue'),
    },
    {
      path: '/',
      name: 'Menu',
      component: MenuView,
      children: [
        // 0.首页
        {
          path: '',
          name: 'RedirectShow',
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
          path: '/flow/tenday-average',
          name: 'TendayAverageFlow',
          component: () => import('@/views/system-manage/TendayAverageFlow.vue'),
        },
        // 2.水务计算
        {
          path: '/elevation-storage-curve',
          name: 'ElevationStorageCurve',
          component: () => import('@/views/hydropower-plant-data/ElevationStorageCurve.vue'),
        },
        {
          path: '/elevation-discharge-curve',
          name: 'ElevationDischargeCurve',
          component: () => import('@/views/hydropower-plant-data/ElevationDischargeCurve.vue'),
        },
        {
          path: '/hydropower-plant-parameters',
          name: 'HydropowerPlantParameters',
          component: () => import('@/views/hydropower-plant-data/HydropowerPlantParameters.vue'),
        },
        {
          path: '/reservoir-characteristic-elevations',
          name: 'ReservoirCharacteristicElevations',
          component: () =>
            import('@/views/hydropower-plant-data/ReservoirCharacteristicElevations.vue'),
        },

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
