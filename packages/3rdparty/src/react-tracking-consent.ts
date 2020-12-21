import { useEffect, useState } from "react";
import type { TrackingConsent } from "./tracking-consent";

export function useTrackingConsent(
    tc: TrackingConsent,
): TrackingConsent["response"]["status"] {
    const [state, setState] = useState<TrackingConsent["response"]["status"]>(
        tc.response.status,
    );

    useEffect(() => {
        // Event is always emitted when the reponses changes. This will be
        // emitted on other events too but React can detect the change from the
        // string and avoid useless rendering automatically
        return tc.onEvent(() => {
            setState(tc.response.status);
        });
    }, [tc]);

    return state;
}
