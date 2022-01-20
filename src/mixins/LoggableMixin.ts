
import type {
    ILogObject,
    ILoggableMixin,
} from '../interfaces'

/**
 * @utyfua:
 * - I understand `.debug` exists for causes like this
 * but in my practice I should collect such information
 * and save in logs witch I can easily filter it after.
 */
export function applyLoggableMixin(base: any): any {
    class LoggableMixin extends base implements ILoggableMixin {
        recordError(
            message: ILogObject["message"],
            error?: ILogObject["error"],
            ...meta: ILogObject["meta"]
        ) {
            this.logger({
                level: 'error',
                message,
                error,
                meta,
            })
        }

        recordInternalError(
            message: ILogObject["message"],
            ...meta: ILogObject["meta"]
        ) {
            const error = new Error(message);
            this.recordError(message, error, ...meta)
        }

        recordWarn(
            message: ILogObject["message"],
            ...meta: ILogObject["meta"]
        ) {
            this.logger({
                level: 'warn',
                message,
                meta,
            })
        }
    }
    return LoggableMixin
}
