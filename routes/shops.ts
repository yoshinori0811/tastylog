import express = require("express");
const router = express.Router();
const { MYSQLClient, sql } = require("../lib/database/client");

router.get("/:id", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const id = req.params.id;

  Promise.all([
    MYSQLClient.executeQuery(
      await sql("SELECT_SHOP_DETAIL_BY_ID"), [id]
    ),
    MYSQLClient.executeQuery(
      await sql("SELECT_SHOP_REVIEW_BY_SHOP_ID"), [id]
    )
  ]).then((results) => {
    var data = results[0][0];
    data.reviews = results[1] || [];
    console.log("1 : " + data.reviews)
    res.render("./shops/index.ejs", data);
  })
  .catch((err) => {
    next(err);
  });
});
module.exports = router;
