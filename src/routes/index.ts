import { Router } from "express";
import MatchController from "../controllers/MatchController";
import AuthController from "../controllers/AuthController";
import authenticate from "../middlewares/auth";
import UserController from "../controllers/UserController";
import MessageController from "../controllers/MessageController";

const routes = Router();

routes.get("/login", AuthController.login);
routes.get("/login/callback", AuthController.loginCallback);
routes.post("/login/guest", AuthController.loginGuest);
routes.post("/register/guest", AuthController.createGuest);

routes.get(
  "/match/:id/find/by/user-logged",
  authenticate,
  MatchController.findByIdUserLogged
);
routes.post("/match/decline", authenticate, MatchController.declineSuggestion);
routes.get(
  "/matches/find/by/user-logged",
  authenticate,
  MatchController.findByUserLogged
);

routes.get(
  "/users/find/by/suggestions",
  authenticate,
  UserController.findSuggestions
);
routes.get("/users/find/:id", authenticate, UserController.findById);
routes.get(
  "/users/find/by/user-logged",
  authenticate,
  UserController.findByUserLogged
);

routes.get(
  "/messages/find/by/match/:match",
  authenticate,
  MessageController.findMessagesByMatch
);
export default routes;
