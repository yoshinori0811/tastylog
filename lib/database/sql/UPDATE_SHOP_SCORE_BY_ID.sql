UPDATE
  t_shop
SET
  socre = (
    SELECT
      ROUND(AVG(score), 2)
    FROM
      t_review
    WHERE shop_id = ?
  )
WHERE
  id = ?
