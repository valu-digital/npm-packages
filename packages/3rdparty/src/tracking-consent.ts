const STATUSES = ["not-given", "declined", "consented"] as const;

interface ConsentResponse {
    status: typeof STATUSES[number];
    date: string | undefined;
}

type AsAny<T> = {
    [P in keyof T]?: any;
};

type TrackingConsentEvent =
    | "request-prompt"
    | "consented"
    | "declined"
    | "forget"
    | "init";

export interface TrackingConsentEventHandler {
    (event: TrackingConsentEvent): undefined | void | Promise<any>;
}

let debug = (..._args: any[]) => {};

if (
    typeof window !== "undefined" &&
    window.localStorage.valuTrackingConsentDebug
) {
    debug = (...args: any[]) => {
        console.log("[ValuTrackingConsent]", ...args);
    };
}

export class TrackingConsent {
    response: ConsentResponse;

    storeKey: string;

    eventHandlers: TrackingConsentEventHandler[];

    constructor(options?: { key?: string }) {
        this.eventHandlers = [];
        this.storeKey = options?.key ?? "valu-tracking-response";
        this.response = {
            status: "not-given",
            date: undefined,
        };

        this.read();
    }

    init() {
        this.emit("init");

        if (typeof window !== "undefined") {
            // _vlu3rdtc = "valu 3rdparty tracking consent"
            const implicitStatus = /_vlu3rdtc=(decline|consent)/.exec(
                location.search,
            )?.[1];
            const date = new Date().toISOString();

            if (implicitStatus === "consent") {
                this.response = {
                    status: "consented",
                    date,
                };
            } else if (implicitStatus === "decline") {
                this.response = {
                    status: "declined",
                    date,
                };
            }

            if (implicitStatus) {
                console.warn(
                    "[@valu/3rdparty] Using implicit consent response from qs",
                    this.response,
                );
            }
        }

        if (this.response.status === "not-given") {
            this.showPrompt();
        }

        if (this.response.status === "consented") {
            this.emit("consented");
        } else if (this.response.status === "declined") {
            this.emit("declined");
        }

        this.sendGTMDatalayerEvent();
    }

    sendGTMDatalayerEvent() {
        if (typeof window === "undefined") {
            return;
        }
        const anyWindow = window as any;

        const dl: { event?: string; valuTrackingResponse?: string }[] =
            anyWindow.dataLayer ?? [];
        // create one if it did not exists
        anyWindow.dataLayer = dl;

        dl.push({ valuTrackingResponse: this.response.status });
        dl.push({ event: "valu-tracking-response-" + this.response.status });
    }

    setStatus(status: ConsentResponse["status"]) {
        this.response = {
            status,
            date: new Date().toISOString(),
        };
        this.save();
    }

    consent() {
        if (this.response.status === "consented") {
            return;
        }

        debug("Got tracking consent");
        this.setStatus("consented");
        this.emit("consented");
        this.sendGTMDatalayerEvent();
    }

    decline() {
        if (this.response.status === "declined") {
            return;
        }

        debug("Declined consent");
        this.response = {
            status: "declined",
            date: new Date().toISOString(),
        };
        this.save();
        this.emit("declined");
        this.sendGTMDatalayerEvent();
    }

    forget() {
        debug("Forget consent");
        this.response = {
            status: "not-given",
            date: undefined,
        };
        console.log('forget: this.response', this.response );
        this.save();
        return this.emitPromise("forget").then(() => {
            this.showPrompt();
        });
    }

    emit(event: TrackingConsentEvent) {
        debug(`Event: ${event}`);
        void this.emitPromise(event);
    }

    emitPromise(event: TrackingConsentEvent) {
        return Promise.all(this.eventHandlers.map((fn) => fn(event)));
    }

    onEvent(cb: TrackingConsentEventHandler) {
        this.eventHandlers.push(cb);
        return () => {
            this.off(cb);
        };
    }

    off(cb: TrackingConsentEventHandler) {
        const index = this.eventHandlers.findIndex((f) => f === cb);
        this.eventHandlers.splice(index, 1);
    }

    showPrompt() {
        this.emit("request-prompt");
    }

    read() {
        if (typeof window === "undefined") {
            return;
        }

        const raw = window.localStorage.getItem(this.storeKey) ?? "{}";

        let data: AsAny<ConsentResponse> = {};

        try {
            data = JSON.parse(raw);
        } catch {}

        if (data.status && STATUSES.includes(data.status)) {
            this.response.status = data.status;
        }

        if (data.date) {
            this.response.date = data.date;
        }
    }

    save() {
        if (typeof window === "undefined") {
            return;
        }

        console.log('save: this.response', this.response );

        window.localStorage.setItem(
            this.storeKey,
            JSON.stringify(this.response),
        );
    }

    static instance: TrackingConsent | undefined;

    static getSingleton() {
        if (!TrackingConsent.instance) {
            TrackingConsent.instance = new TrackingConsent();
        }

        return TrackingConsent.instance;
    }
}
