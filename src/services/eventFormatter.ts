import { CalendarEvent } from './gasService';
import { DateUtils } from '../utils/dateUtils';

export class EventFormatter {
    static formatEventsForReport(events: CalendarEvent[]): string {
        if (events.length === 0) {
            return '## 本日のMTG予定\n\n*予定されたミーティングはありません*\n\n';
        }

        const formattedEvents = events
            .filter(event => this.shouldIncludeEvent(event))
            .map(event => this.formatSingleEvent(event))
            .join('\n');

        return `## 本日のMTG予定\n\n${formattedEvents}\n\n`;
    }

    static formatEventsAsList(events: CalendarEvent[]): string {
        if (events.length === 0) {
            return '*予定されたミーティングはありません*';
        }

        return events
            .filter(event => this.shouldIncludeEvent(event))
            .map(event => this.formatSingleEvent(event))
            .join('\n');
    }

    private static shouldIncludeEvent(event: CalendarEvent): boolean {
        // Filter out events without titles
        if (!event.title || event.title.trim() === '') {
            return false;
        }

        return true;
    }

    private static formatSingleEvent(event: CalendarEvent): string {
        if (event.isAllDay) {
            const location = event.location ? ` @ ${event.location}` : '';
            const attendeesInfo = event.attendees > 0 ? ` (参加者: ${event.attendees}名)` : '';
            return `- 終日: ${event.title}${location}${attendeesInfo}`;
        }

        const startTime = this.formatTime(event.startTime);
        const endTime = this.formatTime(event.endTime);
        const timeRange = `${startTime}-${endTime}`;
        
        const title = event.title;
        const location = event.location ? ` @ ${event.location}` : '';
        const attendeesInfo = event.attendees > 0 ? ` (参加者: ${event.attendees}名)` : '';
        
        return `- ${timeRange}: ${title}${location}${attendeesInfo}`;
    }

    private static formatTime(isoString: string): string {
        try {
            return DateUtils.formatTime(isoString);
        } catch (error) {
            return '時間未定';
        }
    }

    static formatEventDetails(event: CalendarEvent): string {
        const details = [];
        
        details.push(`**${event.title}**`);
        
        if (!event.isAllDay) {
            const startTime = this.formatTime(event.startTime);
            const endTime = this.formatTime(event.endTime);
            const duration = DateUtils.formatDuration(event.startTime, event.endTime);
            details.push(`時間: ${startTime} - ${endTime} (${duration})`);
        } else {
            details.push(`時間: 終日`);
        }
        
        if (event.location) {
            details.push(`場所: ${event.location}`);
        }
        
        if (event.attendees > 0) {
            details.push(`参加者: ${event.attendees}名`);
        }
        
        return details.join('\n');
    }

    static formatEventSummary(events: CalendarEvent[]): string {
        const validEvents = events.filter(event => this.shouldIncludeEvent(event));
        
        if (validEvents.length === 0) {
            return '本日は予定されたミーティングはありません。';
        }

        const allDayEvents = validEvents.filter(event => event.isAllDay);
        const timedEvents = validEvents.filter(event => !event.isAllDay);

        let summary = `本日は${validEvents.length}件のイベントが予定されています`;

        if (timedEvents.length > 0) {
            const totalDuration = timedEvents.reduce((total, event) => {
                try {
                    return total + DateUtils.getDurationInMinutes(event.startTime, event.endTime);
                } catch (error) {
                    return total;
                }
            }, 0);

            const hours = Math.floor(totalDuration / 60);
            const minutes = totalDuration % 60;
            const durationText = hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
            
            summary += `（ミーティング時間: ${durationText}`;
            
            if (allDayEvents.length > 0) {
                summary += `、終日イベント: ${allDayEvents.length}件`;
            }
            
            summary += '）';
        } else if (allDayEvents.length > 0) {
            summary += `（すべて終日イベント）`;
        }

        return summary + '。';
    }

    static getEventsByTimeOfDay(events: CalendarEvent[]): {
        morning: CalendarEvent[];
        afternoon: CalendarEvent[];
        evening: CalendarEvent[];
        allDay: CalendarEvent[];
    } {
        const morning: CalendarEvent[] = [];
        const afternoon: CalendarEvent[] = [];
        const evening: CalendarEvent[] = [];
        const allDay: CalendarEvent[] = [];

        events.forEach(event => {
            if (event.isAllDay) {
                allDay.push(event);
                return;
            }

            try {
                const startHour = new Date(event.startTime).getHours();
                if (startHour < 12) {
                    morning.push(event);
                } else if (startHour < 18) {
                    afternoon.push(event);
                } else {
                    evening.push(event);
                }
            } catch (error) {
                // If we can't parse the time, put it in afternoon as default
                afternoon.push(event);
            }
        });

        return { morning, afternoon, evening, allDay };
    }
}