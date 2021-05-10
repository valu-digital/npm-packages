// TypeScript works
const foo: any = {};

// Optional chaning and nullish coalescing works
const optchain = foo?.bar?.baz ?? "default";

declare const CHANGE_ME_WITH_DEFINE_PLUGIN: string;

console.log(CHANGE_ME_WITH_DEFINE_PLUGIN);

// Class fields work
class Foo {
    bar = "sadf";
}

function importThings() {
    return import(/* webpackChunkName: 'module' */ "./module");
}
