"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { authenticate, authorize, PRIVILEGE } = require("../lib/security/accesscontrol");
// authorize() で正しい値入れてもログインできない authorize(PRIVILEGE.NORMAL), 
router.get("/", (req, res) => {
    res.render("./account/index.ejs");
});
router.get("/login", (req, res) => {
    res.render("./account/login.ejs", { message: req.flash("message") });
});
router.post("/login", authenticate());
router.post("/logout", (req, res) => {
    req.logout();
    res.redirect("/account/login");
});
router.use("/reviews", authorize(PRIVILEGE.NORMAL), require("./account.reviews"));
module.exports = router;
