import winston from "winston";
import chalk from "chalk";

const { combine, timestamp, printf, colorize } = winston.format;

const SYMBOLS: Record<string, string> = {
	error: "❌",
	warn: "⚠",
	info: "ℹ",
	http: "⇢",
	debug: "⚙",
	silly: "✿",
	success: "✔",
};

const COLORS: Record<string, chalk.Chalk> = {
	error: chalk.redBright,
	warn: chalk.yellowBright,
	info: chalk.cyanBright,
	http: chalk.magentaBright,
	debug: chalk.blueBright,
	silly: chalk.whiteBright,
	success: chalk.greenBright,
};

// serialize any value like console.log does
const serialize = (value: unknown): string => {
	if (typeof value === "string") return value;
	if (value instanceof Error) return value.stack ?? value.message;
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
};

const stripAnsi = (str: string) => str.replace(/\x1B\[[0-9;]*m/g, "");

const customFormat = printf(({ level, message, timestamp, ...rest }) => {
	const cleanLevel = stripAnsi(level);
	const color = COLORS[cleanLevel] ?? chalk.white;
	const symbol = color(SYMBOLS[cleanLevel] ?? "•");
	const label = color(`[${cleanLevel.toUpperCase()}]`);

	return `\n${symbol}  ${label}  ${serialize(message)}${
		Object.keys(rest).length ? "\n" + serialize(rest) : ""
	}  \n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ${timestamp}\n`;
});

// prevent logger file writes on vercel
const isServerless = !!process.env.VERCEL;

const transports: winston.transport[] = [new winston.transports.Console()];

if (!isServerless) {
	transports.push(
		new winston.transports.File({
			filename: "logs/error.log",
			level: "error",
			format: combine(timestamp(), customFormat),
		}),
	);
	transports.push(
		new winston.transports.File({
			filename: "logs/combined.log",
			format: combine(timestamp(), customFormat),
		}),
	);
}

const logger = winston.createLogger({
	level: "http",
	format: combine(
		// Make the date like: 11 May, 2026 06:02:09 PM
		timestamp({ format: "DD MMM, YYYY hh:mm:ss A" }),
		colorize({ all: true }),
		customFormat,
	),
	transports,
});

declare module "winston" {
	interface Logger {
		success(message: string): void;
	}
}

logger.success = (msg: string): void => {
	console.log(chalk.greenBright(`\n${SYMBOLS.success}  [SUCCESS]  ${msg}\n`));
};

export const morganStream = {
	write: (message: string) => logger.http(message.trim()),
};

export default logger;
