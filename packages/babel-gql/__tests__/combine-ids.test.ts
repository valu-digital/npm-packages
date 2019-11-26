import { combinedIds } from "../src/shared";

test("single", () => {
    expect(combinedIds(["foo"])).toEqual("foo");
});

test("two", () => {
    expect(combinedIds(["aaaa", "bbbb"])).toEqual("aabb");
});

test("three", () => {
    expect(
        combinedIds([
            "aaaaaaaaaaaaaaaaaaaaaaa",
            "bbbbbbbbbbbbbbbbbbbbbbb",
            "ccccccccccccccccccccccc",
        ]),
    ).toEqual("aaaaaaabbbbbbbccccccc");
});

test("order is static", () => {
    expect(
        combinedIds([
            "aaaaaaaaaaaaaaaaaaaaaaa",
            "ccccccccccccccccccccccc",
            "bbbbbbbbbbbbbbbbbbbbbbb",
        ]),
    ).toEqual("aaaaaaabbbbbbbccccccc");
});

test("but first is first always", () => {
    expect(
        combinedIds([
            "ccccccccccccccccccccccc",
            "bbbbbbbbbbbbbbbbbbbbbbb",
            "aaaaaaaaaaaaaaaaaaaaaaa",
        ]),
    ).toEqual("cccccccaaaaaaabbbbbbb");
});
