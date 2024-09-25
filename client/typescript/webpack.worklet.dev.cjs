const { merge } = require("webpack-merge");
const common = require("./webpack.worklet.common.cjs");

const worklet = merge(common, {
    mode: "development",
});
module.exports = [worklet];
