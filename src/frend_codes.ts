import { User } from "discord.js";
import { Application } from "./application";
import { log } from "./log";

const FC_COLLECTION = "friend_codes";

export class InvalidFriendCode extends Error { }

export enum FriendCodeResult {
    OK,
    NOT_PRESENT,
}

class CorrectedFriendCode {
    public isValid: boolean;
    public correctedCode: string;

    public constructor(isValid: boolean, correctedCode: string) {
        this.isValid = isValid;
        this.correctedCode = correctedCode;
    }
}

export class FriendCode {
    private code: string;
    public constructor(code: string) {
        const _code = this.validateAndCorrect(code);
        if (!_code.isValid) {
            throw new InvalidFriendCode();
        }
        this.code = _code.correctedCode;
    }

    public toString() {
        return this.code;
    }
    private validateAndCorrect(code: string): CorrectedFriendCode {
        let correctedCode = code;
        if (!correctedCode.startsWith("SW")) {
            correctedCode = "SW-".concat(code);
        }
        correctedCode = correctedCode.toUpperCase();

        const split = correctedCode.split("-");

        if (split.length != 4) {
            return new CorrectedFriendCode(false, "");
        }
        const regExpValidate = /^SW-\d{4}-\d{4}-\d{4}$/;

        if (correctedCode.match(regExpValidate)) {
            return new CorrectedFriendCode(true, correctedCode);
        }
        return new CorrectedFriendCode(false, "");
    }
}

export async function dBAddFriendCode(user: User, fc: FriendCode) {
    await Application.getInstance().getDb().dbInner()?.collection(FC_COLLECTION).updateOne(
        { userId: user.id },
        { $set: { friendCode: fc.toString() } },
        { upsert: true }
    );
}

export async function dBGetFriendCode(user: User): Promise<FriendCode | null> {
    const res = await Application.getInstance().getDb().dbInner()?.collection(FC_COLLECTION).findOne({ userId: user.id });
    if (!res) {
        return null;
    }
    return new FriendCode(res.friendCode);
}

export async function dBRemoveFriendCode(user: User): Promise<FriendCodeResult> {
    let res = await Application.getInstance().getDb().dbInner()?.collection(FC_COLLECTION).deleteOne({ userId: user.id });
    if (res && res.deletedCount > 0) {
        return FriendCodeResult.OK;
    }
    else {
        return FriendCodeResult.NOT_PRESENT;
    }
}

export async function dbGetAllFriendCodes(): Promise<Map<string, FriendCode>> {
    const res = await Application.getInstance().getDb().dbInner()?.collection(FC_COLLECTION).find().toArray();
    const map = new Map<string, FriendCode>();
    if (res) {
        for (const entry of res) {
            map.set(entry.userId, new FriendCode(entry.friendCode));
        }
    }
    return map;
}