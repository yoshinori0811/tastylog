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
const MAX_ITEMS_PER_PAGE = require("../config/application.config").search.MAX_ITEMS_PER_PAGE;
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let queryPage = req.query.page;
    let page = queryPage ? parseInt(queryPage) : 1;
    var keyword = req.query.keyword || "";
    var count, results;
    try {
        if (keyword) {
            count = (yield MYSQLClient.executeQuery(yield sql("COUNT_SHOP_BY_NAME"), [`%${keyword}%`]))[0].count;
            results = yield MYSQLClient.executeQuery(yield sql("SELECT_SHOP_LIST_BY_NAME"), [`%${keyword}%`, (page - 1) * MAX_ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE]);
        }
        else {
            count = MAX_ITEMS_PER_PAGE;
            results = yield MYSQLClient.executeQuery(yield sql("SELECT_SHOP_HIGH_SCORE_LIST"), [MAX_ITEMS_PER_PAGE]);
        }
        res.render("./search/list.ejs", { keyword, results, count, pagenation: { max: Math.ceil(count / MAX_ITEMS_PER_PAGE), current: page } });
    }
    catch (err) {
        next(err);
    }
}));
module.exports = router;
