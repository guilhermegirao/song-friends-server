import { Router } from "express";
import MatchController from "../controllers/MatchController";
import AuthController from "../controllers/AuthController";
import authenticate from "../middlewares/auth";
import UserController from "../controllers/UserController";

const routes = Router();

routes.get("/login", AuthController.login);
routes.get("/login/callback", AuthController.loginCallback);

routes.get("/match/:id", authenticate, MatchController.findById);
routes.delete("/match/:id", authenticate, MatchController.delete);
routes.post("/match", authenticate, MatchController.create);
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

export default routes;
