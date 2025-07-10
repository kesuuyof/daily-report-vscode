export class DateUtils {
    static getTodayDateString(): string {
        const today = new Date();
        // Use local time instead of UTC to avoid timezone issues
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static getTodayStartDateTime(): string {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString();
    }

    static getTodayEndDateTime(): string {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return today.toISOString();
    }

    static formatTime(dateTimeString: string): string {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
    }

    static formatDate(dateTimeString: string): string {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    static formatDateTime(dateTimeString: string): string {
        const date = new Date(dateTimeString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    static getDurationInMinutes(startDateTime: string, endDateTime: string): number {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    static formatDuration(startDateTime: string, endDateTime: string): string {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
        } else {
            return `${minutes}分`;
        }
    }

    static isToday(dateTimeString: string): boolean {
        const date = new Date(dateTimeString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    static isAllDayEvent(startDateTime: string, endDateTime: string): boolean {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        
        // Check if start time is 00:00 and end time is 00:00 of next day
        return start.getHours() === 0 && 
               start.getMinutes() === 0 && 
               end.getHours() === 0 && 
               end.getMinutes() === 0 &&
               (end.getTime() - start.getTime()) >= (24 * 60 * 60 * 1000);
    }

    static getTimeZone(): string {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
}