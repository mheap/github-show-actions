const objectScan = require("object-scan");
const yaml = require("js-yaml");

const findValueByKey = (data, targetKey) => {
  return objectScan(["**"], {
    rtn: "value",
    filterFn: ({ property }) => property == targetKey,
  })(data);
};

module.exports = function (contents) {
  // YAML decode
  const workflow = yaml.safeLoad(contents, "utf8");

  // Return versions
  const actions = findValueByKey(workflow, "uses");

  return actions;
};
