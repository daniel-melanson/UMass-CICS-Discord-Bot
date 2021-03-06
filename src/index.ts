import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const { formatEmbed } = await import("Discord/formatting");
const { login, announce } = await import("Discord/server");
const { getInSessionSemester, getCurrentSemesters } = await import("UMass/calendar");
const { getCICSEvents } = await import("UMass/events");

dotenv.config();
const sameDay = (d0: Date, d1: Date) =>
	d0.getUTCDate() === d1.getUTCDate() &&
	d0.getUTCMonth() === d1.getUTCMonth() &&
	d0.getUTCFullYear() === d1.getUTCFullYear();

async function academicCalendarAnnouncement() {
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
	try {
		const semesters = await getCurrentSemesters();
		for (const semester of semesters) {
			for (const event of semester.events) {
				const date = event.date;
				if (sameDay(today, date)) {
					await announce(
						"university",
						formatEmbed({
							title: `${semester.season} ${semester.year} Academic Calendar Notice`,
							description: event.description,
						}),
					);
				} else if (sameDay(tomorrow, date)) {
					await announce(
						"general",
						formatEmbed({
							title: `${semester.season} ${semester.year} Academic Calendar Notice (TOMORROW)`,
							description: event.description,
						}),
					);
				}
			}
		}
	} catch (e) {
		console.warn(`Unable to post Academic Calendar Notice: ${e}`);
	}
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
async function semesterPercentAnnouncement() {
	try {
		const semester = await getInSessionSemester();
		if (semester) {
			const dayDiff = (d0: Date, d1: Date) => Math.ceil(Math.abs(d0.valueOf() - d1.valueOf()) / MS_PER_DAY);
			const semesterDays = dayDiff(semester.startDate, semester.endDate);
			const remainingDays = dayDiff(new Date(), semester.endDate);

			announce(
				"general",
				`We are currently **${Math.floor(
					((semesterDays - remainingDays) / semesterDays) * 100,
				)}%** through the semester (Not including exams).`,
			);
		}
	} catch (e) {
		console.warn(`Unable to post semester percentage: ${e}`);
	}
}

async function cicsEventAnnouncement() {
	try {
		const events = await getCICSEvents();

		for (const event of events) {
			const fields = [];

			if (event.speaker)
				fields.push({
					name: "Speaker(s)",
					value: event.speaker,
				});

			if (event.time)
				fields.push({
					name: "Time",
					value: `Today (${new Date().toLocaleDateString()}) at ` + event.time,
				});

			await announce(
				"cics-events",
				formatEmbed({
					title: event.title,
					url: event.link,
					description: event.body,
					fields: fields,
				}),
			);
		}
	} catch (e) {
		console.warn("[CICS-EVENTS] Unable to get events: " + e);
	}
}

console.log("Logging in...");
login(process.env["DISCORD_TOKEN"]!)
	.then(() => {
		const localSchedule = (exp: string, func: () => void) =>
			cron.schedule(exp, func, {
				timezone: "America/New_York",
			});

		localSchedule("0 0 7 * * 1", semesterPercentAnnouncement);
		localSchedule("0 0 7 * * *", academicCalendarAnnouncement);
		localSchedule("0 0 7 * * *", cicsEventAnnouncement);
	})
	.catch(error => {
		console.error("[DISCORD] Unable to login: ", error);
		process.exit(-1);
	});
