const {execSync} = require("child_process");
const sh = require("sh-thunk");
const fs = require("fs");

const webpack = __dirname + "/../node_modules/.bin/webpack";

beforeEach(sh({stdio: null})`rm -rf __tests__/fixtures/*/dist/`);

test("can render template", () => {
    execSync(`${webpack} --mode production`, {
        cwd: __dirname + "/fixtures/template",
    });

    const files = fs.readdirSync(__dirname + "/fixtures/template/dist");

    expect(files).toEqual([
        "main.js",
        "main.js.map",
        "manifest.json",
        "out.php",
    ]);

    const out = fs
        .readFileSync(__dirname + "/fixtures/template/dist/out.php")
        .toString();

    expect(out).toMatchSnapshot();
});
