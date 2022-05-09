import {
    assertNotNil,
    assertIs,
    notNil,
    is,
    assertNotAny,
    assertType,
} from "../src";

describe("assertNotNil()", () => {
    test("asserts null", () => {
        (value: string | null) => {
            // @ts-expect-error
            value.toLowerCase();

            assertNotNil(value);

            value.toLowerCase();

            const Str: string = value;

            // @ts-expect-error
            const Null: null = value;
        };
    });

    test("asserts undefined", () => {
        const value: string | undefined = undefined;
        (value: string | undefined) => {
            // @ts-expect-error
            value.toLowerCase();

            assertNotNil(value);

            value.toLowerCase();

            const Str: string = value;

            // @ts-expect-error
            const Undefined: undefined = value;
        };
    });

    test("does not assert false", () => {
        const value: string | undefined = undefined;
        (value: string | false) => {
            // @ts-expect-error
            value.toLowerCase();

            assertNotNil(value);

            // @ts-expect-error
            value.toLowerCase();
        };
    });

    test("throws on null", () => {
        expect(() => {
            assertNotNil(null);
        }).toThrow("[@valu/assert notNil] Unexpeted null");
    });

    test("throws on undefined", () => {
        expect(() => {
            assertNotNil(undefined);
        }).toThrow("[@valu/assert notNil] Unexpeted undefined");
    });

    test("can use custom error message", () => {
        expect(() => {
            assertNotNil(undefined, "My message");
        }).toThrow("[@valu/assert notNil] My message");
    });

    test("does not throw on non null | undefined values", () => {
        assertNotNil(false);
        assertNotNil(true);
        assertNotNil("");
        assertNotNil("");
        assertNotNil("0");
        assertNotNil(0);
        assertNotNil({});
        assertNotNil([]);
        assertNotNil(NaN);
    });
});

describe("assertValue()", () => {
    test("assert null", () => {
        (value: string | true | false | undefined) => {
            assertIs(value, undefined);

            const Undefined: undefined = value;

            // @ts-expect-error
            const Null: null = value;

            // @ts-expect-error
            const False: false = value;

            // @ts-expect-error
            const True: true = value;

            // @ts-expect-error
            const Str: string = value;
        };
    });
    test("assert false", () => {
        (value: string | true | false) => {
            assertIs(value, false as const);

            const False: false = value;

            // @ts-expect-error
            const True: true = value;

            // @ts-expect-error
            const Str: string = value;
        };
    });

    test("assert false from boolean", () => {
        (value: string | boolean) => {
            assertIs(value, false as const);

            const False: false = value;

            // @ts-expect-error
            const True: true = value;

            // @ts-expect-error
            const Str: string = value;
        };
    });

    test("assert true", () => {
        (value: string | true | false) => {
            assertIs(value, true as const);

            const True: true = value;

            // @ts-expect-error
            const False: false = value;

            // @ts-expect-error
            const Str: string = value;
        };
    });

    test("assert string literal", () => {
        (value: string | true | false) => {
            assertIs(value, "lit" as const);

            // @ts-expect-error
            const True: true = value;

            // @ts-expect-error
            const False: false = value;

            // @ts-expect-error
            const OtherLireal: "other" = value;

            const Str: string = value;
        };
    });

    test("run times asserts ok", () => {
        assertIs("", "");
        assertIs(true, true);
        assertIs(false, false);
        assertIs(null, null);
        assertIs(undefined, undefined);
    });

    test("throws on non match", () => {
        expect(() => {
            assertIs(false, true);
        }).toThrow("[@valu/assert Value] false !== true");

        expect(() => {
            assertIs({}, undefined);
        }).toThrow("[@valu/assert Value] [object Object] !== undefined");

        expect(() => {
            assertIs(null, undefined);
        }).toThrow("[@valu/assert Value] null !== undefined");

        expect(() => {
            assertIs(null, undefined, "custom");
        }).toThrow("[@valu/assert Value] custom");
    });
});

describe("notNil()", () => {
    test("can remove null and undefined from array with filter", () => {
        type Ob = { foo: string } | null | undefined;
        const list: Ob[] = [null, { foo: "ok" }, undefined];

        const newList = list.filter(notNil).map((value) => {
            return value.foo;
        });

        expect(newList).toEqual(["ok"]);
    });
});

describe("is()", () => {
    test("can guard false", () => {
        const fn = (value: string | true | false) => {
            if (is(value, true as const)) {
                // @ts-expect-error
                const False: false = value;
                return true;
            } else {
                return false;
            }
        };
    });
});

// assertNotAny tests
() => {
    const ding: any = 1;

    // @ts-expect-error
    assertNotAny(ding);

    const num = 1;
    assertNotAny(num);
};

// assertTypeTests
() => {
    const ding: string = "ding";

    // @ts-expect-error
    assertType<number>(ding);

    // @ts-expect-error
    assertType<"ding">("dong");

    // ok
    assertType<string>("dong");
};
