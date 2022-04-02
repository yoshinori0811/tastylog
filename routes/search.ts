import express = require("express");
const router = express.Router();
const { MYSQLClient, sql } = require("../lib/database/client");
const MAX_ITEMS_PER_PAGE = require("../config/application.config").search.MAX_ITEMS_PER_PAGE;

router.get("/", async (req, res, next) => {
  let queryPage = req.query.page as string;
  let page = queryPage ? parseInt(queryPage) : 1;
  var keyword = req.query.keyword || "";
  var count, results;

  try {
    if (keyword) {
      count = (await MYSQLClient.executeQuery(await sql("COUNT_SHOP_BY_NAME"), [`%${keyword}%`]))[0].count;
      results = await MYSQLClient.executeQuery(await sql("SELECT_SHOP_LIST_BY_NAME"), [`%${keyword}%`, (page - 1) * MAX_ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE]);
    } else {
      count = MAX_ITEMS_PER_PAGE;
      results = await MYSQLClient.executeQuery(await sql("SELECT_SHOP_HIGH_SCORE_LIST"), [MAX_ITEMS_PER_PAGE]);
    }

    res.render("./search/list.ejs", { keyword, results, count, pagenation: { max: Math.ceil(count / MAX_ITEMS_PER_PAGE), current: page } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
