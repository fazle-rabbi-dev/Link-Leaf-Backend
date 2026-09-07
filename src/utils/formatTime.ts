export const formatTime = (date: Date): string => {
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
		timeZone: "UTC",
	}).format(date);
};
