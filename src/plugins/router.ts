import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import Settings from '../components/Settings.vue';
import Terminal from '../components/Terminal.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Terminal',
    component: Terminal,
  },
  {
    path: '/terminal/:deviceId',
    name: 'Terminal',
    component: Terminal,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
