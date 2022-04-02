// テンプレートエンジンに独自関数を渡し使用できるようにする

const roundTo = require("round-to")

// 少数第二位以下を0にする関数
var padding = function(value: string) {
  if(isNaN(parseFloat(value))) {
    return "-";
  }

  return roundTo(value, 2).toPrecision(3);
}

var round = function(value: string) {
  return roundTo(value, 2);
}



module.exports = {
  padding,
  round
}
