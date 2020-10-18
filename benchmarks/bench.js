const Benchmark = require("benchmark");
const { default: FastFs } = require("../");
const fs = require("fs");

var suite = new Benchmark.Suite();

suite.add("fastfs#write", async function () {
  let fastfs = FastFs("benchmark_file.txt");
  fastfs.write("sample");
});

suite.add("writeFileSync#write", async function () {
  fs.writeFileSync("benchmark_file.txt", "sample");
});

suite.on("cycle", function (event) {
  console.log(String(event.target));
});

suite.run();
