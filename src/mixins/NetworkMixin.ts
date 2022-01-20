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
            ].includes(this.stage);
        }

        get isResponseCollecting() {
            return this.stage === RequestStage.sentRequest;
        }

        get isResponseCollected() {
            return [
                RequestStage.gotResponse,
                RequestStage.sentResponse,
            ].includes(this.stage);
        }

        get isResponseOverrideAvailable() {
            return [
                RequestStage.gotRequest,
                RequestStage.sentRequest,
                RequestStage.gotResponse,
            ].includes(this.stage);
        }

        get isResponseFinished() {
            return [
                RequestStage.sentResponse,
                RequestStage.closed,
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
