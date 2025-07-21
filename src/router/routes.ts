import { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
  },
  // {
  //   path: "/test",
  //   name: "Test",
  //   component: () => import("@/views/TestView.vue"),
  // },
  {
    path: "/:catchAll(.*)",
    name: "All",
    component: () => import("@/views/NotFoundView.vue"),
  },
];

export default routes;
