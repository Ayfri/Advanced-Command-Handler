import {DateTime} from 'luxon';
import {inspect} from 'util';

const LogType = {
	error: 'red',
	warn: 'yellow',
	info: 'blue',
	event: 'green',
	log: '#43804e',
	test: 'default',
	comment: 'gray',
};

const colors = {
	red: '#b52825',
	orange: '#e76a1f',
	gold: '#deae17',
	yellow: '#eeee23',
	green: '#3ecc2d',
	teal: '#11cc93',
	blue: '#2582ff',
	indigo: '#524cd9',
	violet: '#7d31cc',
	magenta: '#b154cf',
	pink: '#d070a0',
	brown: '#502f1e',
	black: '#000000',
	grey: '#6e6f77',
	white: '#ffffff',
	default: '#cccccc',
};

type ColorResolvable = NonNullable<keyof typeof colors | keyof typeof LogType | string>;

class Logger {
	private static logComments: boolean = true;

	
	public static comment(message: any, typeToShow: string = LogType.comment): void {
		if (Logger.logComments) {
			Logger.process(message, 'comment', typeToShow);
		}
	}

	public static error(message: any, typeToShow: string = LogType.error): void {
		Logger.process(message, 'error', typeToShow);
	}
	
	public static event(message: any, typeToShow: string = LogType.event): void {
		Logger.process(message, 'event', typeToShow);
	}
	
	public static info(message: any, typeToShow: string = LogType.info): void {
		Logger.process(message, 'info', typeToShow);
	}
	
	public static log(message: any, type: string, color: ColorResolvable = LogType.log): void {
		Logger.process(message, color, type);
	}

	public static setColor(color: ColorResolvable = colors.default, text: string = '', colorAfter: string = ''): string {
		if ((color = this.getColorFromColorResolvable(color))) {
			color =
				'\x1b[38;2;' +
				color
					.substring(1, 7)
					.match(/[0-9|a-f]{2}/gi)
					?.map(n => Number.parseInt(n, 16))
					.join(';') +
				'm';
		} else throw new Error('Waiting for a log type, color or HexColor but receive something else.');

		if (colorAfter) {
			if ((colorAfter = this.getColorFromColorResolvable(colorAfter))) {
				colorAfter =
					'\x1b[38;2;' +
					colorAfter
						.substring(1, 7)
						.match(/[0-9|a-f]{2}/gi)
						?.map(n => Number.parseInt(n, 16))
						.join(';') +
					'm';
			} else throw new Error('Waiting for a log type, color or HexColor but receive something else.');
		}

		return text ? color + text + (colorAfter ? colorAfter : '\x2b') : color;
	}

	public static test(message: any, typeToShow: string = LogType.test): void {
		Logger.process(message, 'test', typeToShow);
	}

	public static warn(message: any, typeToShow: string = LogType.warn): void {
		Logger.process(message, 'warn', typeToShow);
	}

	protected static process(text: any, type: ColorResolvable = 'test', message: string = ''): void {
		text = typeof text === 'string' ? text : inspect(text);
		const numberColorReplacer: (match: string) => string = (match: string): string => {
			return text.indexOf(';224;238;38m') !== -1 && text.indexOf(';224;238;38m') < text.indexOf(match) ? match : Logger.setColor('yellow') + match + Logger.setColor(type);
		};
		text = text.replace(/(?<![;\d])\d+(\.\d+)?(?!;|\d)/g, numberColorReplacer);
		text = text.replace(/\x2b+/gi, Logger.setColor(type));
		type = Logger.propertyInEnum(LogType, type) ?? type;
		text = `${Logger.setColor('#847270')}[${DateTime.local().toFormat('D HH:mm:ss.u')}]${Logger.setColor(type)}[${message.toUpperCase()}] ${text + Logger.setColor()}`;
		console.log(text);
	}

	private static getColorFromColorResolvable(colorAfter: string): ColorResolvable {
		return (
			Logger.propertyInEnum(LogType, Logger.propertyInEnum(colors, colorAfter) ?? '') ??
			Logger.propertyInEnum(colors, colorAfter) ??
			Logger.propertyInEnum(LogType, colorAfter)?.match(/#[0-9|a-f]{6}/i)?.[0] ??
			colorAfter.match(/#[0-9|a-f]{6}/i)?.[0] ??
			colors.default
		);
	}

	private static propertyInEnum<V extends {[k: string]: any}>(enumObject: V, property: string): keyof V | undefined {
		return property in enumObject ? enumObject[property] : undefined;
	}
}

export {Logger, LogType, colors};