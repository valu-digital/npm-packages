// TypeScript works
const foo: any = {};

// Optional chaning and nullish coalescing works
const optchain = foo?.bar?.baz ?? "default";

// Class fields work
class Foo {
    bar = "sadf";
}

function importThings() {
    return import(/* webpackChunkName: 'module' */ "./module");
}
