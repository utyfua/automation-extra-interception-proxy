import { RequestStage } from '../interfaces/index'

export function getStageEnhancedErrorMessage(key: string, stage: RequestStage): string {
    let message: string = 'unknown stage??'
    switch (stage) {
        // case RequestStage.initial:
        //     message = 'the request was not initialized properly yet';
        //     break;
        case RequestStage.gotRequest:
            message = 'the request was not initialized properly yet';
            break;
        case RequestStage.sentRequest:
            message = 'the request started to getting the response';
            break;
        case RequestStage.gotResponse:
            message = 'the request already got the response';
            break;
        case RequestStage.sentResponse:
            message = 'response for this request already were send to puppeteer';
            break;
        case RequestStage.closed:
            message = 'destination browser of page were already closed';
            break;
        default:
            message = 'the request currently in unknown stage';
            break;
    }

    return `Unable to enhance ${key} because ${message}`
}
