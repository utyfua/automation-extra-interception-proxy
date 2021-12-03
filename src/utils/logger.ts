import { Logger } from '../interfaces';


export const defaultLogger: typeof Logger =
    function defaultLogger({ level, message, error, meta }) {
        message = '[interceptions] ' + message.split('\n').join('. ');
        switch (level) {
            case 'error':
                console.log(message, ...meta);
                console.error(error);
                break;
            case 'warning':
                console.warn(message, ...meta);
                break;
            case 'info':
                console.log(message, ...meta);
                break;
        }
    }
