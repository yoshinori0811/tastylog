"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const { MYSQLClient, sql } = require("../lib/database/client");
router.get("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    Promise.all([
        MYSQLClient.executeQuery(yield sql("SELECT_SHOP_DETAIL_BY_ID"), [id]),
        MYSQLClient.executeQuery(yield sql("SELECT_SHOP_REVIEW_BY_SHOP_ID"), [id])
    ]).then((results) => {
        var data = results[0][0];
        data.reviews = results[1] || [];
        console.log("1 : " + data.reviews);
        res.render("./shops/index.ejs", data);
    })
        .catch((err) => {
        next(err);
    });
}));
module.exports = router;
