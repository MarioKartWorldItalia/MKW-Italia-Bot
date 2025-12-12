import { init, LDClient, LDContext } from "@launchdarkly/node-server-sdk";
import { Globals } from "../globals";
import { assertCond } from "../assert";
import { log } from "../log";
import { FeatureFlagKeys } from "./feature_flag_keys"

export class FeatureFlagError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FeatureFlagError";
    }
}

export class FeatureFlagsManager {
    private static readonly CTX = { key: "user" } as LDContext;

    private client: LDClient;
    private static instance: FeatureFlagsManager;

    public constructor() {
        if (FeatureFlagsManager.instance !== undefined) {
            throw new FeatureFlagError("FeatureFlagsManager instance already exists");
        };
        this.client = init(Globals.FEATURE_FLAGS_SDK_KEY);
        FeatureFlagsManager.instance = this;
    }

    public async waitForInitialization(): Promise<void> {
        await this.client.waitForInitialization();
        log("Feature Flags SDK initialized");
    }

    /**
     * Retrieves a boolean feature flag value, if defaultVal is not provided, throws an error if the flag is not found
     * @param key Feature flag key
     * @param defaultVal Default optional value
     * @returns A promise that resolves to the boolean value of the specified feature flag.
     */
    public static async getBooleanValueFor(key: FeatureFlagKeys, defaultVal?: boolean): Promise<boolean> {
        let _instance = FeatureFlagsManager.instance;
        assertCond(_instance !== undefined, "FeatureFlagsManager instance is not initialized");
        
        if (defaultVal !== undefined) {
            return await _instance.client.variation(key, FeatureFlagsManager.CTX, defaultVal);
        }
        else {
            let val = await _instance.client.boolVariationDetail(key, FeatureFlagsManager.CTX, false);
            if (val.variationIndex === null) {
                throw new FeatureFlagError("Feature flag generic error");
            }
            return val.value;
        }
    }
}