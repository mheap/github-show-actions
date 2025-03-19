import objectScan from "object-scan";
import yaml from "js-yaml";

const findValueByKey = (data, targetKey) => {
  return objectScan(["**"], {
    rtn: "value",
    filterFn: ({ property }) => property == targetKey,
  })(data);
};

export default function (contents) {
  // YAML decode
  const workflow = yaml.load(contents, "utf8");

  // Return versions
  const actions = findValueByKey(workflow, "uses");

  return actions;
};
