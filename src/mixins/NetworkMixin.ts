import { INetworkMixin, RequestStage } from '../interfaces'

export function applyNetworkMixin(base: any): any {
    /**
     * Expecting this.stage in runtime
     */
    class NetworkMixin extends base implements INetworkMixin {
        get isRequestOverrideAvailable() {
            return [
                // RequestStage.initial,
                RequestStage.gotRequest,
                //@ts-ignore
            ].includes(this.stage);
        }

        get isResponseCollecting() {
            //@ts-ignore
            return this.stage === RequestStage.sentRequest;
        }

        get isResponseCollected() {
            return [
                RequestStage.gotResponse,
                RequestStage.sentResponse,
                //@ts-ignore
            ].includes(this.stage);
        }

        get isResponseOverrideAvailable() {
            return [
                RequestStage.gotRequest,
                RequestStage.sentRequest,
                RequestStage.gotResponse,
                //@ts-ignore
            ].includes(this.stage);
        }

        get isResponseFinished() {
            return [
                RequestStage.sentResponse,
                RequestStage.closed,
                //@ts-ignore
            ].includes(this.stage);
        }

        // todo: rework relations
        get json() {
            try {
                return JSON.parse(this.body);
            } catch (e) {
                return undefined;
            }
        }
        set json(obj: any) {
            this.body = JSON.stringify(obj)
        }
    }
    return NetworkMixin;
}
