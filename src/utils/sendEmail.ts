import nodemailer from "nodemailer";
import envConfig from "../config/env.js";
import logger from "./logger.js";

type EmailOptions = {
	to: string;
	subject: string;
	html: string;
};

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: envConfig.smtp.user,
		pass: envConfig.smtp.pass,
	},
});

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
	logger.info("Sending email...");

	try {
		await transporter.sendMail({
			from: envConfig.smtp.from,
			to,
			subject,
			html,
		});
		logger.info(`📧 Email sent to ${to}`);
		return true;
	} catch (error: any) {
		logger.error(`📧 Failed to send email to ${to} with subject: ${subject}: ${error.message}`);
		console.log(error);
		return false;
	}
};
