import { Logger } from '../interfaces';


export const defaultLogger: typeof Logger =
    function defaultLogger({ level, message, error, meta }) {
        message = '[interceptions] ' + message.split('\n').join('. ');
        switch (level) {
            case 'error':
                if (error) console.error(error);
                console.log(message, ...meta);
                break;
            case 'warning':
                console.warn('Warning: ' + message, ...meta);
                break;
            case 'info':
                console.log(message, ...meta);
                break;
        }
    }
