import { useCallback, useEffect, useRef } from "react";

export interface SingleElementObserverOptions {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    active?: boolean;
    unsupported?: "call" | "ignore";
}

export interface OnIntersect {
    (el: HTMLElement): any;
}

/**
 * Single react hook can only listen one element at the time. This class handles
 * unobserving automatically when new element is added.
 */
class SingleElementObserver {
    observer?: IntersectionObserver;
    el?: HTMLElement;
    cb?: OnIntersect;
    unsupported: NonNullable<SingleElementObserverOptions["unsupported"]>;

    constructor(options: SingleElementObserverOptions) {
        this.unsupported = options.unsupported || "call";

        if (typeof IntersectionObserver === "undefined") {
            return;
        }

        if (options.active === false) {
            return;
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                // Only one listener at once so this is enough
                if (!entries[0]?.isIntersecting) {
                    return;
                }

                if (this.cb && this.el) {
                    this.cb(this.el);
                }
            },
            {
                threshold: options.threshold,
                root: options.root,
                rootMargin: options.rootMargin,
            },
        );
    }

    listen(cb: OnIntersect) {
        this.cb = cb;
    }

    observe(el: HTMLElement | null) {
        if (el && this.el === el) {
            return;
        }

        // Remove previous observed element
        this.unobserve();

        if (!el) {
            return;
        }

        this.el = el;

        if (this.observer) {
            this.observer.observe(el);
        } else {
            if (this.unsupported === "call" && this.cb) {
                this.cb(el);
            }
        }
    }

    unobserve() {
        if (this.el) {
            this.observer?.unobserve(this.el);
        }
    }
}

export function useIntersectionObserver(
    cb: OnIntersect,
    options: SingleElementObserverOptions = {},
) {
    const ref = useRef<SingleElementObserver>();
    const elRef = useRef<HTMLElement | null>(null);
    const callRef = useRef(cb);
    callRef.current = cb;

    useEffect(() => {
        ref.current = new SingleElementObserver({
            threshold: options.threshold,
            rootMargin: options.rootMargin,
            root: options.root,
            active: options.active,
        });

        ref.current.listen(callRef.current);
        ref.current.observe(elRef.current);

        return () => {
            ref.current?.unobserve();
        };
    }, [options.root, options.rootMargin, options.threshold, options.active]);

    return useCallback((el: HTMLElement | null) => {
        elRef.current = el;
        ref.current?.observe(el);
    }, []);
}
