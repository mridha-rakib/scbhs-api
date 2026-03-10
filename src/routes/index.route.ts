import caseRouter from "@/modules/case/case.route";
import categoryRouter from "@/modules/category/category.route";
import dashboardRouter from "@/modules/dashboard/dashboard.route";
import meetingRouter from "@/modules/meeting/meeting.route";
import noteRouter from "@/modules/note/note.route";
import notificationRouter from "@/modules/notification/notification.route";
import resourceRouter from "@/modules/resource/resource.route";
import userRouter from "@/modules/user/user.route";
import { Router } from "express";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRouter,
  },
  {
    path: "/cases",
    route: caseRouter,
  },
  {
    path: "/categories",
    route: categoryRouter,
  },
  {
    path: "/notes",
    route: noteRouter,
  },
  {
    path: "/resources",
    route: resourceRouter,
  },
  {
    path: "/meetings",
    route: meetingRouter,
  },
  {
    path: "/dashboards",
    route: dashboardRouter,
  },
  {
    path: "/notifications",
    route: notificationRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
